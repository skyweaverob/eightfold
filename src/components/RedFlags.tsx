"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { RedFlag } from "@/types";

interface RedFlagsProps {
  flags: RedFlag[];
  className?: string;
}

export function RedFlags({ flags, className }: RedFlagsProps) {
  if (flags.length === 0) return null;

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedFlags = [...flags].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-4 border-b">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Red Flags the Algorithm Sees
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {sortedFlags.map((flag, i) => (
          <div
            key={i}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <h4 className="font-semibold text-gray-900">
                {flag.title}
              </h4>
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                  flag.priority === "high"
                    ? "bg-red-100 text-red-700"
                    : flag.priority === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {flag.priority}
              </span>
            </div>

            {/* What system sees */}
            <p className="text-sm text-gray-700 mb-2">
              {flag.whatSystemSees}
            </p>

            {/* Why concerning */}
            <p className="text-xs text-gray-500 mb-3">
              {flag.whyConcerning}
            </p>

            {/* Action */}
            <div className="flex items-start gap-2 pt-3 border-t border-gray-200">
              <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-blue-600">{flag.action}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
