"use client";

import { Badge } from "./ui/badge";
import { ScoreDisplay } from "./ui/score-display";
import { ProgressBar } from "./ui/progress-bar";
import { SalaryRange } from "./ui/salary-range";
import { ArrowLeft, Check, X, Loader2 } from "lucide-react";
import type { JobListing, JobCompatibility as JobCompatibilityType } from "@/types";

interface JobCompatibilityProps {
  job: JobListing;
  compatibility: JobCompatibilityType | null;
  isLoading: boolean;
  onBack: () => void;
}

export function JobCompatibility({
  job,
  compatibility,
  isLoading,
  onBack,
}: JobCompatibilityProps) {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-footnote text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to search
      </button>

      {/* Job Header */}
      <div className="text-center pb-4 border-b border-[var(--border-light)]">
        <h3 className="text-title-2 text-[var(--text-primary)]">{job.title}</h3>
        <p className="text-subhead text-[var(--text-secondary)]">
          {job.company} · {job.location}
        </p>
        {(job.salaryMin || job.salaryMax) && (
          <p className="text-footnote text-[var(--text-tertiary)] mt-1">
            ${job.salaryMin?.toLocaleString() || "?"} – $
            {job.salaryMax?.toLocaleString() || "?"}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)] mx-auto mb-3" />
          <p className="text-subhead text-[var(--text-secondary)]">
            Analyzing compatibility...
          </p>
        </div>
      ) : compatibility ? (
        <>
          {/* Compatibility Score */}
          <div className="flex justify-center py-4">
            <ScoreDisplay
              score={compatibility.score}
              label="Compatibility Score"
              size="lg"
            />
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            <ProgressBar
              value={compatibility.breakdown.skills}
              label="Skills Match"
              size="md"
            />
            <ProgressBar
              value={compatibility.breakdown.experience}
              label="Experience Fit"
              size="md"
            />
            <ProgressBar
              value={compatibility.breakdown.industry}
              label="Industry Alignment"
              size="md"
            />
          </div>

          {/* Salary Leverage */}
          {compatibility.salaryLeverage && (
            <div className="pt-4 border-t border-[var(--border-light)]">
              <h4 className="text-headline text-[var(--text-primary)] text-center mb-4">
                Your Leverage
              </h4>
              <SalaryRange
                min={job.salaryMin || compatibility.salaryLeverage.targetLow * 0.8}
                max={job.salaryMax || compatibility.salaryLeverage.targetHigh * 1.2}
                targetMin={compatibility.salaryLeverage.targetLow}
                targetMax={compatibility.salaryLeverage.targetHigh}
              />
              <p className="text-footnote text-[var(--text-secondary)] text-center mt-3">
                {compatibility.salaryLeverage.rationale}
              </p>
            </div>
          )}

          {/* Strengths */}
          {compatibility.strengths.length > 0 && (
            <div className="pt-4 border-t border-[var(--border-light)]">
              <h4 className="text-headline text-[var(--text-primary)] mb-3">
                Strengths for This Role
              </h4>
              <ul className="space-y-2">
                {compatibility.strengths.map((strength, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-footnote text-[var(--text-secondary)]"
                  >
                    <Check className="w-4 h-4 text-[var(--success)] mt-0.5 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gaps */}
          {compatibility.gaps.length > 0 && (
            <div className="pt-4 border-t border-[var(--border-light)]">
              <h4 className="text-headline text-[var(--text-primary)] mb-3">
                Gaps to Address
              </h4>
              <ul className="space-y-2">
                {compatibility.gaps.map((gap, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-footnote text-[var(--text-secondary)]"
                  >
                    <X className="w-4 h-4 text-[var(--warning)] mt-0.5 flex-shrink-0" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          {compatibility.recommendation && (
            <div className="p-4 bg-[var(--accent-light)] rounded-[var(--radius-md)]">
              <h4 className="text-headline text-[var(--accent)] mb-2">
                Recommendation
              </h4>
              <p className="text-subhead text-[var(--text-primary)]">
                {compatibility.recommendation}
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="text-footnote text-[var(--text-secondary)] text-center py-8">
          Unable to analyze compatibility. Please try again.
        </p>
      )}
    </div>
  );
}
