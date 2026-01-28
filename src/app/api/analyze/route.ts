import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdf } from "@/lib/api/pdfco";
import { parseResumeWithAI, analyzeProfile } from "@/lib/api/claude";
import { findProfessionalProfiles } from "@/lib/api/serpapi";
import { getLinkedInProfile, lookupLinkedInByEmail } from "@/lib/api/brightdata";
import { getSkillDemand } from "@/lib/api/jobspikr";
import type { LinkedInProfile, WebPresenceResult } from "@/types";

export const maxDuration = 60; // Allow up to 60 seconds for the full analysis

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No resume file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Step 1: Extract text from PDF
    console.log("Step 1: Extracting text from PDF...");
    let rawText: string;
    try {
      rawText = await extractTextFromPdf(buffer, file.name);
    } catch (error) {
      console.error("PDF extraction failed:", error);
      return NextResponse.json(
        { success: false, error: "Failed to extract text from PDF" },
        { status: 500 }
      );
    }

    // Step 2: Parse resume with Claude AI
    console.log("Step 2: Parsing resume with AI...");
    const parsedResume = await parseResumeWithAI(rawText);

    // Step 3: Search for web presence (parallel operations)
    console.log("Step 3: Searching for web presence...");
    const searchContext = {
      company: parsedResume.experience?.[0]?.company,
      title: parsedResume.experience?.[0]?.title,
      location: parsedResume.location || undefined,
      email: parsedResume.email || undefined,
    };

    let webPresence: WebPresenceResult[] = [];
    let linkedInProfile: LinkedInProfile | null = null;

    try {
      // Search for profiles using name
      if (parsedResume.fullName) {
        webPresence = await findProfessionalProfiles(
          parsedResume.fullName,
          searchContext
        );
      }

      // Try to find and enrich LinkedIn profile
      const linkedInResult = webPresence.find((p) => p.platform === "linkedin");
      if (linkedInResult?.url) {
        try {
          linkedInProfile = await getLinkedInProfile(linkedInResult.url);
        } catch (error) {
          console.error("LinkedIn enrichment failed:", error);
        }
      } else if (parsedResume.email) {
        // Try lookup by email
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

    // Step 4: Get labor market data for skills
    console.log("Step 4: Getting labor market data...");
    let skillDemands: Awaited<ReturnType<typeof getSkillDemand>> = [];
    try {
      const skillNames = parsedResume.skills?.map((s) => s.name) || [];
      if (skillNames.length > 0) {
        skillDemands = await getSkillDemand(skillNames.slice(0, 15));
      }
    } catch (error) {
      console.error("Labor market data fetch failed:", error);
    }

    // Step 5: Generate comprehensive analysis with Claude
    console.log("Step 5: Generating comprehensive analysis...");
    const analysis = await analyzeProfile(
      parsedResume,
      webPresence,
      linkedInProfile,
      skillDemands
    );

    return NextResponse.json({
      success: true,
      data: {
        parsedResume,
        webPresence,
        linkedInProfile,
        skillDemands,
        analysis,
      },
    });
  } catch (error) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 }
    );
  }
}
