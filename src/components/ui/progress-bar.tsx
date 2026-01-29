"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  maxValue?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgressBar({
  value,
  maxValue = 100,
  label,
  showValue = true,
  size = "md",
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);

  const sizeStyles = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const getBarColor = () => {
    if (percentage >= 70) return "bg-[var(--success)]";
    if (percentage >= 40) return "bg-[var(--accent)]";
    return "bg-[var(--warning)]";
  };

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-[13px] text-[var(--text-secondary)]">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-[13px] font-medium text-[var(--text-primary)]">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-[var(--surface)]",
          sizeStyles[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            getBarColor()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
