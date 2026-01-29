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
    console.error("SERPAPI_API_KEY is not configured in environment variables");
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

  console.log(`SerpAPI search: "${query}" (requesting ${num} results)`);

  const response = await fetch(`${SERPAPI_URL}?${params.toString()}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`SerpAPI request failed: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`SerpAPI request failed: ${response.status} - ${errorText}`);
  }

  const data: SerpApiResponse = await response.json();

  if (data.error) {
    console.error(`SerpAPI returned error:`, data.error);
    throw new Error(`SerpAPI error: ${data.error}`);
  }

  const results = data.organic_results || [];
  console.log(`SerpAPI returned ${results.length} results for "${query}"`);

  return results.map((result) => ({
    title: result.title,
    link: result.link,
    snippet: result.snippet,
    date: result.date,
    source: result.displayed_link || result.source,
  }));
}

export async function searchNews(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.error("SERPAPI_API_KEY is not configured in environment variables");
    throw new Error("SERPAPI_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    q: query,
    engine: "google_news",
    gl: "us",
    hl: "en",
  });

  console.log(`SerpAPI news search: "${query}"`);

  const response = await fetch(`${SERPAPI_URL}?${params.toString()}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`SerpAPI news request failed: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`SerpAPI news request failed: ${response.status} - ${errorText}`);
  }

  const data: SerpApiResponse = await response.json();

  if (data.error) {
    console.error(`SerpAPI news returned error:`, data.error);
    throw new Error(`SerpAPI error: ${data.error}`);
  }

  const results = data.news_results || [];
  console.log(`SerpAPI news returned ${results.length} results for "${query}"`);

  return results.map((result) => ({
    title: result.title,
    link: result.link,
    snippet: result.snippet,
    date: result.date,
    source: result.source,
  }));
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
    if (dateStr.includes("2025") || dateStr.includes("2026")) {
      score += 10;
    } else if (dateStr.includes("2024")) {
      score += 5;
    }
  }

  return Math.min(score, 100);
}

function identifyPlatform(url: string): string {
  // Just extract the domain name - no hardcoded list
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    // Return the main part of the domain (e.g., "spectator" from "spectator.co.uk")
    const parts = domain.split(".");
    // Handle co.uk, com.au style domains
    if (parts.length >= 2 && ["co", "com", "org", "net"].includes(parts[parts.length - 2])) {
      return parts[parts.length - 3] || parts[0];
    }
    return parts[0];
  } catch {
    return "web";
  }
}

