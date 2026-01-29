"use client";

import { useState } from "react";
import { ArrowLeft, Check, X, Loader2, Eye, User } from "lucide-react";
import { HRView } from "./HRView";
import type { JobListing, JobCompatibility as JobCompatibilityType, ProfileAnalysis, ParsedResume, SalaryEstimate } from "@/types";

interface JobCompatibilityProps {
  job: JobListing;
  compatibility: JobCompatibilityType | null;
  isLoading: boolean;
  onBack: () => void;
  profileAnalysis: ProfileAnalysis;
  resume: ParsedResume;
  marketValue: SalaryEstimate;
}

function formatSalary(amount: number): string {
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}K`;
  }
  return `$${Math.round(amount).toLocaleString()}`;
}

function formatSalaryRange(minVal: number, maxVal: number): string {
  const formattedMin = formatSalary(minVal);
  const formattedMax = formatSalary(maxVal);

  if (formattedMin === formattedMax || Math.abs(maxVal - minVal) < 1000) {
    return formattedMin;
  }
  return `${formattedMin} – ${formattedMax}`;
}

export function JobCompatibility({
  job,
  compatibility,
  isLoading,
  onBack,
  profileAnalysis,
  resume,
  marketValue,
}: JobCompatibilityProps) {
  const [viewMode, setViewMode] = useState<"candidate" | "hr">("candidate");

  // Show HR View when toggled and we have compatibility data
  if (viewMode === "hr" && compatibility) {
    return (
      <HRView
        job={job}
        compatibility={compatibility}
        profileAnalysis={profileAnalysis}
        resume={resume}
        marketValue={marketValue}
        onBack={() => setViewMode("candidate")}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and view toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </button>

        {/* View Toggle */}
        {compatibility && (
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode("candidate")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "candidate"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <User className="w-4 h-4" />
              Your View
            </button>
            <button
              onClick={() => setViewMode("hr")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "hr"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Eye className="w-4 h-4" />
              HR View
            </button>
          </div>
        )}
      </div>

      {/* Job Header */}
      <div className="text-center pb-6 border-b border-gray-100">
        <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">{job.title}</h3>
        <p className="text-lg text-gray-500 mt-1">
          {job.company} · {job.location}
        </p>
        {(job.salaryMin || job.salaryMax) && (
          <p className="text-base text-gray-400 mt-2">
            {job.salaryMin && job.salaryMax
              ? formatSalaryRange(job.salaryMin, job.salaryMax)
              : job.salaryMin
                ? formatSalary(job.salaryMin)
                : formatSalary(job.salaryMax!)}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">
            Analyzing your compatibility...
          </p>
        </div>
      ) : compatibility ? (
        <>
          {/* Compatibility Score */}
          <div className="text-center py-8 bg-gray-50 rounded-2xl">
            <div className={`text-6xl font-bold tracking-tight ${
              compatibility.score >= 70
                ? "text-green-500"
                : compatibility.score >= 40
                  ? "text-yellow-500"
                  : "text-red-500"
            }`}>
              {compatibility.score}
            </div>
            <div className="text-base font-medium text-gray-500 mt-2">
              Compatibility Score
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-5">
            <h4 className="font-semibold text-gray-900 text-lg">Breakdown</h4>
            {[
              { label: "Skills Match", value: compatibility.breakdown.skills },
              { label: "Experience Fit", value: compatibility.breakdown.experience },
              { label: "Industry Alignment", value: compatibility.breakdown.industry },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-base">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold text-gray-900">{item.value}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      item.value >= 70
                        ? "bg-green-500"
                        : item.value >= 40
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Salary Leverage */}
          {compatibility.salaryLeverage && (
            <div className="pt-6 border-t border-gray-100">
              <h4 className="font-semibold text-gray-900 text-center mb-5 text-lg">
                Your Salary Leverage
              </h4>
              <div className="text-center mb-5">
                <div className="text-3xl font-bold text-gray-900 tracking-tight">
                  {formatSalaryRange(compatibility.salaryLeverage.targetLow, compatibility.salaryLeverage.targetHigh)}
                </div>
              </div>
              <div className="relative px-4">
                <div className="h-3 bg-gray-100 rounded-full">
                  <div
                    className="absolute h-full bg-blue-500 rounded-full transition-all duration-700"
                    style={{
                      left: `${((compatibility.salaryLeverage.targetLow - (job.salaryMin || compatibility.salaryLeverage.targetLow * 0.8)) / ((job.salaryMax || compatibility.salaryLeverage.targetHigh * 1.2) - (job.salaryMin || compatibility.salaryLeverage.targetLow * 0.8))) * 100}%`,
                      width: `${((compatibility.salaryLeverage.targetHigh - compatibility.salaryLeverage.targetLow) / ((job.salaryMax || compatibility.salaryLeverage.targetHigh * 1.2) - (job.salaryMin || compatibility.salaryLeverage.targetLow * 0.8))) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-3 text-sm text-gray-400">
                  <span>{formatSalary(job.salaryMin || compatibility.salaryLeverage.targetLow * 0.8)}</span>
                  <span>{formatSalary(job.salaryMax || compatibility.salaryLeverage.targetHigh * 1.2)}</span>
                </div>
              </div>
              <p className="text-base text-gray-600 text-center mt-4">
                {compatibility.salaryLeverage.rationale}
              </p>
            </div>
          )}

          {/* Strengths */}
          {compatibility.strengths.length > 0 && (
            <div className="pt-6 border-t border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-4 text-lg">
                Strengths for This Role
              </h4>
              <ul className="space-y-3">
                {compatibility.strengths.map((strength, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-base text-gray-700"
                  >
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gaps */}
          {compatibility.gaps.length > 0 && (
            <div className="pt-6 border-t border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-4 text-lg">
                Gaps to Address
              </h4>
              <ul className="space-y-3">
                {compatibility.gaps.map((gap, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-base text-gray-700"
                  >
                    <X className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          {compatibility.recommendation && (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
              <h4 className="font-semibold text-blue-900 mb-3 text-lg">
                Recommendation
              </h4>
              <p className="text-base text-blue-800 leading-relaxed">
                {compatibility.recommendation}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">
            Unable to analyze compatibility. Please try again.
          </p>
        </div>
      )}
    </div>
  );
}
