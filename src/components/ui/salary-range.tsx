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
  return `$${Math.round(amount).toLocaleString()}`;
}

function formatSalaryRange(minVal: number, maxVal: number): string {
  const formattedMin = formatSalary(minVal);
  const formattedMax = formatSalary(maxVal);

  if (formattedMin === formattedMax || Math.abs(maxVal - minVal) < 1000) {
    return formattedMin;
  }
  return `${formattedMin} — ${formattedMax}`;
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
  const range = max - min;
  const targetLeftPercent = targetMin
    ? ((targetMin - min) / range) * 100
    : null;
  const targetWidthPercent =
    targetMin && targetMax ? ((targetMax - targetMin) / range) * 100 : null;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <h3 className="text-2xl font-semibold text-gray-900 text-center mb-3 tracking-tight">{label}</h3>
      )}

      {/* Main salary display */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-gray-900 tracking-tight">
          {formatSalaryRange(targetMin || min, targetMax || max)}
        </div>
        {location && (
          <div className="text-base text-gray-500 mt-2">
            {location}
          </div>
        )}
      </div>

      {/* Range visualization */}
      <div className="relative px-4">
        {/* Track */}
        <div className="h-3 bg-gray-100 rounded-full relative">
          {/* Target range highlight */}
          {targetWidthPercent !== null && (
            <div
              className="absolute h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{
                left: `${targetLeftPercent}%`,
                width: `${targetWidthPercent}%`,
              }}
            />
          )}
        </div>

        {/* Min/Max labels */}
        <div className="flex justify-between mt-3">
          <span className="text-base text-gray-400">
            {formatSalary(min)}
          </span>
          <span className="text-base text-gray-400">
            {formatSalary(max)}
          </span>
        </div>
      </div>

      {/* Percentile info */}
      {percentile && (
        <div className="text-center mt-5">
          <span className="text-base text-gray-500">
            Your profile suggests{" "}
            <span className="font-semibold text-gray-900">
              {percentile.low}th–{percentile.high}th
            </span>{" "}
            percentile
          </span>
        </div>
      )}
    </div>
  );
}
