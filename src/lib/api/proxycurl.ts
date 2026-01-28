import type { LinkedInProfile, WorkExperience, Education } from "@/types";

const PROXYCURL_API_URL = "https://nubela.co/proxycurl/api/v2";

interface ProxycurlExperience {
  company: string;
  company_linkedin_profile_url?: string;
  title: string;
  description?: string;
  location?: string;
  starts_at?: { day?: number; month?: number; year?: number };
  ends_at?: { day?: number; month?: number; year?: number };
}

interface ProxycurlEducation {
  school: string;
  school_linkedin_profile_url?: string;
  degree_name?: string;
  field_of_study?: string;
  starts_at?: { day?: number; month?: number; year?: number };
  ends_at?: { day?: number; month?: number; year?: number };
  description?: string;
  activities_and_societies?: string;
  grade?: string;
}

interface ProxycurlProfileResponse {
  public_identifier: string;
  profile_pic_url?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  headline?: string;
  summary?: string;
  country?: string;
  country_full_name?: string;
  city?: string;
  state?: string;
  experiences?: ProxycurlExperience[];
  education?: ProxycurlEducation[];
  skills?: string[];
  certifications?: {
    name: string;
    authority?: string;
    starts_at?: { day?: number; month?: number; year?: number };
    ends_at?: { day?: number; month?: number; year?: number };
  }[];
  connections?: number;
  follower_count?: number;
}

function formatDate(dateObj?: {
  day?: number;
  month?: number;
  year?: number;
}): string | undefined {
  if (!dateObj?.year) return undefined;
  const parts: string[] = [String(dateObj.year)];
  if (dateObj.month) parts.push(String(dateObj.month).padStart(2, "0"));
  if (dateObj.day) parts.push(String(dateObj.day).padStart(2, "0"));
  return parts.join("-");
}

export async function getLinkedInProfile(
  linkedinUrl: string
): Promise<LinkedInProfile> {
  const apiKey = process.env.PROXYCURL_API_KEY;
  if (!apiKey) {
    throw new Error("PROXYCURL_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    url: linkedinUrl,
    skills: "include",
    use_cache: "if-present",
  });

  const response = await fetch(
    `${PROXYCURL_API_URL}/linkedin?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("LinkedIn profile not found");
    }
    throw new Error(`Proxycurl request failed: ${response.statusText}`);
  }

  const data: ProxycurlProfileResponse = await response.json();

  // Transform to our format
  const experience: WorkExperience[] =
    data.experiences?.map((exp) => ({
      company: exp.company,
      title: exp.title,
      location: exp.location,
      startDate: formatDate(exp.starts_at),
      endDate: formatDate(exp.ends_at),
      current: !exp.ends_at,
      description: exp.description,
    })) || [];

  const education: Education[] =
    data.education?.map((edu) => ({
      institution: edu.school,
      degree: edu.degree_name,
      field: edu.field_of_study,
      startDate: formatDate(edu.starts_at),
      endDate: formatDate(edu.ends_at),
      highlights: edu.activities_and_societies
        ? [edu.activities_and_societies]
        : undefined,
    })) || [];

  return {
    url: linkedinUrl,
    fullName: data.full_name,
    headline: data.headline,
    summary: data.summary,
    location: [data.city, data.state, data.country_full_name]
      .filter(Boolean)
      .join(", "),
    connections: data.connections,
    experience,
    education,
    skills: data.skills,
    certifications: data.certifications?.map((cert) => ({
      name: cert.name,
      issuer: cert.authority,
      date: formatDate(cert.starts_at),
      expirationDate: formatDate(cert.ends_at),
    })),
  };
}

export async function lookupLinkedInByEmail(
  email: string
): Promise<string | null> {
  const apiKey = process.env.PROXYCURL_API_KEY;
  if (!apiKey) {
    throw new Error("PROXYCURL_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    email,
    lookup_depth: "deep",
  });

  const response = await fetch(
    `${PROXYCURL_API_URL}/linkedin/profile/resolve/email?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Proxycurl lookup failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.linkedin_profile_url || null;
}
