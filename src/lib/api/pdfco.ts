import type { ParsedResume } from "@/types";

const PDFCO_API_URL = "https://api.pdf.co/v1";

interface PdfCoTextResponse {
  body: string;
  pageCount: number;
  error: boolean;
  status: number;
  name: string;
  remainingCredits: number;
}

export async function extractTextFromPdf(
  fileBuffer: Buffer,
  filename: string
): Promise<string> {
  const apiKey = process.env.PDFCO_API_KEY;
  if (!apiKey) {
    throw new Error("PDFCO_API_KEY is not configured");
  }

  // Step 1: Upload the file to get a presigned URL
  const uploadResponse = await fetch(
    `${PDFCO_API_URL}/file/upload/get-presigned-url?name=${encodeURIComponent(filename)}&contenttype=application/pdf`,
    {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    }
  );

  if (!uploadResponse.ok) {
    throw new Error(`Failed to get upload URL: ${uploadResponse.statusText}`);
  }

  const uploadData = await uploadResponse.json();
  const { presignedUrl, url: fileUrl } = uploadData;

  // Step 2: Upload the file content
  const uploadFileResponse = await fetch(presignedUrl, {
    method: "PUT",
    body: new Uint8Array(fileBuffer),
    headers: {
      "Content-Type": "application/pdf",
    },
  });

  if (!uploadFileResponse.ok) {
    throw new Error(`Failed to upload file: ${uploadFileResponse.statusText}`);
  }

  // Step 3: Extract text from the PDF
  const extractResponse = await fetch(`${PDFCO_API_URL}/pdf/convert/to/text`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: fileUrl,
      inline: true,
      async: false,
    }),
  });

  if (!extractResponse.ok) {
    throw new Error(`Failed to extract text: ${extractResponse.statusText}`);
  }

  const textData: PdfCoTextResponse = await extractResponse.json();

  if (textData.error) {
    throw new Error("PDF.co returned an error during text extraction");
  }

  return textData.body;
}

export async function parseResumeText(rawText: string): Promise<ParsedResume> {
  // Basic parsing logic - this will be enhanced by Claude AI later
  const lines = rawText.split("\n").filter((line) => line.trim());

  // Extract email
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  const emailMatch = rawText.match(emailRegex);

  // Extract phone
  const phoneRegex = /[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/;
  const phoneMatch = rawText.match(phoneRegex);

  // Basic structure - AI will enhance this
  return {
    fullName: lines[0] || undefined, // Usually first line is name
    email: emailMatch?.[0],
    phone: phoneMatch?.[0],
    location: undefined,
    summary: undefined,
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    rawText,
  };
}
