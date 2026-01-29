import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { JobListing, ProfileAnalysis, SalaryEstimate, JobCompatibility } from "@/types";

const anthropic = new Anthropic();

interface CompatibilityRequest {
  job: JobListing;
  profileAnalysis: ProfileAnalysis;
  marketValue: SalaryEstimate;
}

function extractJSON(text: string): string {
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  return text.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body: CompatibilityRequest = await request.json();
    const { job, profileAnalysis, marketValue } = body;

    if (!job || !profileAnalysis) {
      return NextResponse.json(
        { error: "Job and profile analysis are required" },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Analyze this candidate's fit for a specific role.

Job:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Description: ${job.description?.slice(0, 1000) || "Not provided"}
- Salary: $${job.salaryMin?.toLocaleString() || "?"} - $${job.salaryMax?.toLocaleString() || "?"}

Candidate Profile Analysis:
- Experience: ${profileAnalysis.career.yearsOfExperience} years
- Skills: ${profileAnalysis.skills.stated.map(s => s.name).join(", ")}
- Inferred Skills: ${profileAnalysis.skills.inferred.map(s => s.name).join(", ")}
- Industry Focus: ${profileAnalysis.career.industryFocus.join(", ")}
- Current Trajectory: ${profileAnalysis.career.trajectory}
- Market Value: $${marketValue.min.toLocaleString()} - $${marketValue.max.toLocaleString()}

Be specific. Generic advice is failure. Think about what makes THIS candidate a good or poor fit for THIS specific role.

Return JSON only:
{
  "score": <0-100>,
  "breakdown": {
    "skills": <0-100>,
    "experience": <0-100>,
    "industry": <0-100>
  },
  "strengths": ["<specific to THIS job, 2-4 items>"],
  "gaps": ["<specific to THIS job, 2-4 items>"],
  "salaryLeverage": {
    "targetLow": <number - where they should anchor low>,
    "targetHigh": <number - where they should anchor high>,
    "rationale": "<why this range, 1 sentence>"
  },
  "recommendation": "<2-3 sentences specific to THIS application>"
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
      const compatibility: JobCompatibility = JSON.parse(jsonText);
      return NextResponse.json(compatibility);
    } catch {
      console.error("Failed to parse compatibility response:", content.text.slice(0, 500));
      throw new Error("Failed to parse compatibility response");
    }
  } catch (error) {
    console.error("Compatibility analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze compatibility" },
      { status: 500 }
    );
  }
}
