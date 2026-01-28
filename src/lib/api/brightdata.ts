import type { LinkedInProfile, WorkExperience, Education } from "@/types";

const BRIGHTDATA_API_URL = "https://api.brightdata.com";

// Bright Data Web Unlocker for LinkedIn scraping
// Note: This requires Bright Data Web Unlocker or Scraping Browser product

interface BrightDataLinkedInProfile {
  name?: string;
  headline?: string;
  about?: string;
  location?: string;
  connections?: string;
  experience?: {
    title?: string;
    company?: string;
    location?: string;
    duration?: string;
    description?: string;
  }[];
  education?: {
    school?: string;
    degree?: string;
    field?: string;
    dates?: string;
  }[];
  skills?: string[];
}

export async function getLinkedInProfile(
  linkedinUrl: string
): Promise<LinkedInProfile> {
  const apiKey = process.env.BRIGHTDATA_API_KEY;

  if (!apiKey) {
    console.log("BRIGHTDATA_API_KEY not configured, skipping LinkedIn enrichment");
    // Return minimal profile based on URL
    return {
      url: linkedinUrl,
    };
  }

  try {
    // Bright Data's Web Unlocker/Scraping API
    // This triggers a scrape of the LinkedIn profile
    const response = await fetch(`${BRIGHTDATA_API_URL}/datasets/v3/trigger`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dataset_id: "gd_l1viktl72bvl7bjuj0", // LinkedIn People Profile dataset
        url: linkedinUrl,
        format: "json",
      }),
    });

    if (!response.ok) {
      console.error(`Bright Data request failed: ${response.status} ${response.statusText}`);
      return { url: linkedinUrl };
    }

    const data: BrightDataLinkedInProfile = await response.json();

    // Transform to our format
    const experience: WorkExperience[] =
      data.experience?.map((exp) => ({
        company: exp.company || "Unknown",
        title: exp.title || "Unknown",
        location: exp.location,
        description: exp.description,
      })) || [];

    const education: Education[] =
      data.education?.map((edu) => ({
        institution: edu.school || "Unknown",
        degree: edu.degree,
        field: edu.field,
      })) || [];

    // Parse connections (e.g., "500+ connections" -> 500)
    const connectionsStr = data.connections || "";
    const connectionsMatch = connectionsStr.match(/(\d+)/);
    const connections = connectionsMatch ? parseInt(connectionsMatch[1], 10) : undefined;

    return {
      url: linkedinUrl,
      fullName: data.name,
      headline: data.headline,
      summary: data.about,
      location: data.location,
      connections,
      experience,
      education,
      skills: data.skills,
    };
  } catch (error) {
    console.error("Bright Data LinkedIn fetch failed:", error);
    return { url: linkedinUrl };
  }
}

export async function lookupLinkedInByEmail(
  email: string
): Promise<string | null> {
  // Bright Data doesn't have direct email-to-LinkedIn lookup
  // This would require their People Discovery dataset
  // For now, return null and rely on search-based discovery
  console.log(`LinkedIn lookup by email not available for: ${email}`);
  return null;
}

// Alternative: Use Bright Data SERP API to find LinkedIn profiles
export async function searchLinkedInProfiles(
  name: string,
  context?: { company?: string; title?: string }
): Promise<string | null> {
  const apiKey = process.env.BRIGHTDATA_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const query = `site:linkedin.com/in "${name}" ${context?.company || ""} ${context?.title || ""}`.trim();

    const response = await fetch(`${BRIGHTDATA_API_URL}/serp/google`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        num: 5,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const linkedInResult = data.organic?.find((r: { link: string }) =>
      r.link?.includes("linkedin.com/in/")
    );

    return linkedInResult?.link || null;
  } catch (error) {
    console.error("Bright Data SERP search failed:", error);
    return null;
  }
}
