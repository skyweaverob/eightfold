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

// Map locations to zip codes for reliable Adzuna API results
const LOCATION_TO_ZIPCODE: Record<string, string> = {
  // San Francisco Bay Area
  "stanford": "94305",
  "palo alto": "94301",
  "menlo park": "94025",
  "mountain view": "94043",
  "sunnyvale": "94086",
  "cupertino": "95014",
  "santa clara": "95050",
  "san jose": "95112",
  "fremont": "94536",
  "oakland": "94612",
  "berkeley": "94704",
  "redwood city": "94063",
  "san mateo": "94401",
  "daly city": "94014",
  "hayward": "94541",
  "san francisco": "94102",
  "sf": "94102",
  // NYC Metro
  "new york": "10001",
  "nyc": "10001",
  "brooklyn": "11201",
  "queens": "11101",
  "bronx": "10451",
  "manhattan": "10001",
  "staten island": "10301",
  "jersey city": "07302",
  "hoboken": "07030",
  // LA Metro
  "los angeles": "90001",
  "la": "90001",
  "santa monica": "90401",
  "beverly hills": "90210",
  "pasadena": "91101",
  "burbank": "91502",
  "glendale": "91201",
  "long beach": "90802",
  "torrance": "90501",
  "culver city": "90230",
  // Seattle Metro
  "seattle": "98101",
  "bellevue": "98004",
  "redmond": "98052",
  "kirkland": "98033",
  "tacoma": "98402",
  // Boston Metro
  "boston": "02101",
  "cambridge": "02139",
  "somerville": "02143",
  "brookline": "02445",
  // DC Metro
  "washington": "20001",
  "washington dc": "20001",
  "dc": "20001",
  "arlington": "22201",
  "alexandria": "22301",
  "bethesda": "20814",
  // Chicago Metro
  "chicago": "60601",
  "evanston": "60201",
  "oak park": "60301",
  // Denver Metro
  "denver": "80202",
  "boulder": "80301",
  "aurora": "80010",
  // Austin Metro
  "austin": "78701",
  "round rock": "78664",
  "cedar park": "78613",
  // Other major cities
  "atlanta": "30301",
  "miami": "33101",
  "dallas": "75201",
  "houston": "77001",
  "phoenix": "85001",
  "philadelphia": "19101",
  "san diego": "92101",
  "portland": "97201",
  "detroit": "48201",
  "minneapolis": "55401",
  "charlotte": "28201",
  "nashville": "37201",
  "salt lake city": "84101",
  "raleigh": "27601",
};

// State abbreviations to full names
const STATE_NAMES: Record<string, string> = {
  "ca": "California",
  "california": "California",
  "ny": "New York",
  "new york": "New York",
  "tx": "Texas",
  "texas": "Texas",
  "wa": "Washington",
  "washington": "Washington",
  "ma": "Massachusetts",
  "massachusetts": "Massachusetts",
  "il": "Illinois",
  "illinois": "Illinois",
  "co": "Colorado",
  "colorado": "Colorado",
  "fl": "Florida",
  "florida": "Florida",
  "ga": "Georgia",
  "georgia": "Georgia",
  "nc": "North Carolina",
  "north carolina": "North Carolina",
  "pa": "Pennsylvania",
  "pennsylvania": "Pennsylvania",
  "oh": "Ohio",
  "ohio": "Ohio",
  "mi": "Michigan",
  "michigan": "Michigan",
  "az": "Arizona",
  "arizona": "Arizona",
  "or": "Oregon",
  "oregon": "Oregon",
};

function normalizeLocation(location: string): { zipcode: string | null; city: string | null; state: string | null } {
  const normalized = location.toLowerCase().trim();

  // Check if it's already a zip code
  const zipMatch = normalized.match(/\b(\d{5})\b/);
  if (zipMatch) {
    return { zipcode: zipMatch[1], city: null, state: null };
  }

  // Remove state suffix for city matching
  let cityPart = normalized;
  let statePart: string | null = null;

  // Check for "City, State" format
  if (normalized.includes(",")) {
    const parts = normalized.split(",").map(p => p.trim());
    cityPart = parts[0];
    if (parts[1]) {
      statePart = STATE_NAMES[parts[1]] || parts[1];
    }
  } else {
    // Check if location ends with state name/abbreviation
    for (const [abbr, full] of Object.entries(STATE_NAMES)) {
      if (normalized.endsWith(` ${abbr}`)) {
        cityPart = normalized.replace(new RegExp(` ${abbr}$`), "").trim();
        statePart = full;
        break;
      }
    }
  }

  // Look up zip code for city
  const zipcode = LOCATION_TO_ZIPCODE[cityPart] || null;

  return { zipcode, city: cityPart, state: statePart };
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

  const { zipcode, city, state } = normalizeLocation(location);

  // Try multiple search strategies in order of specificity
  const searchStrategies = [];

  if (zipcode) {
    // Strategy 1: Search by zip code with distance
    searchStrategies.push({ where: zipcode, distance: 50 });
  }

  if (city) {
    // Strategy 2: Search by city name
    searchStrategies.push({ where: city, distance: 30 });
  }

  if (state) {
    // Strategy 3: Search by state
    searchStrategies.push({ where: state });
  }

  // Strategy 4: Fallback to country-wide
  searchStrategies.push({ where: "USA" });

  for (const strategy of searchStrategies) {
    try {
      console.log(`Searching jobs: "${title}" in "${strategy.where}"${strategy.distance ? ` (${strategy.distance}mi)` : ""}`);

      // Build URL manually to avoid axios param encoding issues
      let url = `${BASE_URL}/jobs/us/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=${encodeURIComponent(title)}&where=${encodeURIComponent(strategy.where)}&results_per_page=${resultsPerPage}`;

      if (strategy.distance) {
        url += `&distance=${strategy.distance}`;
      }

      const response = await axios.get<AdzunaSearchResponse>(url);

      if (response.data.results && response.data.results.length > 0) {
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

        console.log(`Found ${jobs.length} jobs with strategy: ${strategy.where}`);

        return {
          jobs,
          totalCount: response.data.count,
        };
      }

      console.log(`No results for strategy: ${strategy.where}, trying next...`);
    } catch (error) {
      console.error(`Search failed for "${strategy.where}":`, error);
    }
  }

  console.log("All search strategies exhausted, returning empty results");
  return { jobs: [], totalCount: 0 };
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
    const { zipcode, state } = location ? normalizeLocation(location) : { zipcode: null, state: null };
    const searchLocation = zipcode || state || "California";

    const salaryUrl = `${BASE_URL}/jobs/us/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=${encodeURIComponent(title)}&where=${encodeURIComponent(searchLocation)}&results_per_page=50`;

    const searchResponse = await axios.get<AdzunaSearchResponse>(salaryUrl);

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
      const historyUrl = `${BASE_URL}/jobs/us/history?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=${encodeURIComponent(title)}`;
      const historyResponse = await axios.get<AdzunaHistoryResponse>(historyUrl);

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
