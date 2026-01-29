import type { SearchResult, WebPresenceResult } from "@/types";

const SERPAPI_URL = "https://serpapi.com/search";

interface SerpApiResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  date?: string;
  displayed_link?: string;
  source?: string;
}

interface SerpApiNewsResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  date?: string;
  source?: string;
  thumbnail?: string;
}

interface SerpApiResponse {
  search_metadata: {
    status: string;
    id: string;
    total_time_taken: number;
  };
  search_information?: {
    total_results: number;
    time_taken_displayed: number;
  };
  organic_results?: SerpApiResult[];
  news_results?: SerpApiNewsResult[];
  error?: string;
}

// Enhanced search result with categorization
export interface CatalogedSearchResult {
  category:
    | "profile"
    | "news"
    | "publication"
    | "speaking"
    | "patent"
    | "award"
    | "podcast"
    | "video"
    | "opensource"
    | "press"
    | "mention"
    | "other";
  platform: string;
  url: string;
  title: string;
  snippet: string;
  date?: string;
  source?: string;
  relevanceScore: number;
  searchQuery: string;
}

export interface DeepSearchResults {
  profiles: CatalogedSearchResult[];
  news: CatalogedSearchResult[];
  publications: CatalogedSearchResult[];
  speaking: CatalogedSearchResult[];
  patents: CatalogedSearchResult[];
  awards: CatalogedSearchResult[];
  podcasts: CatalogedSearchResult[];
  videos: CatalogedSearchResult[];
  opensource: CatalogedSearchResult[];
  press: CatalogedSearchResult[];
  mentions: CatalogedSearchResult[];
  totalResults: number;
  searchesPerformed: number;
  summary: {
    hasLinkedIn: boolean;
    hasGitHub: boolean;
    hasTwitter: boolean;
    newsCount: number;
    publicationCount: number;
    speakingCount: number;
    overallVisibility: "high" | "medium" | "low" | "minimal";
  };
}

export async function searchWeb(query: string, num: number = 20): Promise<SearchResult[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    q: query,
    engine: "google",
    num: num.toString(),
    gl: "us",
    hl: "en",
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
      source: result.displayed_link || result.source,
    })) || []
  );
}

