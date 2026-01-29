import { NextRequest, NextResponse } from "next/server";
import { getSalaryData } from "@/lib/api/adzuna";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface SalaryEstimateRequest {
  title: string;
  location: string;
  yearsExperience?: number;
  skills?: string[];
  recentTitles?: string[];
}

interface PercentileEstimate {
  low: number;
  high: number;
  rationale: string;
}

async function estimatePercentile(
  title: string,
  location: string,
  yearsExperience: number,
  skills: string[],
  recentTitles: string[],
  salaryMin: number,
  salaryMax: number,
  median: number
): Promise<PercentileEstimate> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are estimating where a candidate falls within a salary range.

Market Data:
- Role: ${title}
- Location: ${location}
- Range: $${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}
- Median: $${median.toLocaleString()}

Candidate:
- Years: ${yearsExperience}
- Skills: ${skills.join(", ") || "Not specified"}
- Recent titles: ${recentTitles.join(", ") || "Not specified"}

Return JSON only:
{
  "low": <percentile number 0-100>,
  "high": <percentile number 0-100>,
  "rationale": "<one sentence>"
}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    console.error("Percentile estimation failed:", error);
  }

  // Fallback estimation based on years of experience
  const basePercentile = Math.min(50 + yearsExperience * 5, 90);
  return {
    low: Math.max(basePercentile - 10, 25),
    high: Math.min(basePercentile + 10, 95),
    rationale: `Based on ${yearsExperience} years of experience in ${title} roles.`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SalaryEstimateRequest = await request.json();
    const { title, location, yearsExperience = 3, skills = [], recentTitles = [] } = body;

    if (!title || !location) {
      return NextResponse.json(
        { error: "Title and location are required" },
        { status: 400 }
      );
    }

    // Get salary data from Adzuna
    const salaryData = await getSalaryData(title, location);

    if (!salaryData) {
      return NextResponse.json(
        { error: "Could not retrieve salary data" },
        { status: 500 }
      );
    }

    // Estimate percentile position
    const percentile = await estimatePercentile(
      title,
      location,
      yearsExperience,
      skills,
      recentTitles,
      salaryData.min,
      salaryData.max,
      salaryData.median
    );

    return NextResponse.json({
      min: salaryData.min,
      max: salaryData.max,
      median: salaryData.median,
      percentile,
      location,
      sampleSize: salaryData.sampleSize,
    });
  } catch (error) {
    console.error("Salary estimate error:", error);
    return NextResponse.json(
      { error: "Failed to estimate salary" },
      { status: 500 }
    );
  }
}
