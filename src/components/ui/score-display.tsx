"use client";

import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  score: number;
  label: string;
  maxScore?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreDisplay({
  score,
  label,
  maxScore = 100,
  size = "md",
  className,
}: ScoreDisplayProps) {
  const percentage = (score / maxScore) * 100;

  const sizeStyles = {
    sm: {
      number: "text-[24px] font-semibold",
      label: "text-[12px]",
      container: "gap-0.5",
    },
    md: {
      number: "text-[32px] font-semibold",
      label: "text-[13px]",
      container: "gap-1",
    },
    lg: {
      number: "text-[48px] font-semibold tracking-tight",
      label: "text-[15px]",
      container: "gap-1.5",
    },
  };

  const getScoreColor = () => {
    if (percentage >= 70) return "text-[var(--success)]";
    if (percentage >= 40) return "text-[var(--warning)]";
    return "text-[var(--error)]";
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center",
        sizeStyles[size].container,
        className
      )}
    >
      <span className={cn(sizeStyles[size].number, getScoreColor())}>
        {score}
      </span>
      <span className={cn(sizeStyles[size].label, "text-[var(--text-secondary)]")}>
        {label}
      </span>
    </div>
  );
}
