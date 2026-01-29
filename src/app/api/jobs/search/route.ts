import { NextRequest, NextResponse } from "next/server";
import { searchJobs } from "@/lib/api/adzuna";

interface JobSearchRequest {
  title: string;
  location: string;
  page?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: JobSearchRequest = await request.json();
    const { title, location, page = 1 } = body;

    if (!title || !location) {
      return NextResponse.json(
        { error: "Title and location are required" },
        { status: 400 }
      );
    }

    const result = await searchJobs(title, location, page);

    return NextResponse.json({
      jobs: result.jobs,
      totalCount: result.totalCount,
      page,
    });
  } catch (error) {
    console.error("Job search error:", error);
    return NextResponse.json(
      { error: "Failed to search jobs" },
      { status: 500 }
    );
  }
}
