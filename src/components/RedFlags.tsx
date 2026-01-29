"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
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
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-title-3">
          <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
          Red Flags the Algorithm Sees
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedFlags.map((flag, i) => (
          <div
            key={i}
            className="p-4 border border-[var(--border-light)] rounded-[var(--radius-md)]"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <h4 className="text-headline text-[var(--text-primary)]">
                {flag.title}
              </h4>
              <Badge
                variant={
                  flag.priority === "high"
                    ? "error"
                    : flag.priority === "medium"
                      ? "warning"
                      : "muted"
                }
              >
                {flag.priority}
              </Badge>
            </div>

            {/* What system sees */}
            <p className="text-subhead text-[var(--text-secondary)] mb-3">
              {flag.whatSystemSees}
            </p>

            {/* Why concerning */}
            <p className="text-footnote text-[var(--text-tertiary)] mb-3">
              {flag.whyConcerning}
            </p>

            {/* Action */}
            <div className="flex items-start gap-2 pt-3 border-t border-[var(--border-light)]">
              <ArrowRight className="w-4 h-4 text-[var(--accent)] mt-0.5 flex-shrink-0" />
              <p className="text-footnote text-[var(--accent)]">{flag.action}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
