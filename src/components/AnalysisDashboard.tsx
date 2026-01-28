"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  Briefcase,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Globe,
  Lightbulb,
} from "lucide-react";
import type { ProfileAnalysis, ParsedResume, WebPresenceResult } from "@/types";
import { cn } from "@/lib/utils";

interface AnalysisDashboardProps {
  analysis: ProfileAnalysis;
  resume: ParsedResume;
  webPresence: WebPresenceResult[];
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color =
    score >= 70
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : score >= 40
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";

  return (
    <div className={cn("px-3 py-1 rounded-full text-sm font-medium", color)}>
      {label}: {score}/100
    </div>
  );
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const styles = {
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };

  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", styles[priority])}>
      {priority}
    </span>
  );
}

export function AnalysisDashboard({
  analysis,
  resume,
  webPresence,
}: AnalysisDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header with scores */}
      <div className="flex flex-wrap gap-3 justify-center">
        <ScoreBadge score={analysis.marketPosition.overallScore} label="Market Score" />
        <ScoreBadge score={analysis.webPresence.consistency} label="Profile Consistency" />
      </div>

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Profile Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {resume.fullName || "Name not found"}
              </h4>
              <p className="text-sm text-gray-500">{resume.email}</p>
              <p className="text-sm text-gray-500">{resume.location}</p>
            </div>
            <div>
              <p className="text-sm">
                <span className="font-medium">Experience:</span>{" "}
                {analysis.career.yearsOfExperience} years
              </p>
              <p className="text-sm">
                <span className="font-medium">Trajectory:</span>{" "}
                <span className="capitalize">{analysis.career.progression}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium">Competitiveness:</span>{" "}
                <span className="capitalize">{analysis.marketPosition.competitiveness}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Skills Analysis
          </CardTitle>
          <CardDescription>
            Your stated skills and AI-inferred capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2 text-green-700 dark:text-green-400">
              Strengths
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.skills.strengths.map((strength, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm"
                >
                  {strength}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Skills in High Demand</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.marketPosition.skillsInDemand.map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {analysis.skills.inferred.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-purple-700 dark:text-purple-400">
                AI-Inferred Skills
              </h4>
              <p className="text-xs text-gray-500 mb-2">
                Skills we detected from your experience that you may not have listed
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.skills.inferred.slice(0, 10).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-sm"
                    title={skill.inferenceReason}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.skills.gaps.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-amber-700 dark:text-amber-400">
                Skill Gaps
              </h4>
              <div className="space-y-2">
                {analysis.skills.gaps.map((gap, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm p-2 bg-amber-50 dark:bg-amber-950 rounded"
                  >
                    <PriorityBadge priority={gap.importance} />
                    <div>
                      <span className="font-medium">{gap.skill}</span>
                      <p className="text-gray-600 dark:text-gray-400">{gap.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Career Trajectory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Career Trajectory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            {analysis.career.trajectory}
          </p>

          <div>
            <h4 className="font-medium mb-2">Industry Focus</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.career.industryFocus.map((industry, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm"
                >
                  {industry}
                </span>
              ))}
            </div>
          </div>

          {analysis.career.potentialPaths.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Potential Next Roles</h4>
              <div className="space-y-2">
                {analysis.career.potentialPaths[0]?.nextRoles.map((role, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <span>{role.title}</span>
                    <span className="text-sm text-gray-500">
                      {Math.round(role.probability * 100)}% match
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Web Presence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Web Presence
          </CardTitle>
          <CardDescription>
            What employers can find about you online
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            {webPresence.map((presence, i) => (
              <a
                key={i}
                href={presence.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs capitalize">
                      {presence.platform}
                    </span>
                  </div>
                  <p className="font-medium truncate">{presence.title}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {presence.description}
                  </p>
                </div>
              </a>
            ))}
          </div>

          {analysis.webPresence.issues.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                Issues Found
              </h4>
              <ul className="space-y-1">
                {analysis.webPresence.issues.map((issue, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Recommendations
          </CardTitle>
          <CardDescription>
            Actionable steps to improve your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.recommendations.map((rec, i) => (
              <div key={i} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <PriorityBadge priority={rec.priority} />
                  <span className="text-xs text-gray-500 capitalize">
                    {rec.category}
                  </span>
                </div>
                <h4 className="font-medium">{rec.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {rec.description}
                </p>
                <ul className="space-y-1">
                  {rec.actionItems.map((item, j) => (
                    <li
                      key={j}
                      className="text-sm flex items-start gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Concerns */}
      {analysis.concerns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              Potential Employer Concerns
            </CardTitle>
            <CardDescription>
              Issues that employers might flag during review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.concerns.map((concern, i) => (
                <div
                  key={i}
                  className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <PriorityBadge priority={concern.severity} />
                    <span className="font-medium">{concern.area}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {concern.description}
                  </p>
                  {concern.mitigation && (
                    <div className="text-sm">
                      <span className="font-medium text-green-700 dark:text-green-400">
                        Mitigation:{" "}
                      </span>
                      {concern.mitigation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
