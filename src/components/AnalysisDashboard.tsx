"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { MarketValue } from "./MarketValue";
import { ParsePreview } from "./ParsePreview";
import { RedFlags } from "./RedFlags";
import { JobSearch } from "./JobSearch";
import { WebSearchResults } from "./WebSearchResults";
import {
  Star,
  TrendingUp,
  Globe,
  Lightbulb,
  CheckCircle,
  ExternalLink,
  Search,
} from "lucide-react";
import type {
  ProfileAnalysis,
  ParsedResume,
  WebPresenceResult,
  SalaryEstimate,
  ParsePreview as ParsePreviewType,
  RedFlag,
  DeepSearchResults,
} from "@/types";

interface AnalysisDashboardProps {
  analysis: ProfileAnalysis;
  resume: ParsedResume;
  webPresence: WebPresenceResult[];
  salaryEstimate?: SalaryEstimate;
  parsePreview?: ParsePreviewType;
  redFlags?: RedFlag[];
  deepSearchResults?: DeepSearchResults;
}

export function AnalysisDashboard({
  analysis,
  resume,
  webPresence,
  salaryEstimate,
  parsePreview,
  redFlags,
  deepSearchResults,
}: AnalysisDashboardProps) {
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
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* Job Compatibility Search - FIRST AND PROMINENT */}
      <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-100/50 rounded-2xl overflow-hidden">
        <CardHeader className="pb-5 pt-7 px-7">
          <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-gray-900 tracking-tight">
            <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Search className="w-6 h-6 text-white" />
            </div>
            Check Job Compatibility
          </CardTitle>
          <p className="text-base text-gray-600 mt-2 ml-14">
            Search for specific roles to see your fit score and salary leverage
          </p>
        </CardHeader>
        <CardContent className="px-7 pb-7">
          <JobSearch
            profileAnalysis={analysis}
            resume={resume}
            marketValue={derivedSalaryEstimate}
          />
        </CardContent>
      </Card>

      {/* Market Value */}
      <MarketValue
        salary={derivedSalaryEstimate}
        title={resume.experience?.[0]?.title}
      />

      {/* Profile Scores */}
      <div className="grid grid-cols-2 gap-5">
        <Card className="bg-white border-0 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
          <CardContent className="pt-8 pb-7 text-center">
            <div className="text-5xl font-bold text-blue-500 mb-2 tracking-tight">
              {analysis.marketPosition.overallScore}
            </div>
            <div className="text-base font-medium text-gray-500">Market Score</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
          <CardContent className="pt-8 pb-7 text-center">
            <div className={`text-5xl font-bold mb-2 tracking-tight ${
              deepSearchResults?.summary.overallVisibility === "high" ? "text-green-500" :
              deepSearchResults?.summary.overallVisibility === "medium" ? "text-yellow-500" :
              deepSearchResults?.summary.overallVisibility === "low" ? "text-orange-500" :
              "text-red-500"
            }`}>
              {deepSearchResults?.totalResults || 0}
            </div>
            <div className="text-base font-medium text-gray-500">
              Web Mentions
              {deepSearchResults && (
                <span className={`ml-2 px-2.5 py-1 text-sm rounded-full font-medium ${
                  deepSearchResults.summary.overallVisibility === "high" ? "bg-green-100 text-green-700" :
                  deepSearchResults.summary.overallVisibility === "medium" ? "bg-yellow-100 text-yellow-700" :
                  deepSearchResults.summary.overallVisibility === "low" ? "bg-orange-100 text-orange-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {deepSearchResults.summary.overallVisibility}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What the Machine Sees */}
      <ParsePreview preview={derivedParsePreview} />

      {/* Skills Analysis */}
      <Card className="bg-white border-0 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
        <CardHeader className="pb-5 pt-7 px-7 border-b border-gray-100">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900 tracking-tight">
            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-amber-400/30">
              <Star className="w-5 h-5 text-white" />
            </div>
            Skills Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-7 pb-7 px-7 space-y-7">
          {/* Strengths */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
              Strengths
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {analysis.skills.strengths.map((strength, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-base font-medium"
                >
                  {strength}
                </span>
              ))}
            </div>
          </div>

          {/* In Demand */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
              In Demand
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {analysis.marketPosition.skillsInDemand.map((skill, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-base font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Gaps */}
          {analysis.skills.gaps.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                Gaps to Address
              </h4>
              <div className="space-y-3">
                {analysis.skills.gaps.map((gap, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl"
                  >
                    <span
                      className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                        gap.importance === "high"
                          ? "bg-red-100 text-red-700"
                          : gap.importance === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {gap.importance}
                    </span>
                    <div>
                      <span className="font-semibold text-gray-900 text-lg">
                        {gap.skill}
                      </span>
                      <p className="text-base text-gray-600 mt-1">
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

      {/* Deep Web Search Results */}
      {deepSearchResults && (
        <WebSearchResults results={deepSearchResults} />
      )}

      {/* Career Trajectory */}
      <Card className="bg-white border-0 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
        <CardHeader className="pb-5 pt-7 px-7 border-b border-gray-100">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900 tracking-tight">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Career Trajectory
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-7 pb-7 px-7 space-y-7">
          <p className="text-lg text-gray-700 leading-relaxed">
            {analysis.career.trajectory}
          </p>

          {/* Industry Focus */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
              Industry Focus
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {analysis.career.industryFocus.map((industry, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-base font-medium"
                >
                  {industry}
                </span>
              ))}
            </div>
          </div>

          {/* Potential Next Roles */}
          {analysis.career.potentialPaths.length > 0 &&
            analysis.career.potentialPaths[0]?.nextRoles.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                  Potential Next Roles
                </h4>
                <div className="space-y-3">
                  {analysis.career.potentialPaths[0].nextRoles.map(
                    (role, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-5 bg-gray-50 rounded-xl"
                      >
                        <span className="font-semibold text-gray-900 text-lg">
                          {role.title}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="w-28 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-700"
                              style={{ width: `${role.probability * 100}%` }}
                            />
                          </div>
                          <span className="text-base font-semibold text-gray-600 w-14">
                            {Math.round(role.probability * 100)}%
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Web Presence */}
      <Card className="bg-white border-0 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
        <CardHeader className="pb-5 pt-7 px-7 border-b border-gray-100">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900 tracking-tight">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Globe className="w-5 h-5 text-white" />
            </div>
            Web Presence
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-7 pb-7 px-7 space-y-5">
          <div className="space-y-3">
            {webPresence.map((presence, i) => (
              <a
                key={i}
                href={presence.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl hover:bg-blue-50 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium">
                      {presence.platform}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 text-lg truncate group-hover:text-blue-600 transition-colors">
                    {presence.title || presence.url}
                  </p>
                  {presence.description && (
                    <p className="text-base text-gray-600 truncate mt-1">
                      {presence.description}
                    </p>
                  )}
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
              </a>
            ))}
          </div>

          {analysis.webPresence.issues.length > 0 && (
            <div className="p-5 bg-amber-50 rounded-xl">
              <h4 className="font-semibold text-amber-800 mb-3 text-lg">
                Issues Found
              </h4>
              <ul className="space-y-2">
                {analysis.webPresence.issues.map((issue, i) => (
                  <li key={i} className="text-base text-amber-700">
                    • {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-white border-0 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
        <CardHeader className="pb-5 pt-7 px-7 border-b border-gray-100">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900 tracking-tight">
            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-amber-400/30">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-7 pb-7 px-7">
          <div className="space-y-7">
            {analysis.recommendations.map((rec, i) => (
              <div
                key={i}
                className="pl-5 border-l-4 border-blue-500 py-2"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                      rec.priority === "high"
                        ? "bg-red-100 text-red-700"
                        : rec.priority === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {rec.priority}
                  </span>
                  <span className="text-sm text-gray-500 uppercase tracking-wide">
                    {rec.category}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                  {rec.title}
                </h4>
                <p className="text-base text-gray-600 mb-4">
                  {rec.description}
                </p>
                <ul className="space-y-3">
                  {rec.actionItems.map((item, j) => (
                    <li
                      key={j}
                      className="text-base flex items-start gap-3 text-gray-700"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
