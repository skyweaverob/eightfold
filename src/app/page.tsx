"use client";

import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Zap, Eye } from "lucide-react";
import type { ProfileAnalysis, ParsedResume, WebPresenceResult } from "@/types";

interface AnalysisResult {
  parsedResume: ParsedResume;
  webPresence: WebPresenceResult[];
  analysis: ProfileAnalysis;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState<string>("");

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setProgress("Uploading resume...");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      setProgress("Analyzing your profile... This may take up to a minute.");

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
      setProgress("");
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Profile Mirror</span>
          </div>
          {result && (
            <Button variant="ghost" onClick={handleReset}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!result ? (
          <>
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                See What Employers See
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Discover your complete professional digital footprint. Profile Mirror
                aggregates your online presence and provides AI-powered insights
                similar to enterprise talent intelligence platforms.
              </p>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold mb-1">Digital Footprint</h3>
                  <p className="text-sm text-gray-500">
                    See all your professional profiles across the web
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-1">AI Skills Analysis</h3>
                  <p className="text-sm text-gray-500">
                    Discover skills you have but may not have listed
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold mb-1">Market Position</h3>
                  <p className="text-sm text-gray-500">
                    Understand your competitive standing in the job market
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="max-w-xl mx-auto">
              <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />

              {isLoading && progress && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500 animate-pulse">{progress}</p>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="mt-8 text-center text-sm text-gray-500">
                <p>
                  Your resume is processed securely and not stored permanently.
                </p>
              </div>
            </div>
          </>
        ) : (
          <AnalysisDashboard
            analysis={result.analysis}
            resume={result.parsedResume}
            webPresence={result.webPresence}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            Profile Mirror - Democratizing talent intelligence for job seekers
          </p>
        </div>
      </footer>
    </div>
  );
}
