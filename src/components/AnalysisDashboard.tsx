"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScoreDisplay } from "./ui/score-display";
import { ProgressBar } from "./ui/progress-bar";
import { MarketValue } from "./MarketValue";
import { ParsePreview } from "./ParsePreview";
import { RedFlags } from "./RedFlags";
import { JobSearch } from "./JobSearch";
import {
  Star,
  TrendingUp,
  Globe,
  Lightbulb,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import type {
  ProfileAnalysis,
  ParsedResume,
  WebPresenceResult,
  SalaryEstimate,
  ParsePreview as ParsePreviewType,
  RedFlag,
} from "@/types";

interface AnalysisDashboardProps {
  analysis: ProfileAnalysis;
  resume: ParsedResume;
  webPresence: WebPresenceResult[];
  salaryEstimate?: SalaryEstimate;
  parsePreview?: ParsePreviewType;
  redFlags?: RedFlag[];
}

export function AnalysisDashboard({
  analysis,
  resume,
  webPresence,
  salaryEstimate,
  parsePreview,
  redFlags,
}: AnalysisDashboardProps) {
  const [showJobSearch, setShowJobSearch] = useState(false);

  // Generate parse preview from resume data if not provided
  const derivedParsePreview: ParsePreviewType = parsePreview || {
    detectedRole: resume.experience?.[0]?.title || "Not detected",
    experienceYears: analysis.career.yearsOfExperience,
    experienceParsedCorrectly: true,
    skillsExtracted: resume.skills?.map((s) => s.name) || [],
    sectionsFound: {
      experience: (resume.experience?.length || 0) > 0,
      education: (resume.education?.length || 0) > 0,
      skills: (resume.skills?.length || 0) > 0,
      summary: !!resume.summary,
      contact: !!(resume.email || resume.phone),
    },
    parseIssues: [],
  };

  // Convert concerns to red flags if not provided
  const derivedRedFlags: RedFlag[] =
    redFlags ||
    analysis.concerns.map((concern) => ({
      title: concern.area,
      priority: concern.severity,
      whatSystemSees: concern.description,
      whyConcerning: `This may be flagged by automated screening systems.`,
      action: concern.mitigation || "Address this concern in your resume or cover letter.",
    }));

  // Generate salary estimate from market position if not provided
  const derivedSalaryEstimate: SalaryEstimate = salaryEstimate || {
    min: analysis.marketPosition.salaryRange.min,
    max: analysis.marketPosition.salaryRange.max,
    median: analysis.marketPosition.salaryRange.median,
    percentile: {
      low: 50,
      high: 70,
      rationale: `Based on ${analysis.career.yearsOfExperience} years of experience.`,
    },
    location: resume.location || "United States",
    sampleSize: 0,
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Market Value - Lead with this */}
      <MarketValue
        salary={derivedSalaryEstimate}
        title={resume.experience?.[0]?.title}
      />

      {/* Profile Scores */}
      <div className="flex justify-center gap-12">
        <ScoreDisplay
          score={analysis.marketPosition.overallScore}
          label="Market Score"
          size="lg"
        />
        <ScoreDisplay
          score={analysis.webPresence.consistency}
          label="Parse Quality"
          size="lg"
        />
      </div>

      {/* What the Machine Sees */}
      <ParsePreview preview={derivedParsePreview} />

      {/* Skills Analysis */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-title-3">
            <Star className="w-5 h-5 text-[var(--accent)]" />
            Skills Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Strengths */}
          <div>
            <h4 className="text-footnote text-[var(--text-secondary)] mb-2">
              Strengths
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {analysis.skills.strengths.map((strength, i) => (
                <Badge key={i} variant="success">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>

          {/* In Demand */}
          <div>
            <h4 className="text-footnote text-[var(--text-secondary)] mb-2">
              In Demand
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {analysis.marketPosition.skillsInDemand.map((skill, i) => (
                <Badge key={i} variant="accent">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Gaps */}
          {analysis.skills.gaps.length > 0 && (
            <div>
              <h4 className="text-footnote text-[var(--text-secondary)] mb-2">
                Gaps
              </h4>
              <div className="space-y-2">
                {analysis.skills.gaps.map((gap, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-[var(--surface)] rounded-[var(--radius-md)]"
                  >
                    <Badge
                      variant={
                        gap.importance === "high"
                          ? "error"
                          : gap.importance === "medium"
                            ? "warning"
                            : "muted"
                      }
                    >
                      {gap.importance}
                    </Badge>
                    <div>
                      <span className="text-subhead font-medium text-[var(--text-primary)]">
                        {gap.skill}
                      </span>
                      <p className="text-footnote text-[var(--text-secondary)] mt-0.5">
                        {gap.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Red Flags */}
      <RedFlags flags={derivedRedFlags} />

      {/* Career Trajectory */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-title-3">
            <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
            Career Trajectory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-body text-[var(--text-secondary)]">
            {analysis.career.trajectory}
          </p>

          {/* Industry Focus */}
          <div>
            <h4 className="text-footnote text-[var(--text-secondary)] mb-2">
              Industry Focus
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {analysis.career.industryFocus.map((industry, i) => (
                <Badge key={i} variant="default">
                  {industry}
                </Badge>
              ))}
            </div>
          </div>

          {/* Potential Next Roles */}
          {analysis.career.potentialPaths.length > 0 &&
            analysis.career.potentialPaths[0]?.nextRoles.length > 0 && (
              <div>
                <h4 className="text-footnote text-[var(--text-secondary)] mb-3">
                  Potential Next Roles
                </h4>
                <div className="space-y-2">
                  {analysis.career.potentialPaths[0].nextRoles.map(
                    (role, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-[var(--radius-md)]"
                      >
                        <span className="text-subhead text-[var(--text-primary)]">
                          {role.title}
                        </span>
                        <ProgressBar
                          value={role.probability * 100}
                          showValue
                          size="sm"
                          className="w-24"
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Web Presence */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-title-3">
            <Globe className="w-5 h-5 text-[var(--accent)]" />
            Web Presence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {webPresence.map((presence, i) => (
              <a
                key={i}
                href={presence.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 border border-[var(--border-light)] rounded-[var(--radius-md)] hover:border-[var(--border)] transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="muted">{presence.platform}</Badge>
                  </div>
                  <p className="text-subhead font-medium text-[var(--text-primary)] truncate">
                    {presence.title || presence.url}
                  </p>
                  {presence.description && (
                    <p className="text-footnote text-[var(--text-secondary)] truncate">
                      {presence.description}
                    </p>
                  )}
                </div>
                <ExternalLink className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0" />
              </a>
            ))}
          </div>

          {analysis.webPresence.issues.length > 0 && (
            <div className="p-3 bg-[var(--warning-light)] rounded-[var(--radius-md)]">
              <h4 className="text-footnote font-medium text-[#996300] mb-2">
                Issues Found
              </h4>
              <ul className="space-y-1">
                {analysis.webPresence.issues.map((issue, i) => (
                  <li
                    key={i}
                    className="text-footnote text-[var(--text-secondary)]"
                  >
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-title-3">
            <Lightbulb className="w-5 h-5 text-[var(--accent)]" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.recommendations.map((rec, i) => (
              <div
                key={i}
                className="pl-4 border-l-2 border-[var(--accent)] py-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={
                      rec.priority === "high"
                        ? "error"
                        : rec.priority === "medium"
                          ? "warning"
                          : "muted"
                    }
                  >
                    {rec.priority}
                  </Badge>
                  <span className="text-caption text-[var(--text-tertiary)]">
                    {rec.category}
                  </span>
                </div>
                <h4 className="text-headline text-[var(--text-primary)]">
                  {rec.title}
                </h4>
                <p className="text-footnote text-[var(--text-secondary)] mt-1 mb-2">
                  {rec.description}
                </p>
                <ul className="space-y-1">
                  {rec.actionItems.map((item, j) => (
                    <li
                      key={j}
                      className="text-footnote flex items-start gap-2 text-[var(--text-primary)]"
                    >
                      <CheckCircle className="w-4 h-4 text-[var(--success)] mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Job Compatibility Search */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-title-3 text-center">
            Check Job Compatibility
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showJobSearch ? (
            <JobSearch
              profileAnalysis={analysis}
              resume={resume}
              marketValue={derivedSalaryEstimate}
            />
          ) : (
            <div className="text-center">
              <p className="text-subhead text-[var(--text-secondary)] mb-4">
                Search for specific roles to see how well you match and what
                salary you can target.
              </p>
              <button
                onClick={() => setShowJobSearch(true)}
                className="px-6 py-2.5 bg-[var(--accent)] text-white rounded-[var(--radius-md)] text-subhead font-medium hover:bg-[var(--accent-hover)] transition-colors"
              >
                Search Jobs
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
