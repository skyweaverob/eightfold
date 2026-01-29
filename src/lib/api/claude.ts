import Anthropic from "@anthropic-ai/sdk";
import type {
  ParsedResume,
  ProfileAnalysis,
  WebPresenceResult,
  SkillDemand,
  LinkedInProfile,
  RedFlag,
} from "@/types";

const anthropic = new Anthropic();

// Helper to extract JSON from Claude response (handles markdown code blocks)
function extractJSON(text: string): string {
  // Try to extract JSON from markdown code blocks
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  // Try to find JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return text.trim();
}

export async function parseResumeWithAI(rawText: string): Promise<ParsedResume> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Parse this resume text and extract structured information. Return a JSON object with the following structure:
{
  "fullName": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "summary": "string or null - professional summary if present",
  "experience": [
    {
      "company": "string",
      "title": "string",
      "location": "string or null",
      "startDate": "YYYY-MM or YYYY format",
      "endDate": "YYYY-MM or YYYY format or null if current",
      "current": "boolean",
      "description": "string or null",
      "highlights": ["array of key achievements"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string or null",
      "field": "string or null",
      "startDate": "YYYY format",
      "endDate": "YYYY format",
      "gpa": "string or null",
      "highlights": ["array of notable achievements"]
    }
  ],
  "skills": [
    {
      "name": "string",
      "category": "string - e.g., 'programming', 'soft skills', 'tools', etc."
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string or null",
      "date": "string or null"
    }
  ]
}

Resume text:
${rawText}

Return ONLY the JSON object, no additional text.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    const jsonText = extractJSON(content.text);
    const parsed = JSON.parse(jsonText);
    return {
      ...parsed,
      rawText,
    };
  } catch (e) {
    console.error("Failed to parse Claude response:", content.text.slice(0, 500));
    throw new Error("Failed to parse Claude response as JSON");
  }
}

export async function analyzeProfile(
  resume: ParsedResume,
  webPresence: WebPresenceResult[],
  linkedInProfile: LinkedInProfile | null,
  skillDemands: SkillDemand[],
  deepSearchSummary?: string
): Promise<ProfileAnalysis> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `You are a career intelligence analyst. Analyze this professional profile and provide comprehensive insights similar to what enterprise talent intelligence platforms provide to employers.

## Resume Data
${JSON.stringify(resume, null, 2)}

## Web Presence Found
${JSON.stringify(webPresence, null, 2)}

## LinkedIn Profile (if available)
${linkedInProfile ? JSON.stringify(linkedInProfile, null, 2) : "Not found"}

## Labor Market Skill Demand Data
${JSON.stringify(skillDemands, null, 2)}

## Deep Web Search Results
${deepSearchSummary || "No deep search performed."}

IMPORTANT: Use the deep web search results to significantly inform your analysis. The web search reveals:
- News coverage and media mentions → indicates thought leadership, visibility, and industry recognition
- Publications and research → indicates expertise depth and academic credibility
- Speaking engagements → indicates industry recognition and communication skills
- Patents → indicates innovation and technical problem-solving
- Awards and recognition → validates claimed achievements
- Open source contributions → indicates technical skills and community involvement
- Press releases and company news → validates career trajectory and role claims
- Podcast appearances → indicates subject matter expertise and public profile
- Video content → indicates presentation skills and public engagement

Factor these findings into your assessment. If someone claims to be a thought leader but has minimal web presence, that's a concern. If they have extensive news coverage and speaking engagements, that validates their expertise.

Provide a comprehensive analysis in the following JSON structure:
{
  "skills": {
    "stated": [{"name": "skill", "level": "beginner|intermediate|advanced|expert", "category": "category"}],
    "inferred": [{"name": "skill", "level": "level", "category": "category", "inferenceReason": "why you inferred this"}],
    "gaps": [{"skill": "skill name", "importance": "low|medium|high", "reason": "why this gap matters"}],
    "strengths": ["list of skill-based strengths"]
  },
  "career": {
    "trajectory": "description of career progression pattern",
    "progression": "linear|pivoting|accelerating|stagnating",
    "yearsOfExperience": number,
    "industryFocus": ["industries they've worked in"],
    "potentialPaths": [
      {
        "currentRole": "current or most recent title",
        "nextRoles": [{"title": "potential next role", "probability": 0.0-1.0, "requiredSkills": ["skills needed"]}]
      }
    ]
  },
  "marketPosition": {
    "overallScore": 0-100,
    "skillsInDemand": ["their skills that are in high demand"],
    "skillsToAcquire": ["skills they should learn"],
    "salaryRange": {"min": number, "max": number, "median": number},
    "competitiveness": "low|medium|high"
  },
  "webPresence": {
    "platforms": [{"platform": "name", "url": "url", "assessment": "positive|neutral|negative|missing"}],
    "consistency": 0-100,
    "issues": ["list of issues or inconsistencies found"]
  },
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "skills|experience|education|online-presence|networking",
      "title": "short recommendation title",
      "description": "detailed description",
      "actionItems": ["specific action items"]
    }
  ],
  "concerns": [
    {
      "severity": "low|medium|high",
      "area": "area of concern",
      "description": "what employers might be concerned about",
      "mitigation": "how to address this concern"
    }
  ]
}

Be thorough, honest, and actionable. Think about what an employer using Eightfold.AI or similar would see and flag. The candidate deserves to know this information.

Return ONLY the JSON object.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    const jsonText = extractJSON(content.text);
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse analysis response:", content.text.slice(0, 500));
    throw new Error("Failed to parse analysis response as JSON");
  }
}

export async function generateRecommendations(
  analysis: ProfileAnalysis,
  targetRole?: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Based on this profile analysis, provide a personalized action plan${targetRole ? ` for transitioning to a ${targetRole} role` : ""}.

Analysis:
${JSON.stringify(analysis, null, 2)}

Provide specific, actionable advice in a conversational but professional tone. Focus on:
1. Immediate actions (this week)
2. Short-term goals (next 30 days)
3. Medium-term development (next 3-6 months)

Be specific and reference their actual skills, gaps, and market position.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return content.text;
}

export async function analyzeRedFlags(
  resume: ParsedResume,
  webPresence: WebPresenceResult[]
): Promise<RedFlag[]> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Analyze this profile for red flags that automated screening systems (ATS, AI talent platforms like Eightfold, HireVue, etc.) might detect.

Profile:
${JSON.stringify({ resume, webPresence }, null, 2)}

For each red flag, explain:
1. What the system sees
2. Why it's concerning to automated screening
3. What to do about it

Be honest. Be specific. Be actionable. Think like an ATS algorithm.

Common red flags to consider:
- Employment gaps
- Short tenure patterns
- Title inconsistencies
- Skill claims without evidence
- Missing web presence for claimed expertise
- Date overlaps or inconsistencies
- Overqualification signals
- Career direction unclear

Return JSON only:
{
  "flags": [
    {
      "title": "<short descriptive name>",
      "priority": "high" | "medium" | "low",
      "whatSystemSees": "<what the ATS/AI detects>",
      "whyConcerning": "<why this matters to employers>",
      "action": "<specific fix>"
    }
  ]
}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    const jsonText = extractJSON(content.text);
    const parsed = JSON.parse(jsonText);
    return parsed.flags || [];
  } catch (e) {
    console.error("Failed to parse red flags response:", content.text.slice(0, 500));
    return [];
  }
}
