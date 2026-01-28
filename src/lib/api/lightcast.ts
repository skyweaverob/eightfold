import type { SkillDemand, CareerPath, MarketPosition } from "@/types";

const LIGHTCAST_AUTH_URL = "https://auth.emsicloud.com/connect/token";
const LIGHTCAST_API_URL = "https://emsiservices.com";

let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  const clientId = process.env.LIGHTCAST_CLIENT_ID;
  const clientSecret = process.env.LIGHTCAST_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("LIGHTCAST_CLIENT_ID and LIGHTCAST_CLIENT_SECRET are required");
  }

  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const response = await fetch(LIGHTCAST_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "emsi_open",
    }),
  });

  if (!response.ok) {
    throw new Error(`Lightcast authentication failed: ${response.statusText}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  // Set expiry with 5 minute buffer
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

  return accessToken!;
}

export async function getSkillDemand(skillNames: string[]): Promise<SkillDemand[]> {
  const token = await getAccessToken();

  const results: SkillDemand[] = [];

  for (const skillName of skillNames) {
    try {
      // Search for skill ID
      const searchResponse = await fetch(
        `${LIGHTCAST_API_URL}/skills/versions/latest/skills?q=${encodeURIComponent(skillName)}&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!searchResponse.ok) continue;

      const searchData = await searchResponse.json();
      if (!searchData.data?.length) continue;

      const skill = searchData.data[0];

      // Get skill details including related skills
      const detailResponse = await fetch(
        `${LIGHTCAST_API_URL}/skills/versions/latest/skills/${skill.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!detailResponse.ok) continue;

      const detailData = await detailResponse.json();

      results.push({
        skillName: skill.name,
        demandScore: detailData.data?.importance || 50,
        growthRate: detailData.data?.growth || 0,
        relatedSkills: detailData.data?.relatedSkills?.map(
          (s: { name: string }) => s.name
        ),
      });
    } catch (error) {
      console.error(`Failed to get demand for skill ${skillName}:`, error);
    }
  }

  return results;
}

export async function getCareerPaths(
  currentTitle: string,
  skills: string[]
): Promise<CareerPath[]> {
  const token = await getAccessToken();

  try {
    // Search for title
    const searchResponse = await fetch(
      `${LIGHTCAST_API_URL}/titles/versions/latest/titles?q=${encodeURIComponent(currentTitle)}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!searchResponse.ok) {
      return [];
    }

    const searchData = await searchResponse.json();
    if (!searchData.data?.length) {
      return [];
    }

    const titleId = searchData.data[0].id;

    // Get related titles (potential next roles)
    const relatedResponse = await fetch(
      `${LIGHTCAST_API_URL}/titles/versions/latest/titles/${titleId}/related`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!relatedResponse.ok) {
      return [];
    }

    const relatedData = await relatedResponse.json();

    const nextRoles =
      relatedData.data?.slice(0, 5).map(
        (title: { name: string; similarity?: number }) => ({
          title: title.name,
          probability: title.similarity || 0.5,
        })
      ) || [];

    return [
      {
        currentRole: currentTitle,
        nextRoles,
      },
    ];
  } catch (error) {
    console.error("Failed to get career paths:", error);
    return [];
  }
}

export async function getMarketPosition(
  title: string,
  skills: string[],
  location?: string
): Promise<MarketPosition | null> {
  const token = await getAccessToken();

  try {
    // Get salary data for the title
    const response = await fetch(
      `${LIGHTCAST_API_URL}/jpa/rankings?title=${encodeURIComponent(title)}${location ? `&region=${encodeURIComponent(location)}` : ""}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      // Return default market position if API fails
      return {
        overallScore: 50,
        skillsInDemand: [],
        skillsToAcquire: [],
        salaryRange: { min: 0, max: 0, median: 0 },
        competitiveness: "medium",
      };
    }

    const data = await response.json();

    // Get skill demand for the user's skills
    const skillDemands = await getSkillDemand(skills.slice(0, 10));
    const inDemandSkills = skillDemands
      .filter((s) => s.demandScore > 60)
      .map((s) => s.skillName);

    const allRelatedSkills = skillDemands.flatMap((s) => s.relatedSkills || []);
    const skillsToAcquire = [...new Set(allRelatedSkills)]
      .filter((s) => !skills.includes(s))
      .slice(0, 5);

    return {
      overallScore: Math.min(100, inDemandSkills.length * 15 + 40),
      skillsInDemand: inDemandSkills,
      skillsToAcquire,
      salaryRange: data.salary || { min: 0, max: 0, median: 0 },
      competitiveness:
        inDemandSkills.length > 5
          ? "high"
          : inDemandSkills.length > 2
            ? "medium"
            : "low",
    };
  } catch (error) {
    console.error("Failed to get market position:", error);
    return null;
  }
}
