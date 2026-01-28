import { NextRequest } from "next/server";
import { extractTextFromPdf } from "@/lib/api/pdfco";
import { parseResumeWithAI, analyzeProfile } from "@/lib/api/claude";
import { findProfessionalProfiles } from "@/lib/api/serpapi";
import { getLinkedInProfile, lookupLinkedInByEmail } from "@/lib/api/brightdata";
import { getSkillDemand } from "@/lib/api/jobspikr";
import type { LinkedInProfile, WebPresenceResult } from "@/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (step: number, message: string, detail?: string) => {
        const data = JSON.stringify({ type: "progress", step, message, detail }) + "\n";
        controller.enqueue(encoder.encode(data));
      };

      const sendError = (error: string) => {
        const data = JSON.stringify({ type: "error", error }) + "\n";
        controller.enqueue(encoder.encode(data));
        controller.close();
      };

      const sendResult = (data: unknown) => {
        const result = JSON.stringify({ type: "result", success: true, data }) + "\n";
        controller.enqueue(encoder.encode(result));
        controller.close();
      };

      try {
        const formData = await request.formData();
        const file = formData.get("resume") as File | null;

        if (!file) {
          sendError("No resume file provided");
          return;
        }

        if (!file.name.toLowerCase().endsWith(".pdf")) {
          sendError("Only PDF files are supported");
          return;
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Step 1: Extract text from PDF
        sendProgress(1, "Extracting text from resume...", "Using PDF.co to parse your document");
        let rawText: string;
        try {
          rawText = await extractTextFromPdf(buffer, file.name);
        } catch (error) {
          console.error("PDF extraction failed:", error);
          sendError("Failed to extract text from PDF. Please ensure it's a valid PDF file.");
          return;
        }

        // Step 2: Parse resume with Claude AI
        sendProgress(2, "Analyzing resume content...", "AI is identifying your skills, experience, and education");
        const parsedResume = await parseResumeWithAI(rawText);
        sendProgress(2, "Resume parsed successfully", `Found ${parsedResume.skills?.length || 0} skills and ${parsedResume.experience?.length || 0} work experiences`);

        // Step 3: Search for web presence
        sendProgress(3, "Searching for your web presence...", "Looking for profiles on LinkedIn, GitHub, Twitter, and more");
        const searchContext = {
          company: parsedResume.experience?.[0]?.company,
          title: parsedResume.experience?.[0]?.title,
          location: parsedResume.location || undefined,
          email: parsedResume.email || undefined,
        };

        let webPresence: WebPresenceResult[] = [];
        let linkedInProfile: LinkedInProfile | null = null;

        try {
          if (parsedResume.fullName) {
            webPresence = await findProfessionalProfiles(
              parsedResume.fullName,
              searchContext
            );
            sendProgress(3, "Web search complete", `Found ${webPresence.length} potential profiles`);
          }

          // Try to enrich LinkedIn profile
          const linkedInResult = webPresence.find((p) => p.platform === "linkedin");
          if (linkedInResult?.url) {
            sendProgress(3, "Enriching LinkedIn profile...", "Fetching detailed profile data");
            try {
              linkedInProfile = await getLinkedInProfile(linkedInResult.url);
            } catch (error) {
              console.error("LinkedIn enrichment failed:", error);
            }
          } else if (parsedResume.email) {
            try {
              const linkedInUrl = await lookupLinkedInByEmail(parsedResume.email);
              if (linkedInUrl) {
                linkedInProfile = await getLinkedInProfile(linkedInUrl);
                webPresence.push({
                  platform: "linkedin",
                  url: linkedInUrl,
                  title: linkedInProfile.headline,
                  description: linkedInProfile.summary,
                });
              }
            } catch (error) {
              console.error("LinkedIn lookup by email failed:", error);
            }
          }
        } catch (error) {
          console.error("Web presence search failed:", error);
        }

        // Step 4: Get labor market data
        sendProgress(4, "Analyzing labor market data...", "Evaluating demand for your skills");
        let skillDemands: Awaited<ReturnType<typeof getSkillDemand>> = [];
        try {
          const skillNames = parsedResume.skills?.map((s) => s.name) || [];
          if (skillNames.length > 0) {
            skillDemands = await getSkillDemand(skillNames.slice(0, 15));
            sendProgress(4, "Market analysis complete", `Analyzed ${skillDemands.length} skills`);
          }
        } catch (error) {
          console.error("Labor market data fetch failed:", error);
        }

        // Step 5: Generate comprehensive analysis
        sendProgress(5, "Generating comprehensive analysis...", "AI is creating your personalized career insights");
        const analysis = await analyzeProfile(
          parsedResume,
          webPresence,
          linkedInProfile,
          skillDemands
        );

        sendProgress(5, "Analysis complete!", "Your profile report is ready");

        // Send final result
        sendResult({
          parsedResume,
          webPresence,
          linkedInProfile,
          skillDemands,
          analysis,
        });
      } catch (error) {
        console.error("Analysis failed:", error);
        sendError(error instanceof Error ? error.message : "Analysis failed");
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
