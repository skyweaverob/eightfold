import type { LinkedInProfile, LinkedInPost, WorkExperience, Education } from "@/types";

const RAPIDAPI_HOST = "fresh-linkedin-profile-data.p.rapidapi.com";
const RAPIDAPI_BASE_URL = `https://${RAPIDAPI_HOST}`;

// RapidAPI "Fresh LinkedIn Profile Data" for LinkedIn enrichment
// Endpoints: /enrich-lead (profile), /get-profile-posts (posts)

interface RapidAPIProfileResult {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  headline?: string;
  about?: string;
  city?: string;
  country?: string;
  company?: string;
  company_industry?: string;
  connection_count?: number;
  follower_count?: number;
  profile_image_url?: string;
  experiences?: {
    title?: string;
    company?: string;
    location?: string;
    date_range?: string;
    description?: string;
    duration?: string;
    is_current?: boolean;
    start_year?: number | string;
    end_year?: number | string;
  }[];
  educations?: {
    school?: string;
    degree?: string;
    field_of_study?: string;
    date_range?: string;
    start_year?: number | string;
    end_year?: number | string;
  }[];
  skills?: string[];
}

interface RapidAPIPostResult {
  text?: string;
  post_url?: string;
  posted?: string;
  time?: string;
  num_reactions?: number;
  num_comments?: number;
  num_reposts?: number;
  images?: { url?: string }[];
  video?: { stream_url?: string };
  // Author info (if returned by API)
  author_name?: string;
  author_headline?: string;
  author_url?: string;
}

function getRapidApiKey(): string | null {
  return process.env.RAPIDAPI_KEY || null;
}

function rapidApiHeaders(): Record<string, string> {
  const apiKey = getRapidApiKey();
  if (!apiKey) throw new Error("RAPIDAPI_KEY not configured");
  return {
    "x-rapidapi-host": RAPIDAPI_HOST,
    "x-rapidapi-key": apiKey,
  };
}

/**
 * Fetch full LinkedIn profile data via /enrich-lead endpoint.
 * Also fetches recent posts via /get-profile-posts.
 */
export async function getLinkedInProfile(
  linkedinUrl: string
): Promise<LinkedInProfile> {
  const apiKey = getRapidApiKey();

  if (!apiKey) {
    console.log("RAPIDAPI_KEY not configured, skipping LinkedIn enrichment");
    return { url: linkedinUrl };
  }

  try {
    // Fetch profile and posts in parallel
    const [profileData, postsData] = await Promise.all([
      fetchProfileData(linkedinUrl),
      fetchProfilePosts(linkedinUrl),
    ]);

    if (!profileData) {
      return { url: linkedinUrl, recentPosts: postsData };
    }

    const fullName = profileData.full_name ||
      `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim() ||
      undefined;

    const location = [profileData.city, profileData.country]
      .filter(Boolean)
      .join(", ") || undefined;

    const experience: WorkExperience[] =
      profileData.experiences?.map((exp) => ({
        company: exp.company || "Unknown",
        title: exp.title || "Unknown",
        location: exp.location,
        description: exp.description,
        startDate: exp.start_year ? String(exp.start_year) : undefined,
        endDate: exp.is_current ? undefined : (exp.end_year ? String(exp.end_year) : undefined),
        current: exp.is_current,
      })) || [];

    const education: Education[] =
      profileData.educations?.map((edu) => ({
        institution: edu.school || "Unknown",
        degree: edu.degree,
        field: edu.field_of_study,
        startDate: edu.start_year ? String(edu.start_year) : undefined,
        endDate: edu.end_year ? String(edu.end_year) : undefined,
      })) || [];

    return {
      url: linkedinUrl,
      fullName,
      headline: profileData.headline,
      summary: profileData.about,
      location,
      industry: profileData.company_industry,
      connections: profileData.connection_count,
      experience,
      education,
      skills: profileData.skills,
      profilePicture: profileData.profile_image_url,
      recentPosts: postsData,
    };
  } catch (error) {
    console.error("RapidAPI LinkedIn fetch failed:", error);
    return { url: linkedinUrl };
  }
}

async function fetchProfileData(
  linkedinUrl: string
): Promise<RapidAPIProfileResult | null> {
  try {
    const params = new URLSearchParams({
      linkedin_url: linkedinUrl,
      include_skills: "true",
    });

    console.log(`RapidAPI: Fetching LinkedIn profile for ${linkedinUrl}`);

    const response = await fetch(
      `${RAPIDAPI_BASE_URL}/enrich-lead?${params.toString()}`,
      { headers: rapidApiHeaders() }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`RapidAPI profile request failed: ${response.status}`, errorText);
      return null;
    }

    const result = await response.json();
    const data: RapidAPIProfileResult = result.data || result;

    console.log(`RapidAPI: Got profile for "${data.full_name || data.first_name || "unknown"}"`);
    console.log(`  Headline: "${data.headline}"`);
    console.log(`  Current company: "${data.company}"`);
    console.log(`  Industry: "${data.company_industry}"`);
    if (data.experiences?.length) {
      console.log(`  Work history: ${data.experiences.slice(0, 3).map(e => `${e.title} @ ${e.company}`).join(", ")}`);
    }
    return data;
  } catch (error) {
    console.error("RapidAPI profile fetch failed:", error);
    return null;
  }
}

async function fetchProfilePosts(
  linkedinUrl: string
): Promise<LinkedInPost[]> {
  try {
    const params = new URLSearchParams({
      linkedin_url: linkedinUrl,
      type: "posts",
    });

    console.log(`RapidAPI: Fetching LinkedIn posts for ${linkedinUrl}`);

    const response = await fetch(
      `${RAPIDAPI_BASE_URL}/get-profile-posts?${params.toString()}`,
      { headers: rapidApiHeaders() }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`RapidAPI posts request failed: ${response.status}`, errorText);
      return [];
    }

    const result = await response.json();
    const posts: RapidAPIPostResult[] = result.data || [];

    console.log(`RapidAPI: Got ${posts.length} posts for ${linkedinUrl}`);

    // Log first post details for debugging
    if (posts.length > 0) {
      const firstPost = posts[0];
      console.log(`  First post preview: "${firstPost.text?.slice(0, 80)}..."`);
      console.log(`  First post URL: ${firstPost.post_url}`);
      if (firstPost.author_name || firstPost.author_url) {
        console.log(`  Post author: ${firstPost.author_name || "unknown"} (${firstPost.author_url || "no url"})`);
      }
    }

    return posts.slice(0, 10).map((post) => ({
      text: post.text || "",
      postUrl: post.post_url || "",
      postedAt: post.posted || "",
      timeAgo: post.time || "",
      numReactions: post.num_reactions || 0,
      numComments: post.num_comments || 0,
      numReposts: post.num_reposts || 0,
      images: (post.images || []).map((img) => img.url || "").filter(Boolean),
      videoUrl: post.video?.stream_url,
    }));
  } catch (error) {
    console.error("RapidAPI posts fetch failed:", error);
    return [];
  }
}

export async function lookupLinkedInByEmail(
  email: string
): Promise<string | null> {
  // RapidAPI Fresh LinkedIn Profile Data doesn't support email lookup
  // Rely on search-based discovery instead
  console.log(`LinkedIn lookup by email not available for: ${email}`);
  return null;
}

export async function searchLinkedInProfiles(
  name: string,
  context?: { company?: string; title?: string }
): Promise<string | null> {
  // Handled by the deep web search in serpapi.ts
  console.log(`LinkedIn profile search for "${name}" handled by web search`);
  return null;
}
