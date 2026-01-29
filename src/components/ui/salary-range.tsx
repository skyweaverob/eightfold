"use client";

import { cn } from "@/lib/utils";

interface SalaryRangeProps {
  min: number;
  max: number;
  targetMin?: number;
  targetMax?: number;
  label?: string;
  location?: string;
  percentile?: { low: number; high: number };
  className?: string;
}

function formatSalary(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export function SalaryRange({
  min,
  max,
  targetMin,
  targetMax,
  label,
  location,
  percentile,
  className,
}: SalaryRangeProps) {
  // Calculate position percentages for the target range within the full range
  const range = max - min;
  const targetLeftPercent = targetMin
    ? ((targetMin - min) / range) * 100
    : null;
  const targetRightPercent = targetMax
    ? ((max - targetMax) / range) * 100
    : null;
  const targetWidthPercent =
    targetMin && targetMax ? ((targetMax - targetMin) / range) * 100 : null;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <h3 className="text-title-2 text-center mb-2">{label}</h3>
      )}

      {/* Main salary display */}
      <div className="text-center mb-4">
        <div className="text-display text-[var(--text-primary)]">
          {formatSalary(targetMin || min)} — {formatSalary(targetMax || max)}
        </div>
        {location && (
          <div className="text-subhead text-[var(--text-secondary)] mt-1">
            {location}
          </div>
        )}
      </div>

      {/* Range visualization */}
      <div className="relative px-4">
        {/* Track */}
        <div className="h-2 bg-[var(--surface)] rounded-full relative">
          {/* Target range highlight */}
          {targetWidthPercent !== null && (
            <div
              className="absolute h-full bg-[var(--accent)] rounded-full"
              style={{
                left: `${targetLeftPercent}%`,
                width: `${targetWidthPercent}%`,
              }}
            />
          )}
        </div>

        {/* Min/Max labels */}
        <div className="flex justify-between mt-2">
          <span className="text-footnote text-[var(--text-tertiary)]">
            {formatSalary(min)}
          </span>
          <span className="text-footnote text-[var(--text-tertiary)]">
            {formatSalary(max)}
          </span>
        </div>
      </div>

      {/* Percentile info */}
      {percentile && (
        <div className="text-center mt-4">
          <span className="text-subhead text-[var(--text-secondary)]">
            Your profile suggests{" "}
            <span className="font-medium text-[var(--text-primary)]">
              {percentile.low}th–{percentile.high}th
            </span>{" "}
            percentile
          </span>
        </div>
      )}
    </div>
  );
}