// Categorize result based on URL patterns and content - no hardcoded sites
function categorizeResult(result: SearchResult): CatalogedSearchResult["category"] {
  const url = result.link.toLowerCase();
  const title = result.title.toLowerCase();
  const snippet = result.snippet.toLowerCase();
  const combined = `${url} ${title} ${snippet}`;

  // Profile indicators
  if (url.includes("/in/") || url.includes("/profile") || url.includes("/user") ||
      url.includes("/people/") || url.includes("/author/") || url.includes("/writer/") ||
      url.includes("/contributor/") || url.includes("/@") ||
      combined.includes("profile") || combined.includes("about me")) {
    return "profile";
  }

  // News indicators
  if (url.includes("/news/") || url.includes("/article/") || url.includes("/story/") ||
      combined.includes("reported") || combined.includes("announced") ||
      combined.includes("according to") || combined.includes("news")) {
    return "news";
  }

  // Publication/research indicators
  if (combined.includes("paper") || combined.includes("research") ||
      combined.includes("published") || combined.includes("journal") ||
      combined.includes("study") || combined.includes("abstract") ||
      url.includes("scholar") || url.includes("arxiv") || url.includes("doi.org")) {
    return "publication";
  }

  // Speaking/conference indicators
  if (combined.includes("speaker") || combined.includes("keynote") ||
      combined.includes("conference") || combined.includes("summit") ||
      combined.includes("presentation") || combined.includes("webinar") ||
      combined.includes("talk") || combined.includes("panel")) {
    return "speaking";
  }

  // Patent indicators
  if (combined.includes("patent") || combined.includes("inventor") ||
      url.includes("patent")) {
    return "patent";
  }

  // Award indicators
  if (combined.includes("award") || combined.includes("honored") ||
      combined.includes("recognized") || combined.includes("winner") ||
      combined.includes("top ") || combined.includes("best ")) {
    return "award";
  }

  // Podcast indicators
  if (combined.includes("podcast") || combined.includes("episode") ||
      url.includes("podcast") || url.includes("spotify") ||
      url.includes("apple.com") && combined.includes("listen")) {
    return "podcast";
  }

  // Video indicators
  if (url.includes("youtube") || url.includes("vimeo") ||
      combined.includes("video") || combined.includes("watch")) {
    return "video";
  }

  // Open source indicators
  if (url.includes("github") || url.includes("gitlab") ||
      combined.includes("repository") || combined.includes("open source") ||
      combined.includes("contributor") || combined.includes("commit")) {
    return "opensource";
  }

  // Press/company news indicators
  if (combined.includes("appointed") || combined.includes("joined") ||
      combined.includes("hired") || combined.includes("promoted") ||
      combined.includes("ceo") || combined.includes("founder")) {
    return "press";
  }

  // Default to mention
  return "mention";
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

  // Extract name parts for variations
  const nameParts = name.split(/\s+/).filter(part => part.length > 1);
  const firstName = nameParts[0] || "";
  const lastName = nameParts[nameParts.length - 1] || "";
  const middleName = nameParts.length > 2 ? nameParts[1] : "";

  // Generate name variations for harder-to-find profiles
  const nameVariations: string[] = [
    name,
    `${firstName} ${lastName}`,
    ...(middleName ? [`${firstName} ${middleName} ${lastName}`, `${firstName} ${middleName[0]} ${lastName}`] : []),
    `${firstName[0]} ${lastName}`,
    `${firstName} ${lastName[0]}`,
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  // SIMPLE APPROACH: Just Google the person and learn from whatever comes back
  // Trust Google to surface what's relevant - don't over-engineer with site-specific searches

  const searchQueries: string[] = [
    // Primary searches - just the person's name with context
    `"${name}"`,
    `"${name}" ${contextStr}`.trim(),
    `"${firstName} ${lastName}"`,

    // Add company context if available
    ...(context?.company ? [`"${name}" "${context.company}"`] : []),

    // Add title context if available
    ...(context?.title ? [`"${name}" ${context.title}`] : []),

    // LinkedIn specifically (most important for professional)
    `"${name}" site:linkedin.com`,

    // Social media
    `"${name}" site:twitter.com OR site:x.com`,
  ];

  // Remove duplicates and empty queries
  const uniqueQueries = [...new Set(searchQueries.filter(q => q.trim().length > 3))];

  console.log(`Starting web search for "${name}" with ${uniqueQueries.length} queries...`);

  // Execute all searches and get raw results
  // Get 30+ results per search (3 pages worth)
  const allRawResults: SearchResult[] = [];
  const searchErrors: string[] = [];
  let successfulSearches = 0;

  for (const query of uniqueQueries) {
    try {
      const searchResults = await searchWeb(query, 40); // 3-4 pages of results
      allRawResults.push(...searchResults);
      results.searchesPerformed += 1;
      successfulSearches += 1;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Search failed for: ${query}`, errorMsg);
      searchErrors.push(`Query "${query}": ${errorMsg}`);
    }
  }

  // Also do a news search - track these separately to ensure they're categorized as news
  const newsSearchResults: SearchResult[] = [];
  try {
    const newsResults = await searchNews(`"${name}"`);
    newsSearchResults.push(...newsResults);
    results.searchesPerformed += 1;
    successfulSearches += 1;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("News search failed:", errorMsg);
    searchErrors.push(`News search: ${errorMsg}`);
  }

  // Log summary of search results
  console.log(`Searches completed: ${successfulSearches} successful, ${searchErrors.length} failed`);
  console.log(`Total raw results: ${allRawResults.length} web + ${newsSearchResults.length} news`);
  if (searchErrors.length > 0 && successfulSearches === 0) {
    console.error("ALL searches failed. Errors:", searchErrors.slice(0, 3).join("; "));
  }

  // Deduplicate by URL
  const seenUrls = new Set<string>();
  const uniqueResults: SearchResult[] = [];
  for (const result of allRawResults) {
    if (!seenUrls.has(result.link)) {
      seenUrls.add(result.link);
      uniqueResults.push(result);
    }
  }

  // Categorize web search results based on URL and content
  const allSearchResults: CatalogedSearchResult[] = uniqueResults.map(result => {
    const category = categorizeResult(result);
    return {
      category,
      platform: identifyPlatform(result.link),
      url: result.link,
      title: result.title,
      snippet: result.snippet,
      date: result.date,
      source: result.source,
      relevanceScore: calculateRelevance(result, name),
      searchQuery: name,
    };
  });

  // Add news results - these are explicitly categorized as news
  for (const news of newsSearchResults) {
    if (!seenUrls.has(news.link)) {
      seenUrls.add(news.link);
      allSearchResults.push({
        category: "news",
        platform: identifyPlatform(news.link),
        url: news.link,
        title: news.title,
        snippet: news.snippet,
        date: news.date,
        source: news.source,
        relevanceScore: calculateRelevance(news, name),
        searchQuery: name,
      });
    }
  }

  // Sort into categories
  for (const result of allSearchResults) {
    switch (result.category) {
      case "profile":
        results.profiles.push(result);
        break;
      case "news":
        results.news.push(result);
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
  // Simple approach: count total meaningful results across all categories
  const totalResults = results.totalResults;

  // Count distinct platforms where the person was found
  const allPlatforms = new Set([
    ...results.profiles.map(p => p.platform),
    ...results.news.map(n => n.platform),
    ...results.publications.map(p => p.platform),
    ...results.speaking.map(s => s.platform),
    ...results.podcasts.map(p => p.platform),
    ...results.videos.map(v => v.platform),
    ...results.press.map(p => p.platform),
    ...results.mentions.map(m => m.platform),
  ]);

  const platformCount = allPlatforms.size;

  // Weight categories by importance
  const categoryScore =
    results.profiles.length * 3 +      // Social/professional profiles
    results.news.length * 4 +          // News coverage is high value
    results.publications.length * 5 +  // Publications/research
    results.speaking.length * 4 +      // Speaking engagements
    results.patents.length * 5 +       // Patents
    results.awards.length * 3 +        // Awards/recognition
    results.podcasts.length * 3 +      // Podcast appearances
    results.videos.length * 2 +        // Video content
    results.press.length * 3 +         // Press mentions
    results.opensource.length * 2 +    // Open source
    results.mentions.length * 1;       // General mentions

  // Decision: if person shows up in multiple places, they have web presence
  // Even 3-4 distinct results across different platforms = "low" presence (not "minimal")

  if (categoryScore >= 40 || platformCount >= 6) return "high";
  if (categoryScore >= 20 || platformCount >= 4) return "medium";
  if (categoryScore >= 5 || platformCount >= 2 || totalResults >= 3) return "low";
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
