"use client";

import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Building2, MapPin, DollarSign } from "lucide-react";

interface JobCardProps {
  title: string;
  company: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  matchScore?: number;
  url?: string;
  onClick?: () => void;
  className?: string;
}

function formatSalary(amount: number): string {
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export function JobCard({
  title,
  company,
  location,
  salaryMin,
  salaryMax,
  matchScore,
  onClick,
  className,
}: JobCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 border border-[var(--border-light)] rounded-[var(--radius-lg)] bg-white",
        "hover:border-[var(--border)] hover:shadow-sm transition-all duration-200",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-headline text-[var(--text-primary)] truncate">
            {title}
          </h4>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-footnote text-[var(--text-secondary)]">
              <Building2 className="w-3.5 h-3.5" />
              {company}
            </span>
            {location && (
              <span className="flex items-center gap-1 text-footnote text-[var(--text-secondary)]">
                <MapPin className="w-3.5 h-3.5" />
                {location}
              </span>
            )}
          </div>
          {(salaryMin || salaryMax) && (
            <div className="flex items-center gap-1 mt-2 text-footnote text-[var(--text-primary)]">
              <DollarSign className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              {salaryMin && salaryMax
                ? `${formatSalary(salaryMin)} – ${formatSalary(salaryMax)}`
                : salaryMin
                  ? `From ${formatSalary(salaryMin)}`
                  : `Up to ${formatSalary(salaryMax!)}`}
            </div>
          )}
        </div>

        {matchScore !== undefined && (
          <Badge
            variant={
              matchScore >= 70
                ? "success"
                : matchScore >= 40
                  ? "warning"
                  : "muted"
            }
          >
            {matchScore}% match
          </Badge>
        )}
      </div>
    </div>
  );
}
