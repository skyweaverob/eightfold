import type { SkillDemand, CareerPath, MarketPosition } from "@/types";

const JOBSPIKR_API_URL = "https://api.jobspikr.com/v2";

interface JobsPikrJob {
  job_title?: string;
  company_name?: string;
  job_description?: string;
  skills?: string[];
  salary_offered?: string;
  job_type?: string;
  job_location?: string;
  posted_date?: string;
}

interface JobsPikrResponse {
  data?: JobsPikrJob[];
  total_count?: number;
  status?: string;
}

async function fetchJobs(params: Record<string, string>): Promise<JobsPikrResponse> {
  const clientId = process.env.JOBSPIKR_CLIENT_ID;
  const authKey = process.env.JOBSPIKR_AUTH_KEY;

  if (!clientId || !authKey) {
    throw new Error("JOBSPIKR_CLIENT_ID and JOBSPIKR_AUTH_KEY are required");
  }

  const queryParams = new URLSearchParams({
    client_id: clientId,
    client_auth_key: authKey,
    ...params,
  });

  const response = await fetch(`${JOBSPIKR_API_URL}/data?${queryParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`JobsPikr request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getSkillDemand(skillNames: string[]): Promise<SkillDemand[]> {
  const clientId = process.env.JOBSPIKR_CLIENT_ID;
  const authKey = process.env.JOBSPIKR_AUTH_KEY;

  if (!clientId || !authKey) {
    console.log("JobsPikr not configured, using estimated skill demand");
    // Return estimated demand based on common knowledge
    return skillNames.map((skillName) => ({
      skillName,
      demandScore: getEstimatedDemandScore(skillName),
      growthRate: getEstimatedGrowthRate(skillName),
      relatedSkills: getRelatedSkills(skillName),
    }));
  }

  const results: SkillDemand[] = [];

  // Search for jobs containing each skill to estimate demand
  for (const skillName of skillNames.slice(0, 10)) {
    try {
      const data = await fetchJobs({
        job_description: skillName,
        job_type: "fulltime",
        country: "US",
        page_size: "100",
      });

      const jobCount = data.total_count || 0;

      // Calculate demand score based on job count
      // 0-50 jobs = low (30-50), 50-200 = medium (50-70), 200+ = high (70-90)
      let demandScore = 50;
      if (jobCount > 500) demandScore = 90;
      else if (jobCount > 200) demandScore = 75;
      else if (jobCount > 100) demandScore = 65;
      else if (jobCount > 50) demandScore = 55;
      else if (jobCount > 20) demandScore = 45;
      else demandScore = 35;

      // Extract related skills from job descriptions
      const relatedSkills = extractRelatedSkills(data.data || [], skillName);

      results.push({
        skillName,
        demandScore,
        growthRate: estimateGrowthFromJobDates(data.data || []),
        jobPostings: jobCount,
        relatedSkills,
      });
    } catch (error) {
      console.error(`Failed to get demand for skill ${skillName}:`, error);
      // Use fallback estimation
      results.push({
        skillName,
        demandScore: getEstimatedDemandScore(skillName),
        growthRate: getEstimatedGrowthRate(skillName),
        relatedSkills: getRelatedSkills(skillName),
      });
    }
  }

  return results;
}

function extractRelatedSkills(jobs: JobsPikrJob[], primarySkill: string): string[] {
  const skillCounts: Record<string, number> = {};

  for (const job of jobs) {
    const skills = job.skills || [];
    for (const skill of skills) {
      const normalized = skill.toLowerCase();
      if (normalized !== primarySkill.toLowerCase()) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      }
    }
  }

  return Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill]) => skill);
}

