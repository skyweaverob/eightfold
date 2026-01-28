import type { SearchResult, WebPresenceResult } from "@/types";

const SERPAPI_URL = "https://serpapi.com/search";

interface SerpApiResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

interface SerpApiResponse {
  search_metadata: {
    status: string;
  };
  organic_results?: SerpApiResult[];
  error?: string;
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    q: query,
    engine: "google",
    num: "20",
  });

  const response = await fetch(`${SERPAPI_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`SerpAPI request failed: ${response.statusText}`);
  }

  const data: SerpApiResponse = await response.json();

  if (data.error) {
    throw new Error(`SerpAPI error: ${data.error}`);
  }

  return (
    data.organic_results?.map((result) => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      date: result.date,
    })) || []
  );
}

export async function findProfessionalProfiles(
  name: string,
  additionalContext?: {
    company?: string;
    title?: string;
    location?: string;
    email?: string;
  }
): Promise<WebPresenceResult[]> {
  const results: WebPresenceResult[] = [];

  // Build search queries for different platforms
  const contextParts: string[] = [];
  if (additionalContext?.company) contextParts.push(additionalContext.company);
  if (additionalContext?.title) contextParts.push(additionalContext.title);
  if (additionalContext?.location) contextParts.push(additionalContext.location);

  const context = contextParts.join(" ");

  // Search queries for different platforms
  const searches = [
    { platform: "linkedin", query: `site:linkedin.com/in "${name}" ${context}` },
    { platform: "github", query: `site:github.com "${name}" ${context}` },
    { platform: "twitter", query: `site:twitter.com OR site:x.com "${name}" ${context}` },
    { platform: "medium", query: `site:medium.com "@${name.replace(/\s+/g, "")}" OR site:medium.com "${name}"` },
    { platform: "stackoverflow", query: `site:stackoverflow.com/users "${name}"` },
  ];

  // Execute searches in parallel
  const searchPromises = searches.map(async ({ platform, query }) => {
    try {
      const searchResults = await searchWeb(query);
      return searchResults.slice(0, 3).map((result) => ({
        platform,
        url: result.link,
        title: result.title,
        description: result.snippet,
      }));
    } catch {
      console.error(`Search failed for ${platform}:`, query);
      return [];
    }
  });

  const allResults = await Promise.all(searchPromises);

  // Flatten results
  for (const platformResults of allResults) {
    results.push(...platformResults);
  }

  // Also search for general mentions
  try {
    const generalQuery = `"${name}" ${context} -site:linkedin.com -site:github.com -site:twitter.com -site:x.com`;
    const generalResults = await searchWeb(generalQuery);

    results.push(
      ...generalResults.slice(0, 5).map((result) => ({
        platform: "web",
        url: result.link,
        title: result.title,
        description: result.snippet,
      }))
    );
  } catch {
    console.error("General web search failed");
  }

  return results;
}
