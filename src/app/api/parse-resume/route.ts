import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdf } from "@/lib/api/pdfco";
import { parseResumeWithAI } from "@/lib/api/claude";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No resume file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF
    const rawText = await extractTextFromPdf(buffer, file.name);

    // Parse with Claude AI
    const parsedResume = await parseResumeWithAI(rawText);

    return NextResponse.json({
      success: true,
      data: parsedResume,
    });
  } catch (error) {
    console.error("Resume parsing failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to parse resume",
      },
      { status: 500 }
    );
  }
}
