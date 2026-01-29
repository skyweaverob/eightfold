"use client";

import { useState } from "react";
import { JobCompatibility } from "./JobCompatibility";
import { Search, Loader2, Building2, MapPin, DollarSign } from "lucide-react";
import type {
  ProfileAnalysis,
  ParsedResume,
  SalaryEstimate,
  JobListing,
  JobCompatibility as JobCompatibilityType,
} from "@/types";

interface JobSearchProps {
  profileAnalysis: ProfileAnalysis;
  resume: ParsedResume;
  marketValue: SalaryEstimate;
}

function formatSalary(amount: number): string {
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export function JobSearch({
  profileAnalysis,
  resume,
  marketValue,
}: JobSearchProps) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState(resume.location || "");
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [compatibility, setCompatibility] =
    useState<JobCompatibilityType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!title.trim() || !location.trim()) return;

    setIsSearching(true);
    setError(null);
    setJobs([]);
    setSelectedJob(null);
    setCompatibility(null);

    try {
      const response = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, location }),
      });

      if (!response.ok) {
        throw new Error("Failed to search jobs");
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectJob = async (job: JobListing) => {
    setSelectedJob(job);
    setIsAnalyzing(true);
    setCompatibility(null);

    try {
      const response = await fetch("/api/jobs/compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job,
          profileAnalysis,
          marketValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze compatibility");
      }

      const data = await response.json();
      setCompatibility(data);
    } catch (err) {
      console.error("Compatibility analysis failed:", err);
      setError("Failed to analyze compatibility. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBack = () => {
    setSelectedJob(null);
    setCompatibility(null);
    setError(null);
  };

  // Show compatibility view if a job is selected
  if (selectedJob) {
    return (
      <JobCompatibility
        job={selectedJob}
        compatibility={compatibility}
        isLoading={isAnalyzing}
        onBack={handleBack}
        profileAnalysis={profileAnalysis}
        resume={resume}
        marketValue={marketValue}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Search Form */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Job title (e.g., Product Manager)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 px-5 py-3.5 border border-gray-200 rounded-xl text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-44 px-5 py-3.5 border border-gray-200 rounded-xl text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || !title.trim() || !location.trim()}
          className="px-6 py-3.5 bg-blue-500 text-white rounded-xl text-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
        >
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Search className="w-5 h-5" />
              Search
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 rounded-xl">
          <p className="text-base text-red-600">{error}</p>
        </div>
      )}

      {/* Results */}
      {jobs.length > 0 && (
        <div className="space-y-4">
          <p className="text-base text-gray-500">
            {jobs.length} jobs found. Click to see your compatibility score.
          </p>
          {jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => handleSelectJob(job)}
              className="w-full text-left p-5 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50 transition-all group"
            >
              <h4 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{job.title}</h4>
              <div className="flex flex-wrap items-center gap-5 mt-3 text-base text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  {job.company}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
                {(job.salaryMin || job.salaryMax) && (
                  <span className="flex items-center gap-1.5 text-green-600 font-medium">
                    <DollarSign className="w-4 h-4" />
                    {job.salaryMin && job.salaryMax
                      ? `${formatSalary(job.salaryMin)} – ${formatSalary(job.salaryMax)}`
                      : job.salaryMin
                        ? `From ${formatSalary(job.salaryMin)}`
                        : `Up to ${formatSalary(job.salaryMax!)}`}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {!isSearching && jobs.length === 0 && title && (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">
            No jobs found. Try different search terms.
          </p>
        </div>
      )}

      {/* Initial state */}
      {!isSearching && jobs.length === 0 && !title && (
        <div className="text-center py-5">
          <p className="text-base text-gray-400">
            Enter a job title and location to search
          </p>
        </div>
      )}
    </div>
  );
}
