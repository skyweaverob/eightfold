"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Building2,
  GraduationCap,
  Briefcase,
  Target,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  User,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type {
  JobListing,
  JobCompatibility,
  ProfileAnalysis,
  ParsedResume,
  SalaryEstimate,
} from "@/types";

interface HRViewProps {
  job: JobListing;
  compatibility: JobCompatibility;
  profileAnalysis: ProfileAnalysis;
  resume: ParsedResume;
  marketValue: SalaryEstimate;
  onBack: () => void;
}

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return "#22c55e"; // green-500
    if (s >= 60) return "#eab308"; // yellow-500
    if (s >= 40) return "#f97316"; // orange-500
    return "#ef4444"; // red-500
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="12"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gray-900 tracking-tight">{score}</span>
        <span className="text-sm text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

function MetricBar({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  const getColor = (v: number) => {
    if (v >= 80) return "bg-green-500";
    if (v >= 60) return "bg-yellow-500";
    if (v >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-base">
        <span className="flex items-center gap-2 text-gray-600">
          <Icon className="w-5 h-5" />
          {label}
        </span>
        <span className="font-semibold text-gray-900">{value}%</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${getColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function HRView({
  job,
  compatibility,
  profileAnalysis,
  resume,
  marketValue,
  onBack,
}: HRViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "concerns">("overview");

  // Calculate years of experience
  const yearsExp = profileAnalysis.career.yearsOfExperience;

  // Determine hiring recommendation
  const getRecommendation = () => {
    if (compatibility.score >= 80) return { text: "Strong Hire", color: "text-green-600", bg: "bg-green-100" };
    if (compatibility.score >= 65) return { text: "Recommend Interview", color: "text-blue-600", bg: "bg-blue-100" };
    if (compatibility.score >= 50) return { text: "Consider with Reservations", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { text: "Not Recommended", color: "text-red-600", bg: "bg-red-100" };
  };

  const recommendation = getRecommendation();

  // Salary analysis
  const salaryFit = (() => {
    if (!job.salaryMin && !job.salaryMax) return null;
    const candidateMid = (marketValue.min + marketValue.max) / 2;
    const jobMid = ((job.salaryMin || 0) + (job.salaryMax || 0)) / 2;

    if (candidateMid > jobMid * 1.2) return { status: "high", text: "Expectations likely above budget" };
    if (candidateMid < jobMid * 0.8) return { status: "low", text: "May be overqualified or underpriced" };
    return { status: "match", text: "Within expected range" };
  })();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-base text-gray-500 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to results
        </button>
        <div className="flex items-center gap-2 text-base text-gray-400">
          <Eye className="w-5 h-5" />
          HR / Recruiter View
        </div>
      </div>

      {/* Job & Candidate Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-2xl p-8 text-white shadow-xl shadow-slate-900/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-base mb-2">Evaluating candidate for</p>
            <h2 className="text-3xl font-semibold tracking-tight">{job.title}</h2>
            <p className="text-slate-400 mt-2 text-lg">
              {job.company} · {job.location}
            </p>
          </div>
          <div className={`px-5 py-2.5 rounded-xl ${recommendation.bg}`}>
            <span className={`font-semibold text-base ${recommendation.color}`}>
              {recommendation.text}
            </span>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-600">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-slate-600 rounded-2xl flex items-center justify-center">
              <User className="w-7 h-7 text-slate-300" />
            </div>
            <div>
              <p className="font-semibold text-xl">{resume.fullName || "Candidate"}</p>
              <p className="text-slate-400 text-base mt-0.5">
                {resume.experience?.[0]?.title || "Professional"} · {yearsExp} years experience
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {[
          { id: "overview", label: "Overview" },
          { id: "details", label: "Detailed Analysis" },
          { id: "concerns", label: "Concerns & Flags" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 px-5 py-3 text-base font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Match Score */}
          <Card className="bg-white border-0 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
            <CardContent className="pt-8 pb-7 flex flex-col items-center">
              <ScoreRing score={compatibility.score} size={140} />
              <p className="mt-5 text-base font-medium text-gray-600">Overall Match Score</p>
              <p className="text-sm text-gray-400 mt-1">
                Based on skills, experience & industry fit
              </p>
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <Card className="bg-white border-0 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden md:col-span-2">
            <CardHeader className="pb-5 pt-7 px-7">
              <CardTitle className="text-xl font-semibold text-gray-900 tracking-tight">Fit Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-7 pb-7">
              <MetricBar label="Skills Match" value={compatibility.breakdown.skills} icon={Target} />
              <MetricBar label="Experience Fit" value={compatibility.breakdown.experience} icon={Briefcase} />
              <MetricBar label="Industry Alignment" value={compatibility.breakdown.industry} icon={Building2} />
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card className="bg-white border-0 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-green-700">
                <ThumbsUp className="w-5 h-5" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <ul className="space-y-3">
                {compatibility.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-3 text-base text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Gaps */}
          <Card className="bg-white border-0 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-orange-700">
                <ThumbsDown className="w-5 h-5" />
                Gaps
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <ul className="space-y-3">
                {compatibility.gaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-3 text-base text-gray-700">
                    <XCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    {gap}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Salary Analysis */}
          <Card className="bg-white border-0 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <DollarSign className="w-5 h-5 text-green-600" />
                Salary Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  ${Math.round(compatibility.salaryLeverage.targetLow / 1000)}K - ${Math.round(compatibility.salaryLeverage.targetHigh / 1000)}K
                </p>
                <p className="text-sm text-gray-500 mt-1">Candidate's target range</p>
              </div>
              {salaryFit && (
                <div className={`p-3 rounded-xl text-center text-base font-medium ${
                  salaryFit.status === "match" ? "bg-green-50 text-green-700" :
                  salaryFit.status === "high" ? "bg-red-50 text-red-700" :
                  "bg-yellow-50 text-yellow-700"
                }`}>
                  {salaryFit.text}
                </div>
              )}
              <p className="text-sm text-gray-500 text-center">
                {compatibility.salaryLeverage.rationale}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Details Tab */}
      {activeTab === "details" && (
        <div className="space-y-6">
          {/* Experience Timeline */}
          <Card className="bg-white">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Experience Summary (What HR Sees)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {resume.experience?.slice(0, 4).map((exp, i) => (
                  <div key={i} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{exp.title}</p>
                          <p className="text-sm text-gray-600">{exp.company}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                        </span>
                      </div>
                      {exp.highlights && exp.highlights.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {exp.highlights.slice(0, 2).map((h, j) => (
                            <li key={j} className="text-xs text-gray-500">• {h}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skills Detected */}
          <Card className="bg-white">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <Target className="w-5 h-5 text-purple-600" />
                Skills Detected by ATS
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Matching Job Requirements</p>
                  <div className="flex flex-wrap gap-2">
                    {profileAnalysis.marketPosition.skillsInDemand.slice(0, 8).map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Additional Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {profileAnalysis.skills.stated.slice(0, 10).map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
                {profileAnalysis.skills.gaps.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Missing/Weak Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {profileAnalysis.skills.gaps.slice(0, 5).map((gap, i) => (
                        <span key={i} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium">
                          ✗ {gap.skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Education */}
          {resume.education && resume.education.length > 0 && (
            <Card className="bg-white">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {resume.education.map((edu, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{edu.degree} {edu.field && `in ${edu.field}`}</p>
                        <p className="text-sm text-gray-600">{edu.institution}</p>
                        {edu.endDate && <p className="text-xs text-gray-400">{edu.endDate}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Concerns Tab */}
      {activeTab === "concerns" && (
        <div className="space-y-6">
          {/* Red Flags */}
          <Card className="bg-white border-red-200">
            <CardHeader className="pb-4 border-b border-red-100 bg-red-50">
              <CardTitle className="flex items-center gap-2 text-lg text-red-800">
                <AlertTriangle className="w-5 h-5" />
                Potential Red Flags for HR
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {profileAnalysis.concerns.length > 0 ? (
                profileAnalysis.concerns.map((concern, i) => (
                  <div key={i} className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                        concern.severity === "high" ? "bg-red-200 text-red-800" :
                        concern.severity === "medium" ? "bg-yellow-200 text-yellow-800" :
                        "bg-gray-200 text-gray-600"
                      }`}>
                        {concern.severity}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{concern.area}</p>
                        <p className="text-sm text-gray-600 mt-1">{concern.description}</p>
                        {concern.mitigation && (
                          <p className="text-xs text-gray-500 mt-2 italic">
                            Mitigation: {concern.mitigation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No significant red flags detected</p>
              )}
            </CardContent>
          </Card>

          {/* ATS Parse Issues */}
          <Card className="bg-white">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <FileText className="w-5 h-5 text-blue-600" />
                ATS Parsing Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {resume.summary ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm text-gray-700">
                    Professional Summary {resume.summary ? "detected" : "missing"}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {resume.email ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm text-gray-700">
                    Contact info {resume.email ? "complete" : "incomplete"}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {(resume.skills?.length || 0) >= 5 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="text-sm text-gray-700">
                    {resume.skills?.length || 0} skills extracted
                    {(resume.skills?.length || 0) < 5 && " (consider adding more)"}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {(resume.experience?.length || 0) >= 2 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="text-sm text-gray-700">
                    {resume.experience?.length || 0} work experiences found
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interviewer Notes */}
          <Card className="bg-white border-blue-200">
            <CardHeader className="pb-4 border-b border-blue-100 bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                <Eye className="w-5 h-5" />
                Recommended Interview Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {compatibility.gaps.slice(0, 3).map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {i + 1}
                    </span>
                    <span>
                      Probe on <strong>{gap}</strong> - ask for specific examples and how they've addressed this gap
                    </span>
                  </li>
                ))}
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {compatibility.gaps.length > 0 ? compatibility.gaps.length + 1 : 1}
                  </span>
                  <span>
                    Discuss salary expectations - candidate may target ${Math.round(compatibility.salaryLeverage.targetLow / 1000)}K-${Math.round(compatibility.salaryLeverage.targetHigh / 1000)}K
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendation Box */}
      <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white border-0 shadow-xl shadow-blue-500/25 rounded-2xl overflow-hidden">
        <CardContent className="py-8 px-8">
          <h3 className="font-semibold text-xl mb-3 tracking-tight">AI Assessment Summary</h3>
          <p className="text-blue-100 text-lg leading-relaxed">
            {compatibility.recommendation}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