function estimateGrowthFromJobDates(jobs: JobsPikrJob[]): number {
  // Simple heuristic: more recent postings = higher growth
  const recentJobs = jobs.filter((job) => {
    if (!job.posted_date) return false;
    const posted = new Date(job.posted_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return posted > thirtyDaysAgo;
  });

  const recentRatio = jobs.length > 0 ? recentJobs.length / jobs.length : 0.5;

  // Convert to growth rate (-10% to +30%)
  return Math.round((recentRatio - 0.3) * 40);
}

// Fallback estimations when API not available
function getEstimatedDemandScore(skill: string): number {
  const highDemand = [
    "python", "javascript", "typescript", "react", "aws", "kubernetes", "docker",
    "machine learning", "ai", "data science", "cloud", "devops", "node.js",
    "sql", "java", "go", "rust", "terraform", "azure", "gcp"
  ];
  const mediumDemand = [
    "angular", "vue", "ruby", "php", "c++", "c#", ".net", "mongodb", "postgresql",
    "redis", "graphql", "rest api", "microservices", "agile", "scrum"
  ];

  const normalized = skill.toLowerCase();
  if (highDemand.some(s => normalized.includes(s))) return 80;
  if (mediumDemand.some(s => normalized.includes(s))) return 60;
  return 50;
}

function getEstimatedGrowthRate(skill: string): number {
  const highGrowth = ["ai", "machine learning", "rust", "kubernetes", "typescript", "go"];
  const negativeGrowth = ["jquery", "perl", "cobol", "flash"];

  const normalized = skill.toLowerCase();
  if (highGrowth.some(s => normalized.includes(s))) return 25;
  if (negativeGrowth.some(s => normalized.includes(s))) return -10;
  return 5;
}

function getRelatedSkills(skill: string): string[] {
  const skillRelations: Record<string, string[]> = {
    python: ["pandas", "numpy", "django", "flask", "machine learning"],
    javascript: ["typescript", "react", "node.js", "vue", "angular"],
    typescript: ["javascript", "react", "node.js", "angular", "nestjs"],
    react: ["typescript", "redux", "next.js", "javascript", "css"],
    aws: ["terraform", "kubernetes", "docker", "devops", "cloud architecture"],
    kubernetes: ["docker", "helm", "terraform", "aws", "devops"],
    "machine learning": ["python", "tensorflow", "pytorch", "data science", "ai"],
    java: ["spring boot", "maven", "microservices", "sql", "aws"],
    sql: ["postgresql", "mysql", "database design", "data modeling", "python"],
  };

  const normalized = skill.toLowerCase();
  return skillRelations[normalized] || ["problem solving", "communication", "teamwork"];
}

export async function getCareerPaths(
  currentTitle: string,
  _skills: string[]
): Promise<CareerPath[]> {
  // Use heuristics for career progression
  const careerProgressions: Record<string, string[]> = {
    "software engineer": ["Senior Software Engineer", "Staff Engineer", "Tech Lead", "Engineering Manager"],
    "senior software engineer": ["Staff Engineer", "Principal Engineer", "Tech Lead", "Engineering Manager"],
    "data scientist": ["Senior Data Scientist", "Lead Data Scientist", "ML Engineer", "Data Science Manager"],
    "product manager": ["Senior Product Manager", "Group Product Manager", "Director of Product", "VP Product"],
    "designer": ["Senior Designer", "Lead Designer", "Design Manager", "Head of Design"],
    "analyst": ["Senior Analyst", "Lead Analyst", "Analytics Manager", "Director of Analytics"],
  };

  const normalizedTitle = currentTitle.toLowerCase();
  const matchedKey = Object.keys(careerProgressions).find((key) =>
    normalizedTitle.includes(key)
  );

  const nextRoles = matchedKey
    ? careerProgressions[matchedKey].map((title, index) => ({
        title,
        probability: Math.max(0.9 - index * 0.2, 0.3),
      }))
    : [
        { title: `Senior ${currentTitle}`, probability: 0.8 },
        { title: `Lead ${currentTitle}`, probability: 0.6 },
        { title: `${currentTitle} Manager`, probability: 0.5 },
      ];

  return [
    {
      currentRole: currentTitle,
      nextRoles,
    },
  ];
}

export async function getMarketPosition(
  title: string,
  skills: string[],
  _location?: string
): Promise<MarketPosition | null> {
  try {
    // Get skill demand for the user's skills
    const skillDemands = await getSkillDemand(skills.slice(0, 10));
    const inDemandSkills = skillDemands
      .filter((s) => s.demandScore > 60)
      .map((s) => s.skillName);

    const allRelatedSkills = skillDemands.flatMap((s) => s.relatedSkills || []);
    const skillsToAcquire = [...new Set(allRelatedSkills)]
      .filter((s) => !skills.map((sk) => sk.toLowerCase()).includes(s.toLowerCase()))
      .slice(0, 5);

    // Estimate salary range based on title
    const salaryRange = estimateSalaryRange(title);

    return {
      overallScore: Math.min(100, inDemandSkills.length * 12 + 40),
      skillsInDemand: inDemandSkills,
      skillsToAcquire,
      salaryRange,
      competitiveness:
        inDemandSkills.length > 5
          ? "high"
          : inDemandSkills.length > 2
            ? "medium"
            : "low",
    };
  } catch (error) {
    console.error("Failed to get market position:", error);
    return {
      overallScore: 50,
      skillsInDemand: [],
      skillsToAcquire: [],
      salaryRange: { min: 80000, max: 150000, median: 110000 },
      competitiveness: "medium",
    };
  }
}

function estimateSalaryRange(title: string): { min: number; max: number; median: number } {
  const normalized = title.toLowerCase();

  // Rough salary estimates for US market
  if (normalized.includes("senior") || normalized.includes("lead")) {
    return { min: 140000, max: 220000, median: 175000 };
  }
  if (normalized.includes("staff") || normalized.includes("principal")) {
    return { min: 180000, max: 300000, median: 230000 };
  }
  if (normalized.includes("manager") || normalized.includes("director")) {
    return { min: 160000, max: 280000, median: 200000 };
  }
  if (normalized.includes("vp") || normalized.includes("head of")) {
    return { min: 200000, max: 400000, median: 280000 };
  }

  // Entry/mid level
  return { min: 90000, max: 150000, median: 115000 };
}
