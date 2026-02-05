"use client";

import { useState, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import { IntroAnimation } from "@/components/IntroAnimation";
import { Stepper } from "@/components/ui/stepper";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { ProfileAnalysis, ParsedResume, WebPresenceResult, SalaryEstimate, DeepSearchResults, LinkedInProfile } from "@/types";

interface AnalysisResult {
  parsedResume: ParsedResume;
  webPresence: WebPresenceResult[];
  linkedInProfile?: LinkedInProfile;
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
  const [showIntro, setShowIntro] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentStepNum, setCurrentStepNum] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentDetail, setCurrentDetail] = useState("");

  // Check if user has seen intro before
  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("boxbreaker-intro-seen");
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem("boxbreaker-intro-seen", "true");
    setShowIntro(false);
  };

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

  // Show intro animation
  if (showIntro) {
    return <IntroAnimation onComplete={handleIntroComplete} />;
  }

  // Upload/Analysis Screen
  if (!result) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Minimal header - only shows during analysis or with results */}
        {isLoading && (
          <header className="py-5 border-b border-gray-100 glass sticky top-0 z-50">
            <div className="container mx-auto px-6">
              <span className="text-xl font-semibold text-gray-900 tracking-tight">
                Box Breaker
              </span>
            </div>
          </header>
        )}

        <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-8 md:py-16">
          {!isLoading ? (
            // Upload Screen - Pure focus
            <div className="w-full max-w-lg text-center px-4">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-2 md:mb-3 tracking-tight">
                Box Breaker
              </h1>
              <p className="text-lg md:text-xl text-gray-500 mb-8 md:mb-14 font-normal">
                Break HR&apos;s Black Box.
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
            <div className="w-full max-w-xl text-center px-4">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 md:mb-10 tracking-tight">
                Breaking the black box
              </h2>

              <Stepper steps={STEPS} currentStep={currentStepNum} className="mb-6 md:mb-10" />

              <div className="py-6 md:py-10">
                <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-blue-500 mx-auto mb-4 md:mb-5" />
                <p className="text-lg md:text-xl font-medium text-gray-900">
                  {currentMessage}
                </p>
                {currentDetail && (
                  <p className="text-sm md:text-base text-gray-500 mt-2 md:mt-3">
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
      <header className="py-3 md:py-5 border-b border-gray-100 sticky top-0 glass z-50">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-base md:text-xl font-semibold text-gray-900 tracking-tight truncate">
              {result.parsedResume.fullName || "Box Breaker"}
            </h1>
            {result.parsedResume.email && (
              <p className="text-xs md:text-sm text-gray-500 mt-0.5 truncate">
                {result.parsedResume.email}
                <span className="hidden sm:inline">
                  {result.parsedResume.location && ` · ${result.parsedResume.location}`}
                </span>
              </p>
            )}
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 md:gap-2 text-sm md:text-base text-gray-500 hover:text-gray-900 transition-colors font-medium whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">New Analysis</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-10">
        <AnalysisDashboard
          analysis={result.analysis}
          resume={result.parsedResume}
          webPresence={result.webPresence}
          linkedInProfile={result.linkedInProfile}
          salaryEstimate={result.salaryEstimate}
          deepSearchResults={result.deepSearchResults}
        />
      </main>

      <footer className="py-6 md:py-8 border-t border-gray-100 bg-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-xs md:text-sm text-gray-400">
            Box Breaker — Break HR&apos;s Black Box.
          </p>
        </div>
      </footer>
    </div>
  );
}
