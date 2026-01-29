import axios from "axios";

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const BASE_URL = "https://api.adzuna.com/v1/api";

export interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string; area: string[] };
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  created: string;
  category: { label: string; tag: string };
}

export interface AdzunaSearchResponse {
  results: AdzunaJob[];
  count: number;
  mean: number;
}

export interface AdzunaHistoryResponse {
  month: Record<string, number>;
}

export interface JobSearchResult {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salaryMin?: number;
  salaryMax?: number;
  createdAt: string;
  category: string;
}

export interface SalaryData {
  min: number;
  max: number;
  median: number;
  sampleSize: number;
}

function isConfigured(): boolean {
  return Boolean(ADZUNA_APP_ID && ADZUNA_APP_KEY);
}

export async function searchJobs(
  title: string,
  location: string,
  page: number = 1,
  resultsPerPage: number = 15
): Promise<{ jobs: JobSearchResult[]; totalCount: number }> {
  if (!isConfigured()) {
    console.warn("Adzuna API not configured, returning empty results");
    return { jobs: [], totalCount: 0 };
  }

  try {
    const response = await axios.get<AdzunaSearchResponse>(
      `${BASE_URL}/jobs/us/search/${page}`,
      {
        params: {
          app_id: ADZUNA_APP_ID,
          app_key: ADZUNA_APP_KEY,
          what: title,
          where: location,
          results_per_page: resultsPerPage,
          content_type: "application/json",
        },
      }
    );

    const jobs: JobSearchResult[] = response.data.results.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description,
      url: job.redirect_url,
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      createdAt: job.created,
      category: job.category.label,
    }));

    return {
      jobs,
      totalCount: response.data.count,
    };
  } catch (error) {
    console.error("Adzuna job search failed:", error);
    return { jobs: [], totalCount: 0 };
  }
}

export async function getSalaryData(
  title: string,
  location?: string
): Promise<SalaryData | null> {
  if (!isConfigured()) {
    console.warn("Adzuna API not configured, returning fallback salary data");
    return getFallbackSalaryData(title);
  }

  try {
    // First, try to get salary from job search results
    const searchResponse = await axios.get<AdzunaSearchResponse>(
      `${BASE_URL}/jobs/us/search/1`,
      {
        params: {
          app_id: ADZUNA_APP_ID,
          app_key: ADZUNA_APP_KEY,
          what: title,
          where: location || "United States",
          results_per_page: 50,
          content_type: "application/json",
          salary_include_unknown: "0",
        },
      }
    );

    const jobsWithSalary = searchResponse.data.results.filter(
      (job) => job.salary_min || job.salary_max
    );

    if (jobsWithSalary.length >= 5) {
      const salaries: number[] = [];
      jobsWithSalary.forEach((job) => {
        if (job.salary_min) salaries.push(job.salary_min);
        if (job.salary_max) salaries.push(job.salary_max);
      });

      salaries.sort((a, b) => a - b);
      const min = salaries[Math.floor(salaries.length * 0.1)];
      const max = salaries[Math.floor(salaries.length * 0.9)];
      const median = salaries[Math.floor(salaries.length * 0.5)];

      return {
        min: Math.round(min),
        max: Math.round(max),
        median: Math.round(median),
        sampleSize: jobsWithSalary.length,
      };
    }

    // Fallback to historical data endpoint
    try {
      const historyResponse = await axios.get<AdzunaHistoryResponse>(
        `${BASE_URL}/jobs/us/history`,
        {
          params: {
            app_id: ADZUNA_APP_ID,
            app_key: ADZUNA_APP_KEY,
            what: title,
            location0: location ? `US:${location}` : undefined,
          },
        }
      );

      const monthlyData = Object.values(historyResponse.data.month || {});
      if (monthlyData.length > 0) {
        const avgSalary =
          monthlyData.reduce((a, b) => a + b, 0) / monthlyData.length;
        return {
          min: Math.round(avgSalary * 0.8),
          max: Math.round(avgSalary * 1.2),
          median: Math.round(avgSalary),
          sampleSize: monthlyData.length,
        };
      }
    } catch {
      // History endpoint may not be available for all searches
    }

    return getFallbackSalaryData(title);
  } catch (error) {
    console.error("Adzuna salary data fetch failed:", error);
    return getFallbackSalaryData(title);
  }
}

function getFallbackSalaryData(title: string): SalaryData {
  // Provide reasonable estimates based on common title patterns
  const titleLower = title.toLowerCase();

  let baseSalary = 75000;

  if (
    titleLower.includes("senior") ||
    titleLower.includes("lead") ||
    titleLower.includes("principal")
  ) {
    baseSalary = 150000;
  } else if (
    titleLower.includes("manager") ||
    titleLower.includes("director")
  ) {
    baseSalary = 140000;
  } else if (titleLower.includes("vp") || titleLower.includes("head of")) {
    baseSalary = 200000;
  } else if (
    titleLower.includes("engineer") ||
    titleLower.includes("developer")
  ) {
    baseSalary = 120000;
  } else if (titleLower.includes("analyst")) {
    baseSalary = 85000;
  } else if (titleLower.includes("intern") || titleLower.includes("junior")) {
    baseSalary = 60000;
  }

  return {
    min: Math.round(baseSalary * 0.8),
    max: Math.round(baseSalary * 1.3),
    median: baseSalary,
    sampleSize: 0,
  };
}

export async function getJobDetails(jobId: string): Promise<AdzunaJob | null> {
  if (!isConfigured()) {
    return null;
  }

  try {
    // Adzuna doesn't have a direct job details endpoint
    // We'd need to search and filter, so return null for now
    return null;
  } catch (error) {
    console.error("Adzuna job details fetch failed:", error);
    return null;
  }
}
