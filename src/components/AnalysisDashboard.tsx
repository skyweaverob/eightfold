"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Collapsible } from "./ui/collapsible";
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
  AlertTriangle,
  Eye,
  DollarSign,
  FileText,
  Briefcase,
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

function formatSalary(amount: number): string {
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}K`;
  }
  return `$${Math.round(amount).toLocaleString()}`;
}

function formatSalaryRange(min: number, max: number): string {
  const formattedMin = formatSalary(min);
  const formattedMax = formatSalary(max);

  // If min and max are the same (or very close), show single value
  if (formattedMin === formattedMax || Math.abs(max - min) < 1000) {
    return formattedMin;
  }
  return `${formattedMin} – ${formattedMax}`;
}

export function AnalysisDashboard({
  analysis,
  resume,
  webPresence,
  salaryEstimate,
  redFlags,
  deepSearchResults,
}: AnalysisDashboardProps) {
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Job Compatibility Search - FIRST AND PROMINENT */}
      <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-100/50 rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 md:pb-5 pt-5 md:pt-7 px-4 md:px-7">
          <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-2xl font-semibold text-gray-900 tracking-tight">
            <div className="w-9 h-9 md:w-11 md:h-11 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <Search className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            Check Job Compatibility
          </CardTitle>
          <p className="text-sm md:text-base text-gray-600 mt-1.5 md:mt-2 ml-11 md:ml-14">
            Search for roles to see your fit score and <span className="font-semibold text-blue-600">how HR sees you</span>
          </p>
        </CardHeader>
        <CardContent className="px-4 md:px-7 pb-5 md:pb-7">
          <JobSearch
            profileAnalysis={analysis}
            resume={resume}
            marketValue={derivedSalaryEstimate}
          />
          {/* HR View Callout */}
          <div className="mt-4 md:mt-5 p-3 md:p-4 bg-white/70 rounded-xl border border-blue-200 flex items-start md:items-center gap-2 md:gap-3">
            <Eye className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0 mt-0.5 md:mt-0" />
            <p className="text-xs md:text-sm text-gray-600">
              <span className="font-semibold text-gray-900">Pro tip:</span> Toggle <span className="font-semibold text-blue-600">HR View</span> to see how recruiters evaluate you
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card className="bg-white border-0 shadow-md shadow-gray-200/50 rounded-xl overflow-hidden">
          <CardContent className="py-3 md:py-5 px-2 md:px-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-500 mb-0.5 md:mb-1 tracking-tight">
              {analysis.marketPosition.overallScore}
            </div>
            <div className="text-xs md:text-sm font-medium text-gray-500">
              <span className="md:hidden">Score</span>
              <span className="hidden md:inline">Market Score</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-md shadow-gray-200/50 rounded-xl overflow-hidden">
          <CardContent className="py-3 md:py-5 px-2 md:px-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-0.5 md:mb-1 tracking-tight">
              {analysis.career.yearsOfExperience}<span className="text-lg md:text-xl font-medium text-gray-400">yr</span>
            </div>
            <div className="text-xs md:text-sm font-medium text-gray-500">
              <span className="md:hidden">Exp</span>
              <span className="hidden md:inline">Experience</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-md shadow-gray-200/50 rounded-xl overflow-hidden">
          <CardContent className="py-3 md:py-5 px-2 md:px-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-500 mb-0.5 md:mb-1 tracking-tight">
              {formatSalary(derivedSalaryEstimate.median)}
            </div>
            <div className="text-xs md:text-sm font-medium text-gray-500">
              <span className="md:hidden">Salary</span>
              <span className="hidden md:inline">Est. Salary</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Explanation */}
      <p className="text-xs text-gray-400 text-center -mt-3 md:-mt-2">
        <span className="md:hidden">AI estimates from your resume</span>
        <span className="hidden md:inline">AI-generated estimates based on your resume and web presence</span>
      </p>

      {/* Skills Analysis - Collapsible */}
      <Collapsible
        title="Skills Analysis"
        icon={<div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-amber-400/30"><Star className="w-5 h-5 text-white" /></div>}
        badge={
          <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            {analysis.skills.strengths.length} strengths
          </span>
        }
        defaultOpen={false}
      >
        <div className="space-y-6">
          {/* Strengths */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
              Strengths
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.skills.strengths.map((strength, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium"
                >
                  {strength}
                </span>
              ))}
            </div>
          </div>

          {/* In Demand */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
              In Demand
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.marketPosition.skillsInDemand.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Gaps */}
          {analysis.skills.gaps.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                Gaps to Address
              </h4>
              <div className="space-y-2">
                {analysis.skills.gaps.map((gap, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl"
                  >
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
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
                      <span className="font-semibold text-gray-900">
                        {gap.skill}
                      </span>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {gap.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Collapsible>

      {/* Career Trajectory - Collapsible */}
      <Collapsible
        title="Career Trajectory"
        icon={<div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30"><TrendingUp className="w-5 h-5 text-white" /></div>}
        badge={
          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {analysis.career.potentialPaths[0]?.nextRoles?.length || 0} next roles
          </span>
        }
        defaultOpen={false}
      >
        <div className="space-y-6">
          <p className="text-base text-gray-700 leading-relaxed">
            {analysis.career.trajectory}
          </p>

          {/* Industry Focus */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
              Industry Focus
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.career.industryFocus.map((industry, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
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
                <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                  Potential Next Roles
                </h4>
                <div className="space-y-2">
                  {analysis.career.potentialPaths[0].nextRoles.map((role, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <span className="font-medium text-gray-900">
                        {role.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-700"
                            style={{ width: `${role.probability * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-600 w-10">
                          {Math.round(role.probability * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </Collapsible>

      {/* Red Flags - Collapsible */}
      {derivedRedFlags.length > 0 && (
        <Collapsible
          title="Potential Concerns"
          icon={<div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30"><AlertTriangle className="w-5 h-5 text-white" /></div>}
          badge={
            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
              {derivedRedFlags.length} flags
            </span>
          }
          defaultOpen={false}
        >
          <div className="space-y-3">
            {derivedRedFlags.map((flag, i) => (
              <div key={i} className="p-4 bg-red-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    flag.priority === "high" ? "bg-red-200 text-red-800" :
                    flag.priority === "medium" ? "bg-yellow-200 text-yellow-800" :
                    "bg-gray-200 text-gray-600"
                  }`}>
                    {flag.priority}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{flag.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{flag.whatSystemSees}</p>
                    <p className="text-sm text-green-700 mt-2 font-medium">{flag.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {/* Recommendations - Collapsible */}
      <Collapsible
        title="Recommendations"
        icon={<div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-amber-400/30"><Lightbulb className="w-5 h-5 text-white" /></div>}
        badge={
          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
            {analysis.recommendations.length} tips
          </span>
        }
        defaultOpen={false}
      >
        <div className="space-y-5">
          {analysis.recommendations.map((rec, i) => (
            <div
              key={i}
              className="pl-4 border-l-4 border-blue-500 py-1"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    rec.priority === "high"
                      ? "bg-red-100 text-red-700"
                      : rec.priority === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {rec.priority}
                </span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  {rec.category}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">
                {rec.title}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {rec.description}
              </p>
              <ul className="space-y-2">
                {rec.actionItems.map((item, j) => (
                  <li
                    key={j}
                    className="text-sm flex items-start gap-2 text-gray-700"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Collapsible>

      {/* Market Value - Collapsible, less prominent */}
      <Collapsible
        title="Salary Estimate"
        icon={<div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30"><DollarSign className="w-5 h-5 text-white" /></div>}
        badge={
          <span className="text-lg font-bold text-green-600">
            {formatSalaryRange(derivedSalaryEstimate.min, derivedSalaryEstimate.max)}
          </span>
        }
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-gray-900 tracking-tight">
              {formatSalaryRange(derivedSalaryEstimate.min, derivedSalaryEstimate.max)}
            </div>
            <p className="text-base text-gray-500 mt-2">
              {resume.experience?.[0]?.title || "Professional"} · {derivedSalaryEstimate.location}
            </p>
          </div>
          <div className="relative px-4">
            <div className="h-3 bg-gray-100 rounded-full">
              <div
                className="absolute h-full bg-green-500 rounded-full transition-all duration-700"
                style={{
                  left: `${derivedSalaryEstimate.percentile.low}%`,
                  width: `${derivedSalaryEstimate.percentile.high - derivedSalaryEstimate.percentile.low}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-400">
              <span>{formatSalary(derivedSalaryEstimate.min)}</span>
              <span>{formatSalary(derivedSalaryEstimate.max)}</span>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500">
            Your profile suggests <span className="font-semibold text-gray-900">{derivedSalaryEstimate.percentile.low}th–{derivedSalaryEstimate.percentile.high}th</span> percentile
          </p>
        </div>
      </Collapsible>

      {/* Web Presence - Collapsible */}
      <Collapsible
        title="Web Presence"
        icon={<div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30"><Globe className="w-5 h-5 text-white" /></div>}
        badge={
          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            {webPresence.length} profiles
          </span>
        }
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            {webPresence.map((presence, i) => (
              <a
                key={i}
                href={presence.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                      {presence.platform}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {presence.title || presence.url}
                  </p>
                  {presence.description && (
                    <p className="text-sm text-gray-600 truncate mt-0.5">
                      {presence.description}
                    </p>
                  )}
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
              </a>
            ))}
          </div>

          {analysis.webPresence.issues.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-xl">
              <h4 className="font-semibold text-amber-800 mb-2">
                Issues Found
              </h4>
              <ul className="space-y-1">
                {analysis.webPresence.issues.map((issue, i) => (
                  <li key={i} className="text-sm text-amber-700">
                    • {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Collapsible>

      {/* Deep Web Search Results - Collapsible, at bottom */}
      {deepSearchResults && (
        <Collapsible
          title="Deep Web Search"
          icon={<div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30"><FileText className="w-5 h-5 text-white" /></div>}
          badge={
            <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${
              deepSearchResults.summary.overallVisibility === "high" ? "bg-green-100 text-green-700" :
              deepSearchResults.summary.overallVisibility === "medium" ? "bg-yellow-100 text-yellow-700" :
              deepSearchResults.summary.overallVisibility === "low" ? "bg-orange-100 text-orange-700" :
              "bg-red-100 text-red-700"
            }`}>
              {deepSearchResults.totalResults} results · {deepSearchResults.summary.overallVisibility} visibility
            </span>
          }
          defaultOpen={false}
        >
          <WebSearchResults results={deepSearchResults} embedded={true} />
        </Collapsible>
      )}
    </div>
  );
}
