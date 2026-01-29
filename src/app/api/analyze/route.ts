import { NextRequest } from "next/server";
import { extractTextFromPdf } from "@/lib/api/pdfco";
import { parseResumeWithAI, analyzeProfile } from "@/lib/api/claude";
import { deepWebSearch, summarizeDeepSearchForAnalysis } from "@/lib/api/serpapi";
import { getLinkedInProfile, lookupLinkedInByEmail } from "@/lib/api/brightdata";
import { getSkillDemand } from "@/lib/api/jobspikr";
import type { LinkedInProfile, WebPresenceResult, DeepSearchResults } from "@/types";

export const maxDuration = 120; // Increased for deeper searches

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

        // Step 3: Deep web search - comprehensive Google searches
        sendProgress(3, "Performing deep web search...", "Searching Google for profiles, news, publications, speaking engagements, patents, and more");
        const searchContext = {
          company: parsedResume.experience?.[0]?.company,
          title: parsedResume.experience?.[0]?.title,
          location: parsedResume.location || undefined,
          email: parsedResume.email || undefined,
          skills: parsedResume.skills?.slice(0, 10).map(s => s.name),
          industry: parsedResume.experience?.[0]?.description?.split(" ").slice(0, 5).join(" "),
        };

        let deepSearchResults: DeepSearchResults | null = null;
        let webPresence: WebPresenceResult[] = [];
        let linkedInProfile: LinkedInProfile | null = null;

        try {
          if (parsedResume.fullName) {
            // Perform comprehensive deep web search
            deepSearchResults = await deepWebSearch(parsedResume.fullName, searchContext);

            sendProgress(
              3,
              "Deep search complete",
              `Found ${deepSearchResults.totalResults} results across ${deepSearchResults.searchesPerformed} searches (${deepSearchResults.summary.overallVisibility} visibility)`
            );

            // Convert deep search profiles to legacy WebPresenceResult format for backward compatibility
            webPresence = deepSearchResults.profiles.map(p => ({
              platform: p.platform,
              url: p.url,
              title: p.title,
              description: p.snippet,
            }));

            // Add top news items to web presence
            for (const news of deepSearchResults.news.slice(0, 5)) {
              webPresence.push({
                platform: `news:${news.platform}`,
                url: news.url,
                title: news.title,
                description: news.snippet,
              });
            }

            // Add notable items from other categories
            const notableItems = [
              ...deepSearchResults.publications.slice(0, 3).map(p => ({ ...p, categoryLabel: "publication" })),
              ...deepSearchResults.speaking.slice(0, 3).map(p => ({ ...p, categoryLabel: "speaking" })),
              ...deepSearchResults.awards.slice(0, 2).map(p => ({ ...p, categoryLabel: "award" })),
              ...deepSearchResults.press.slice(0, 3).map(p => ({ ...p, categoryLabel: "press" })),
              ...deepSearchResults.patents.slice(0, 2).map(p => ({ ...p, categoryLabel: "patent" })),
              ...deepSearchResults.videos.slice(0, 2).map(p => ({ ...p, categoryLabel: "video" })),
              ...deepSearchResults.opensource.slice(0, 3).map(p => ({ ...p, categoryLabel: "opensource" })),
            ];

            for (const item of notableItems) {
              webPresence.push({
                platform: `${item.categoryLabel}:${item.platform}`,
                url: item.url,
                title: item.title,
                description: item.snippet,
              });
            }
          }

          // Try to enrich LinkedIn profile
          const linkedInResult = deepSearchResults?.profiles.find((p) => p.platform === "linkedin");
          if (linkedInResult?.url) {
            sendProgress(3, "Enriching LinkedIn profile...", "Fetching detailed profile data");
            try {
              linkedInProfile = await getLinkedInProfile(linkedInResult.url);
            } catch (error) {
              console.error("LinkedIn enrichment failed:", error);
            }
          } else if (parsedResume.email) {
            sendProgress(3, "Looking up LinkedIn by email...", "Attempting to find LinkedIn profile");
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
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error("Web presence search failed:", errorMsg);
          // Send a warning progress message so users know web search failed
          if (errorMsg.includes("Invalid API key") || errorMsg.includes("401")) {
            sendProgress(3, "Web search unavailable", "Search API key needs to be configured - skipping web presence discovery");
          } else {
            sendProgress(3, "Web search limited", `Some searches failed: ${errorMsg.slice(0, 100)}`);
          }
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

        // Step 5: Generate comprehensive analysis with deep search context
        sendProgress(5, "Generating comprehensive analysis...", "AI is analyzing your profile with deep web search data");

        // Create enhanced analysis context with deep search summary
        const deepSearchSummary = deepSearchResults
          ? summarizeDeepSearchForAnalysis(deepSearchResults)
          : "No deep search results available.";

        const analysis = await analyzeProfile(
          parsedResume,
          webPresence,
          linkedInProfile,
          skillDemands,
          deepSearchSummary
        );

        sendProgress(5, "Analysis complete!", "Your comprehensive profile report is ready");

        // Send final result with deep search data
        sendResult({
          parsedResume,
          webPresence,
          linkedInProfile,
          skillDemands,
          analysis,
          deepSearchResults,
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
