"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
      <CardHeader className="pb-4 border-b">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
          <Eye className="w-5 h-5 text-blue-600" />
          What the Machine Sees
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Detected Info */}
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500">
              Detected Role
            </span>
            <span className="text-sm font-semibold text-gray-900 text-right">
              {preview.detectedRole || "Not detected"}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500">
              Experience
            </span>
            <span className="text-sm text-gray-900">
              {preview.experienceYears} years
              {preview.experienceParsedCorrectly && (
                <span className="text-green-600 ml-1">(parsed correctly)</span>
              )}
            </span>
          </div>
        </div>

        {/* Skills Extracted */}
        {preview.skillsExtracted.length > 0 && (
          <div>
            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide block mb-3">
              Skills Extracted
            </span>
            <div className="flex flex-wrap gap-2">
              {preview.skillsExtracted.slice(0, 12).map((skill, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-md text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
              {preview.skillsExtracted.length > 12 && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-md text-xs font-medium">
                  +{preview.skillsExtracted.length - 12} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Sections Found */}
        <div>
          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide block mb-3">
            Sections Found
          </span>
          <div className="flex flex-wrap gap-4">
            {Object.entries(preview.sectionsFound).map(([key, found]) => (
              <span
                key={key}
                className={`inline-flex items-center gap-1 text-sm font-medium ${
                  found ? "text-green-600" : "text-gray-400"
                }`}
              >
                {found ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="w-4 h-4 text-center">—</span>
                )}
                {sectionLabels[key as keyof typeof sectionLabels]}
              </span>
            ))}
          </div>
        </div>

        {/* Parse Issues */}
        {preview.parseIssues.length > 0 && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-semibold text-yellow-800">
                  Potential Parse Issues
                </span>
                <ul className="mt-2 space-y-1">
                  {preview.parseIssues.map((issue, i) => (
                    <li key={i} className="text-sm text-yellow-700">
                      • {issue}
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
