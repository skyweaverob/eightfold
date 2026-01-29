"use client";

import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import { Stepper } from "@/components/ui/stepper";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { ProfileAnalysis, ParsedResume, WebPresenceResult, SalaryEstimate, DeepSearchResults } from "@/types";

interface AnalysisResult {
  parsedResume: ParsedResume;
  webPresence: WebPresenceResult[];
  analysis: ProfileAnalysis;
  salaryEstimate?: SalaryEstimate;
  deepSearchResults?: DeepSearchResults;
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
      <div className="min-h-screen bg-white flex flex-col">
        {/* Minimal header - only shows during analysis or with results */}
        {isLoading && (
          <header className="py-5 border-b border-gray-100 glass sticky top-0 z-50">
            <div className="container mx-auto px-6">
              <span className="text-xl font-semibold text-gray-900 tracking-tight">
                Profile Mirror
              </span>
            </div>
          </header>
        )}

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
          {!isLoading ? (
            // Upload Screen - Pure focus
            <div className="w-full max-w-lg text-center">
              <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight">
                Profile Mirror
              </h1>
              <p className="text-xl text-gray-500 mb-14 font-normal">
                Know what they know.
              </p>

              <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />

              {error && (
                <div className="mt-8 p-5 bg-red-50 border border-red-100 rounded-2xl">
                  <p className="text-base text-red-600">{error}</p>
                </div>
              )}
            </div>
          ) : (
            // Analyzing Screen
            <div className="w-full max-w-xl text-center">
              <h2 className="text-3xl font-semibold text-gray-900 mb-10 tracking-tight">
                Analyzing your profile
              </h2>

              <Stepper steps={STEPS} currentStep={currentStepNum} className="mb-10" />

              <div className="py-10">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-5" />
                <p className="text-xl font-medium text-gray-900">
                  {currentMessage}
                </p>
                {currentDetail && (
                  <p className="text-base text-gray-500 mt-3">
                    {currentDetail}
                  </p>
                )}
              </div>
            </div>
          )}
        </main>

        {!isLoading && (
          <footer className="py-8 text-center">
            <p className="text-sm text-gray-400 font-normal">
              Your resume is processed securely and not stored.
            </p>
          </footer>
        )}
      </div>
    );
  }

  // Results Screen
  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header with identity */}
      <header className="py-5 border-b border-gray-100 sticky top-0 glass z-50">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              {result.parsedResume.fullName || "Profile Mirror"}
            </h1>
            {result.parsedResume.email && (
              <p className="text-sm text-gray-500 mt-0.5">
                {result.parsedResume.email}
                {result.parsedResume.location && ` · ${result.parsedResume.location}`}
              </p>
            )}
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-base text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            New Analysis
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        <AnalysisDashboard
          analysis={result.analysis}
          resume={result.parsedResume}
          webPresence={result.webPresence}
          salaryEstimate={result.salaryEstimate}
          deepSearchResults={result.deepSearchResults}
        />
      </main>

      <footer className="py-8 border-t border-gray-100 bg-white">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-gray-400">
            Profile Mirror — Know what they know.
          </p>
        </div>
      </footer>
    </div>
  );
}
