"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Check, AlertTriangle, Eye } from "lucide-react";
import type { ParsePreview as ParsePreviewType } from "@/types";

interface ParsePreviewProps {
  preview: ParsePreviewType;
  className?: string;
}

export function ParsePreview({ preview, className }: ParsePreviewProps) {
  const sectionLabels = {
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    summary: "Summary",
    contact: "Contact",
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-title-3">
          <Eye className="w-5 h-5 text-[var(--accent)]" />
          What the Machine Sees
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Detected Info */}
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-footnote text-[var(--text-secondary)]">
              Detected Role
            </span>
            <span className="text-subhead text-[var(--text-primary)] font-medium text-right">
              {preview.detectedRole || "Not detected"}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-footnote text-[var(--text-secondary)]">
              Experience
            </span>
            <span className="text-subhead text-[var(--text-primary)]">
              {preview.experienceYears} years
              {preview.experienceParsedCorrectly && (
                <span className="text-[var(--success)] ml-1">(parsed correctly)</span>
              )}
            </span>
          </div>
        </div>

        {/* Skills Extracted */}
        {preview.skillsExtracted.length > 0 && (
          <div>
            <span className="text-footnote text-[var(--text-secondary)] block mb-2">
              Skills Extracted
            </span>
            <div className="flex flex-wrap gap-1.5">
              {preview.skillsExtracted.slice(0, 12).map((skill, i) => (
                <Badge key={i} variant="default">
                  {skill}
                </Badge>
              ))}
              {preview.skillsExtracted.length > 12 && (
                <Badge variant="muted">
                  +{preview.skillsExtracted.length - 12} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Sections Found */}
        <div>
          <span className="text-footnote text-[var(--text-secondary)] block mb-2">
            Sections Found
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(preview.sectionsFound).map(([key, found]) => (
              <span
                key={key}
                className={`inline-flex items-center gap-1 text-footnote ${
                  found
                    ? "text-[var(--success)]"
                    : "text-[var(--text-tertiary)]"
                }`}
              >
                {found ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-3.5 h-3.5 text-center">-</span>
                )}
                {sectionLabels[key as keyof typeof sectionLabels]}
              </span>
            ))}
          </div>
        </div>

        {/* Parse Issues */}
        {preview.parseIssues.length > 0 && (
          <div className="p-3 bg-[var(--warning-light)] rounded-[var(--radius-md)]">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[var(--warning)] mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-footnote font-medium text-[#996300]">
                  Potential Parse Issues
                </span>
                <ul className="mt-1 space-y-1">
                  {preview.parseIssues.map((issue, i) => (
                    <li
                      key={i}
                      className="text-footnote text-[var(--text-secondary)]"
                    >
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
