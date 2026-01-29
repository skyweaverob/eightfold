"use client";

import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import { Stepper } from "@/components/ui/stepper";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { ProfileAnalysis, ParsedResume, WebPresenceResult, SalaryEstimate } from "@/types";

interface AnalysisResult {
  parsedResume: ParsedResume;
  webPresence: WebPresenceResult[];
  analysis: ProfileAnalysis;
  salaryEstimate?: SalaryEstimate;
}

interface ProgressStep {
  step: number;
  message: string;
  detail?: string;
  complete: boolean;
}

const STEPS = [
  { label: "Extracting text" },
  { label: "Parsing structure" },
  { label: "Web presence" },
  { label: "Market data" },
  { label: "AI analysis" },
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentStepNum, setCurrentStepNum] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentDetail, setCurrentDetail] = useState("");

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentStepNum(1);
    setCurrentMessage("Starting analysis...");
    setCurrentDetail("");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);

            if (data.type === "progress") {
              setCurrentStepNum(data.step);
              setCurrentMessage(data.message);
              setCurrentDetail(data.detail || "");
            } else if (data.type === "error") {
              throw new Error(data.error);
            } else if (data.type === "result" && data.success) {
              setResult(data.data);
            }
          } catch (e) {
            if (e instanceof SyntaxError) {
              console.error("Failed to parse line:", line);
            } else {
              throw e;
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCurrentStepNum(0);
    setCurrentMessage("");
    setCurrentDetail("");
  };

  // Upload/Analysis Screen
  if (!result) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        {/* Minimal header - only shows during analysis or with results */}
        {isLoading && (
          <header className="py-4 border-b border-[var(--border-light)]">
            <div className="container mx-auto px-4">
              <span className="text-headline text-[var(--text-primary)]">
                Profile Mirror
              </span>
            </div>
          </header>
        )}

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          {!isLoading ? (
            // Upload Screen - Pure focus
            <div className="w-full max-w-md text-center">
              <h1 className="text-title-1 text-[var(--text-primary)] mb-2">
                Profile Mirror
              </h1>
              <p className="text-subhead text-[var(--text-secondary)] mb-12">
                Know what they know.
              </p>

              <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />

              {error && (
                <div className="mt-6 p-4 bg-[var(--error-light)] rounded-[var(--radius-md)]">
                  <p className="text-footnote text-[var(--error)]">{error}</p>
                </div>
              )}
            </div>
          ) : (
            // Analyzing Screen
            <div className="w-full max-w-lg text-center">
              <h2 className="text-title-2 text-[var(--text-primary)] mb-8">
                Analyzing
              </h2>

              <Stepper steps={STEPS} currentStep={currentStepNum} className="mb-8" />

              <div className="py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)] mx-auto mb-4" />
                <p className="text-headline text-[var(--text-primary)]">
                  {currentMessage}
                </p>
                {currentDetail && (
                  <p className="text-footnote text-[var(--text-secondary)] mt-2">
                    {currentDetail}
                  </p>
                )}
              </div>
            </div>
          )}
        </main>

        {!isLoading && (
          <footer className="py-6 text-center">
            <p className="text-caption text-[var(--text-tertiary)]">
              Your resume is processed securely and not stored.
            </p>
          </footer>
        )}
      </div>
    );
  }

  // Results Screen
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header with identity */}
      <header className="py-4 border-b border-[var(--border-light)] sticky top-0 bg-[var(--background)] z-50">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-headline text-[var(--text-primary)]">
              {result.parsedResume.fullName || "Profile Mirror"}
            </h1>
            {result.parsedResume.email && (
              <p className="text-caption text-[var(--text-secondary)]">
                {result.parsedResume.email}
                {result.parsedResume.location && ` · ${result.parsedResume.location}`}
              </p>
            )}
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-footnote text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            New Analysis
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <AnalysisDashboard
          analysis={result.analysis}
          resume={result.parsedResume}
          webPresence={result.webPresence}
          salaryEstimate={result.salaryEstimate}
        />
      </main>

      <footer className="py-6 border-t border-[var(--border-light)]">
        <div className="container mx-auto px-4 text-center">
          <p className="text-caption text-[var(--text-tertiary)]">
            Profile Mirror — Know what they know.
          </p>
        </div>
      </footer>
    </div>
  );
}
