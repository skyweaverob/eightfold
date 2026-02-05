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

          // Try to enrich LinkedIn profile - only use personal profile URLs (/in/)
          // and verify the name AND context matches the resume
          const linkedInResults = deepSearchResults?.profiles.filter((p) =>
            p.platform === "linkedin" && p.url.includes("/in/")
          ) || [];

          console.log(`\n=== LinkedIn Profile Matching ===`);
          console.log(`Resume name: "${parsedResume.fullName}"`);
          console.log(`Resume companies: ${JSON.stringify(parsedResume.experience?.slice(0, 3).map(e => e.company))}`);
          console.log(`Resume titles: ${JSON.stringify(parsedResume.experience?.slice(0, 3).map(e => e.title))}`);
          console.log(`Found ${linkedInResults.length} LinkedIn /in/ URLs from search`);

          const resumeName = parsedResume.fullName?.toLowerCase() || "";
          const resumeCompanies = parsedResume.experience?.slice(0, 3).map(e => e.company?.toLowerCase()).filter(Boolean) || [];
          const resumeTitles = parsedResume.experience?.slice(0, 3).map(e => e.title?.toLowerCase()).filter(Boolean) || [];

          // Try each LinkedIn candidate in order until we find a verified match
          for (const candidate of linkedInResults) {
            console.log(`\n--- Checking LinkedIn candidate: ${candidate.url}`);
            console.log(`  Search result title: "${candidate.title}"`);
            console.log(`  Search result snippet: "${candidate.snippet?.slice(0, 100)}..."`);

            // Pre-filter: Check if search result mentions the person's name
            const resultText = `${candidate.title} ${candidate.snippet}`.toLowerCase();
            const nameParts = resumeName.split(" ").filter(p => p.length > 2);
            const searchNameMatch = nameParts.filter(part => resultText.includes(part)).length;

            if (searchNameMatch < 1 && resumeName) {
              console.log(`  SKIP: Search result doesn't mention name (matched ${searchNameMatch}/${nameParts.length} name parts)`);
              continue;
            }

            // Fetch the actual LinkedIn profile
            sendProgress(3, "Enriching LinkedIn profile...", `Checking ${candidate.url.split("/in/")[1]?.split("/")[0] || "profile"}`);
            try {
              const fetchedProfile = await getLinkedInProfile(candidate.url);

              console.log(`  Fetched profile: "${fetchedProfile.fullName}" - "${fetchedProfile.headline}"`);
              console.log(`  Fetched company: "${fetchedProfile.experience?.[0]?.company}"`);
              console.log(`  Has ${fetchedProfile.recentPosts?.length || 0} posts`);

              // Verify name match
              const fetchedName = fetchedProfile.fullName?.toLowerCase() || "";
              const nameMatchCount = nameParts.filter(part => fetchedName.includes(part)).length;
              const nameMatches = nameMatchCount >= 1 || !resumeName;
              console.log(`  Name check: ${nameMatchCount}/${nameParts.length} parts match → ${nameMatches ? "PASS" : "FAIL"}`);

              if (!nameMatches) {
                console.log(`  SKIP: Name mismatch - "${fetchedProfile.fullName}" vs "${parsedResume.fullName}"`);
                continue;
              }

              // Verify context match (company/title/academic)
              const fetchedHeadline = fetchedProfile.headline?.toLowerCase() || "";
              const fetchedCompany = fetchedProfile.experience?.[0]?.company?.toLowerCase() || "";
              const fetchedAllCompanies = fetchedProfile.experience?.map(e => e.company?.toLowerCase()).filter(Boolean) || [];
              const fetchedConnections = fetchedProfile.connections || 0;

              // SAFETY CHECK 1: Reject student profiles for professional resumes
              const isStudentProfile = fetchedHeadline.includes("student") || fetchedHeadline.includes("studying");
              const resumeHasProfessionalExp = resumeTitles.some(t =>
                t && (t.includes("professor") || t.includes("director") || t.includes("manager") ||
                      t.includes("engineer") || t.includes("analyst") || t.includes("senior") ||
                      t.includes("lead") || t.includes("head") || t.includes("vp") || t.includes("chief"))
              );

              if (isStudentProfile && resumeHasProfessionalExp) {
                console.log(`  ✗ REJECTED: Student profile ("${fetchedHeadline}") doesn't match professional resume`);
                continue;
              }

              // SAFETY CHECK 2: Very low connections for experienced professional
              const yearsExperience = parsedResume.experience?.length || 0;
              if (fetchedConnections < 50 && yearsExperience >= 3 && resumeHasProfessionalExp) {
                console.log(`  ✗ REJECTED: Low connections (${fetchedConnections}) for experienced professional (${yearsExperience} roles)`);
                continue;
              }

              // Company match: any resume company appears in LinkedIn companies or headline
              const companyMatches = resumeCompanies.some(c => {
                if (!c) return false;
                // Extract key company words (skip common words)
                const companyWords = c.split(/\s+/).filter(w => w.length > 3 && !["the", "inc", "llc", "corp", "company", "group"].includes(w));
                return companyWords.some(word =>
                  fetchedHeadline.includes(word) ||
                  fetchedCompany.includes(word) ||
                  fetchedAllCompanies.some(fc => fc?.includes(word))
                );
              });
              console.log(`  Company check: ${companyMatches ? "PASS" : "FAIL"} (resume: [${resumeCompanies.join(", ")}] vs fetched: [${fetchedAllCompanies.slice(0, 3).join(", ")}])`);

              // Title match: key title words appear in headline (stricter - need "professor" specifically for professors)
              const titleMatches = resumeTitles.some(t => {
                if (!t) return false;
                // For professor titles, require "professor" to be in headline
                if (t.includes("professor")) {
                  return fetchedHeadline.includes("professor");
                }
                // Get significant title words (not prepositions etc)
                const titleWords = t.split(/\s+/).filter(w => w.length > 3 && !["the", "and", "for", "with"].includes(w));
                return titleWords.some(word => fetchedHeadline.includes(word));
              });
              console.log(`  Title check: ${titleMatches ? "PASS" : "FAIL"} (resume titles: [${resumeTitles.join(", ")}] vs headline: "${fetchedHeadline}")`);

              // Academic match: STRICT - require same university name OR professor in headline
              const resumeUniversities = resumeCompanies.filter(c => c && (c.includes("university") || c.includes("college") || c.includes("institute")));
              const resumeHasAcademic = resumeUniversities.length > 0;

              // For academic profiles, require SPECIFIC match
              let academicMatches = false;
              if (resumeHasAcademic) {
                // Check if same university name appears in LinkedIn
                const sameUniversity = resumeUniversities.some(uni => {
                  const uniWords = uni.split(/\s+/).filter(w => w.length > 3 && !["university", "college", "institute", "the", "of"].includes(w));
                  return uniWords.some(word =>
                    fetchedHeadline.includes(word) ||
                    fetchedAllCompanies.some(fc => fc?.includes(word))
                  );
                });
                // OR has "professor" in headline
                const isProfessor = fetchedHeadline.includes("professor");
                academicMatches = sameUniversity || isProfessor;
                console.log(`  Academic check: sameUniversity=${sameUniversity}, isProfessor=${isProfessor} → ${academicMatches ? "PASS" : "FAIL"}`);
              } else {
                console.log(`  Academic check: N/A (resume not academic)`);
              }

              // Accept if: name matches AND (company OR title OR academic matches)
              // If no resume companies to compare, require title match
              const contextMatches = companyMatches || titleMatches || academicMatches;
              const noContextToCompare = resumeCompanies.length === 0 && resumeTitles.length === 0;

              console.log(`  Context verdict: company=${companyMatches}, title=${titleMatches}, academic=${academicMatches}, noContext=${noContextToCompare}`);
              console.log(`  Connections: ${fetchedConnections}, IsStudent: ${isStudentProfile}`);

              if (contextMatches || noContextToCompare) {
                linkedInProfile = fetchedProfile;
                console.log(`  ✓ ACCEPTED: "${fetchedProfile.fullName}" at "${fetchedProfile.headline}" (${fetchedConnections} connections)`);
                break; // Found a verified match, stop searching
              } else {
                console.log(`  ✗ REJECTED: Context mismatch - likely different person with same name`);
              }
            } catch (error) {
              console.error(`  ERROR fetching profile:`, error);
            }
          }

          if (!linkedInProfile && linkedInResults.length > 0) {
            console.log(`\nNo verified LinkedIn profile found after checking ${linkedInResults.length} candidates`);
          } else if (!linkedInResults.length) {
            console.log(`\nNo LinkedIn /in/ URLs found in search results`);
          }
          console.log(`=== End LinkedIn Matching ===\n`);

          // Try email lookup if we still don't have a LinkedIn profile
          if (!linkedInProfile && parsedResume.email) {
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