export async function searchNews(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    q: query,
    engine: "google_news",
    gl: "us",
    hl: "en",
  });

  const response = await fetch(`${SERPAPI_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`SerpAPI news request failed: ${response.statusText}`);
  }

  const data: SerpApiResponse = await response.json();

  if (data.error) {
    throw new Error(`SerpAPI error: ${data.error}`);
  }

  return (
    data.news_results?.map((result) => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      date: result.date,
      source: result.source,
    })) || []
  );
}

function calculateRelevance(result: SearchResult, searchName: string): number {
  let score = 50; // Base score

  const titleLower = result.title.toLowerCase();
  const snippetLower = result.snippet.toLowerCase();
  const nameLower = searchName.toLowerCase();
  const nameParts = nameLower.split(/\s+/);

  // Exact name match in title
  if (titleLower.includes(nameLower)) {
    score += 30;
  } else {
    // Partial name match
    const matchedParts = nameParts.filter(part =>
      part.length > 2 && titleLower.includes(part)
    );
    score += matchedParts.length * 10;
  }

  // Name in snippet
  if (snippetLower.includes(nameLower)) {
    score += 15;
  }

  // Recent date bonus
  if (result.date) {
    const dateStr = result.date.toLowerCase();
    if (dateStr.includes("2024") || dateStr.includes("2025")) {
      score += 10;
    }
  }

  return Math.min(score, 100);
}

function identifyPlatform(url: string): string {
  const urlLower = url.toLowerCase();

  if (urlLower.includes("linkedin.com")) return "linkedin";
  if (urlLower.includes("github.com")) return "github";
  if (urlLower.includes("twitter.com") || urlLower.includes("x.com")) return "twitter";
  if (urlLower.includes("medium.com")) return "medium";
  if (urlLower.includes("stackoverflow.com")) return "stackoverflow";
  if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) return "youtube";
  if (urlLower.includes("spotify.com")) return "spotify";
  if (urlLower.includes("apple.com/podcasts")) return "apple_podcasts";
  if (urlLower.includes("scholar.google.com")) return "google_scholar";
  if (urlLower.includes("researchgate.net")) return "researchgate";
  if (urlLower.includes("patents.google.com") || urlLower.includes("uspto.gov")) return "patents";
  if (urlLower.includes("slideshare.net")) return "slideshare";
  if (urlLower.includes("speakerdeck.com")) return "speakerdeck";
  if (urlLower.includes("crunchbase.com")) return "crunchbase";
  if (urlLower.includes("bloomberg.com")) return "bloomberg";
  if (urlLower.includes("forbes.com")) return "forbes";
  if (urlLower.includes("techcrunch.com")) return "techcrunch";
  if (urlLower.includes("wired.com")) return "wired";
  if (urlLower.includes("nytimes.com")) return "nytimes";
  if (urlLower.includes("wsj.com")) return "wsj";

  // Try to extract domain as platform
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    return domain.split(".")[0];
  } catch {
    return "web";
  }
}

async function executeSearch(
  query: string,
  category: CatalogedSearchResult["category"],
  searchName: string,
  maxResults: number = 10
): Promise<CatalogedSearchResult[]> {
  try {
    const results = await searchWeb(query, maxResults);
    return results.map((result) => ({
      category,
      platform: identifyPlatform(result.link),
      url: result.link,
      title: result.title,
      snippet: result.snippet,
      date: result.date,
      source: result.source,
      relevanceScore: calculateRelevance(result, searchName),
      searchQuery: query,
    }));
  } catch (error) {
    console.error(`Search failed for query: ${query}`, error);
    return [];
  }
}

async function executeNewsSearch(
  query: string,
  searchName: string,
  maxResults: number = 10
): Promise<CatalogedSearchResult[]> {
  try {
    const results = await searchNews(query);
    return results.slice(0, maxResults).map((result) => ({
      category: "news" as const,
      platform: identifyPlatform(result.link),
      url: result.link,
      title: result.title,
      snippet: result.snippet,
      date: result.date,
      source: result.source,
      relevanceScore: calculateRelevance(result, searchName),
      searchQuery: query,
    }));
  } catch (error) {
    console.error(`News search failed for query: ${query}`, error);
    return [];
  }
}

export async function deepWebSearch(
  name: string,
  context?: {
    company?: string;
    title?: string;
    location?: string;
    email?: string;
    skills?: string[];
    industry?: string;
  }
): Promise<DeepSearchResults> {
  const results: DeepSearchResults = {
    profiles: [],
    news: [],
    publications: [],
    speaking: [],
    patents: [],
    awards: [],
    podcasts: [],
    videos: [],
    opensource: [],
    press: [],
    mentions: [],
    totalResults: 0,
    searchesPerformed: 0,
    summary: {
      hasLinkedIn: false,
      hasGitHub: false,
      hasTwitter: false,
      newsCount: 0,
      publicationCount: 0,
      speakingCount: 0,
      overallVisibility: "minimal",
    },
  };

  // Build context string for more targeted searches
  const contextParts: string[] = [];
  if (context?.company) contextParts.push(context.company);
  if (context?.title) contextParts.push(context.title);
  if (context?.location) contextParts.push(context.location);
  const contextStr = contextParts.join(" ");

  // Define all search queries organized by category
  const searchQueries: Array<{
    query: string;
    category: CatalogedSearchResult["category"];
    priority: number;
  }> = [
    // === PROFILE SEARCHES (Priority 1) ===
    { query: `site:linkedin.com/in "${name}" ${contextStr}`, category: "profile", priority: 1 },
    { query: `site:github.com "${name}" ${contextStr}`, category: "profile", priority: 1 },
    { query: `site:twitter.com OR site:x.com "${name}" ${contextStr}`, category: "profile", priority: 1 },
    { query: `site:medium.com "${name}"`, category: "profile", priority: 2 },
    { query: `site:stackoverflow.com/users "${name}"`, category: "profile", priority: 2 },
    { query: `site:dev.to "${name}"`, category: "profile", priority: 3 },
    { query: `site:hashnode.com "${name}"`, category: "profile", priority: 3 },
    { query: `site:substack.com "${name}"`, category: "profile", priority: 3 },

    // === NEWS SEARCHES (Priority 1) ===
    // Note: News searches use a different endpoint

    // === PUBLICATION SEARCHES (Priority 2) ===
    { query: `site:scholar.google.com author:"${name}"`, category: "publication", priority: 2 },
    { query: `site:researchgate.net "${name}"`, category: "publication", priority: 2 },
    { query: `site:arxiv.org author:"${name}"`, category: "publication", priority: 2 },
    { query: `site:ieee.org author:"${name}"`, category: "publication", priority: 3 },
    { query: `site:acm.org author:"${name}"`, category: "publication", priority: 3 },
    { query: `"${name}" ${contextStr} published OR publication OR paper OR research`, category: "publication", priority: 3 },

    // === SPEAKING ENGAGEMENTS (Priority 2) ===
    { query: `"${name}" speaker OR keynote OR conference OR summit ${contextStr}`, category: "speaking", priority: 2 },
    { query: `site:slideshare.net "${name}"`, category: "speaking", priority: 2 },
    { query: `site:speakerdeck.com "${name}"`, category: "speaking", priority: 2 },
    { query: `"${name}" TEDx OR TED talk`, category: "speaking", priority: 3 },
    { query: `"${name}" webinar OR panel OR presentation ${context?.industry || ""}`, category: "speaking", priority: 3 },

    // === PATENTS (Priority 3) ===
    { query: `site:patents.google.com inventor:"${name}"`, category: "patent", priority: 3 },
    { query: `"${name}" patent inventor ${contextStr}`, category: "patent", priority: 3 },

    // === AWARDS & RECOGNITION (Priority 2) ===
    { query: `"${name}" award OR awarded OR recognized OR honored ${contextStr}`, category: "award", priority: 2 },
    { query: `"${name}" "top" OR "best" OR "leading" ${context?.title || ""} ${context?.industry || ""}`, category: "award", priority: 3 },
    { query: `"${name}" Forbes OR Fortune OR Inc OR "Business Insider" list`, category: "award", priority: 3 },

    // === PODCAST APPEARANCES (Priority 3) ===
    { query: `"${name}" podcast guest OR interview ${contextStr}`, category: "podcast", priority: 3 },
    { query: `site:spotify.com "${name}" podcast`, category: "podcast", priority: 3 },
    { query: `site:podcasts.apple.com "${name}"`, category: "podcast", priority: 3 },

    // === VIDEO CONTENT (Priority 2) ===
    { query: `site:youtube.com "${name}" ${contextStr}`, category: "video", priority: 2 },
    { query: `"${name}" interview OR talk OR presentation video ${context?.industry || ""}`, category: "video", priority: 3 },

    // === OPEN SOURCE (Priority 2) ===
    { query: `site:github.com "${name}" contributor OR author ${context?.skills?.slice(0, 3).join(" OR ") || ""}`, category: "opensource", priority: 2 },
    { query: `"${name}" open source OR opensource contribution ${context?.skills?.slice(0, 2).join(" ") || ""}`, category: "opensource", priority: 3 },
    { query: `site:npmjs.com "${name}"`, category: "opensource", priority: 3 },
    { query: `site:pypi.org "${name}"`, category: "opensource", priority: 3 },

    // === PRESS & COMPANY NEWS (Priority 2) ===
    { query: `"${name}" ${context?.company || ""} announced OR appointed OR joined OR promoted`, category: "press", priority: 2 },
    { query: `site:crunchbase.com "${name}"`, category: "press", priority: 2 },
    { query: `"${name}" ${context?.company || ""} press release OR announcement`, category: "press", priority: 3 },

    // === GENERAL MENTIONS (Priority 3) ===
    { query: `"${name}" ${contextStr} -site:linkedin.com -site:facebook.com`, category: "mention", priority: 3 },
    { query: `"${name}" ${context?.title || ""} quoted OR said OR according to`, category: "mention", priority: 3 },
  ];

  // Execute priority 1 searches first (most important)
  const priority1Searches = searchQueries.filter((s) => s.priority === 1);
  const priority2Searches = searchQueries.filter((s) => s.priority === 2);
  const priority3Searches = searchQueries.filter((s) => s.priority === 3);

  console.log(`Starting deep web search for "${name}" with ${searchQueries.length} queries...`);

  // Execute priority 1 searches in parallel
  const p1Results = await Promise.all(
    priority1Searches.map((s) => executeSearch(s.query, s.category, name, 5))
  );
  results.searchesPerformed += priority1Searches.length;

  // Execute news search
  const newsResults = await executeNewsSearch(`"${name}" ${contextStr}`, name, 15);
  results.news.push(...newsResults);
  results.searchesPerformed += 1;

  // Also search news without context for broader coverage
  if (contextStr) {
    const broadNewsResults = await executeNewsSearch(`"${name}"`, name, 10);
    // Add only unique URLs
    const existingUrls = new Set(results.news.map((r) => r.url));
    results.news.push(...broadNewsResults.filter((r) => !existingUrls.has(r.url)));
    results.searchesPerformed += 1;
  }

  // Execute priority 2 searches in parallel
  const p2Results = await Promise.all(
    priority2Searches.map((s) => executeSearch(s.query, s.category, name, 5))
  );
  results.searchesPerformed += priority2Searches.length;

  // Execute priority 3 searches in parallel (lower priority, fewer results each)
  const p3Results = await Promise.all(
    priority3Searches.map((s) => executeSearch(s.query, s.category, name, 3))
  );
  results.searchesPerformed += priority3Searches.length;

  // Combine all results
  const allSearchResults = [...p1Results, ...p2Results, ...p3Results].flat();

  // Deduplicate by URL and categorize
  const seenUrls = new Set<string>();

  for (const result of allSearchResults) {
    if (seenUrls.has(result.url)) continue;
    seenUrls.add(result.url);

    switch (result.category) {
      case "profile":
        results.profiles.push(result);
        break;
      case "publication":
        results.publications.push(result);
        break;
      case "speaking":
        results.speaking.push(result);
        break;
      case "patent":
        results.patents.push(result);
        break;
      case "award":
        results.awards.push(result);
        break;
      case "podcast":
        results.podcasts.push(result);
        break;
      case "video":
        results.videos.push(result);
        break;
      case "opensource":
        results.opensource.push(result);
        break;
      case "press":
        results.press.push(result);
        break;
      case "mention":
        results.mentions.push(result);
        break;
      default:
        results.mentions.push(result);
    }
  }

  // Sort each category by relevance score
  const sortByRelevance = (a: CatalogedSearchResult, b: CatalogedSearchResult) =>
    b.relevanceScore - a.relevanceScore;

  results.profiles.sort(sortByRelevance);
  results.news.sort(sortByRelevance);
  results.publications.sort(sortByRelevance);
  results.speaking.sort(sortByRelevance);
  results.patents.sort(sortByRelevance);
  results.awards.sort(sortByRelevance);
  results.podcasts.sort(sortByRelevance);
  results.videos.sort(sortByRelevance);
  results.opensource.sort(sortByRelevance);
  results.press.sort(sortByRelevance);
  results.mentions.sort(sortByRelevance);

  // Calculate totals and summary
  results.totalResults =
    results.profiles.length +
    results.news.length +
    results.publications.length +
    results.speaking.length +
    results.patents.length +
    results.awards.length +
    results.podcasts.length +
    results.videos.length +
    results.opensource.length +
    results.press.length +
    results.mentions.length;

  results.summary = {
    hasLinkedIn: results.profiles.some((p) => p.platform === "linkedin"),
    hasGitHub: results.profiles.some((p) => p.platform === "github"),
    hasTwitter: results.profiles.some((p) => p.platform === "twitter"),
    newsCount: results.news.length,
    publicationCount: results.publications.length,
    speakingCount: results.speaking.length,
    overallVisibility: calculateVisibility(results),
  };

  console.log(
    `Deep search complete: ${results.totalResults} results from ${results.searchesPerformed} searches`
  );

  return results;
}

function calculateVisibility(results: DeepSearchResults): "high" | "medium" | "low" | "minimal" {
  let score = 0;

  // Profile presence
  if (results.summary.hasLinkedIn) score += 10;
  if (results.summary.hasGitHub) score += 5;
  if (results.summary.hasTwitter) score += 5;

  // News coverage
  score += Math.min(results.news.length * 3, 20);

  // Publications
  score += Math.min(results.publications.length * 5, 15);

  // Speaking engagements
  score += Math.min(results.speaking.length * 4, 12);

  // Awards
  score += Math.min(results.awards.length * 3, 9);

  // Press coverage
  score += Math.min(results.press.length * 3, 9);

  // General mentions
  score += Math.min(results.mentions.length, 10);

  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  if (score >= 10) return "low";
  return "minimal";
}

// Legacy function for backward compatibility
export async function findProfessionalProfiles(
  name: string,
  additionalContext?: {
    company?: string;
    title?: string;
    location?: string;
    email?: string;
  }
): Promise<WebPresenceResult[]> {
  // Use the new deep search but return in legacy format
  const deepResults = await deepWebSearch(name, additionalContext);

  const webPresenceResults: WebPresenceResult[] = [];

  // Convert profiles
  for (const profile of deepResults.profiles) {
    webPresenceResults.push({
      platform: profile.platform,
      url: profile.url,
      title: profile.title,
      description: profile.snippet,
    });
  }

  // Add top news items
  for (const news of deepResults.news.slice(0, 5)) {
    webPresenceResults.push({
      platform: `news:${news.platform}`,
      url: news.url,
      title: news.title,
      description: news.snippet,
    });
  }

  // Add notable mentions from other categories
  const otherHighValue = [
    ...deepResults.publications.slice(0, 3),
    ...deepResults.speaking.slice(0, 3),
    ...deepResults.awards.slice(0, 2),
    ...deepResults.press.slice(0, 3),
  ];

  for (const item of otherHighValue) {
    webPresenceResults.push({
      platform: `${item.category}:${item.platform}`,
      url: item.url,
      title: item.title,
      description: item.snippet,
    });
  }

  return webPresenceResults;
}

// Export a function to get a text summary for Claude analysis
export function summarizeDeepSearchForAnalysis(results: DeepSearchResults): string {
  const sections: string[] = [];

  sections.push(`## Web Presence Deep Search Results`);
  sections.push(`Total results found: ${results.totalResults}`);
  sections.push(`Searches performed: ${results.searchesPerformed}`);
  sections.push(`Overall visibility: ${results.summary.overallVisibility.toUpperCase()}`);
  sections.push("");

  // Profiles
  if (results.profiles.length > 0) {
    sections.push(`### Professional Profiles (${results.profiles.length})`);
    for (const p of results.profiles.slice(0, 10)) {
      sections.push(`- [${p.platform}] ${p.title}`);
      sections.push(`  URL: ${p.url}`);
      sections.push(`  ${p.snippet.slice(0, 200)}...`);
    }
    sections.push("");
  }

  // News
  if (results.news.length > 0) {
    sections.push(`### News Coverage (${results.news.length})`);
    for (const n of results.news.slice(0, 10)) {
      sections.push(`- ${n.title}`);
      sections.push(`  Source: ${n.source || n.platform} | Date: ${n.date || "Unknown"}`);
      sections.push(`  ${n.snippet.slice(0, 200)}...`);
    }
    sections.push("");
  }

  // Publications
  if (results.publications.length > 0) {
    sections.push(`### Publications & Research (${results.publications.length})`);
    for (const p of results.publications.slice(0, 5)) {
      sections.push(`- ${p.title}`);
      sections.push(`  ${p.snippet.slice(0, 200)}...`);
    }
    sections.push("");
  }

  // Speaking
  if (results.speaking.length > 0) {
    sections.push(`### Speaking Engagements (${results.speaking.length})`);
    for (const s of results.speaking.slice(0, 5)) {
      sections.push(`- ${s.title}`);
      sections.push(`  ${s.snippet.slice(0, 200)}...`);
    }
    sections.push("");
  }

  // Patents
  if (results.patents.length > 0) {
    sections.push(`### Patents (${results.patents.length})`);
    for (const p of results.patents.slice(0, 5)) {
      sections.push(`- ${p.title}`);
      sections.push(`  ${p.snippet.slice(0, 200)}...`);
    }
    sections.push("");
  }

  // Awards
  if (results.awards.length > 0) {
    sections.push(`### Awards & Recognition (${results.awards.length})`);
    for (const a of results.awards.slice(0, 5)) {
      sections.push(`- ${a.title}`);
      sections.push(`  ${a.snippet.slice(0, 200)}...`);
    }
    sections.push("");
  }

  // Press
  if (results.press.length > 0) {
    sections.push(`### Press & Company News (${results.press.length})`);
    for (const p of results.press.slice(0, 5)) {
      sections.push(`- ${p.title}`);
      sections.push(`  ${p.snippet.slice(0, 200)}...`);
    }
    sections.push("");
  }

  // Videos
  if (results.videos.length > 0) {
    sections.push(`### Video Content (${results.videos.length})`);
    for (const v of results.videos.slice(0, 5)) {
      sections.push(`- ${v.title}`);
      sections.push(`  ${v.snippet.slice(0, 200)}...`);
    }
    sections.push("");
  }

  // Open Source
  if (results.opensource.length > 0) {
    sections.push(`### Open Source Contributions (${results.opensource.length})`);
    for (const o of results.opensource.slice(0, 5)) {
      sections.push(`- ${o.title}`);
      sections.push(`  ${o.snippet.slice(0, 200)}...`);
    }
    sections.push("");
  }

  return sections.join("\n");
}
