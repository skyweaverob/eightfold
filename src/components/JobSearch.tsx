"use client";

import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { JobCard } from "./ui/job-card";
import { JobCompatibility } from "./JobCompatibility";
import { Search, Loader2 } from "lucide-react";
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
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBack = () => {
    setSelectedJob(null);
    setCompatibility(null);
  };

  // Show compatibility view if a job is selected
  if (selectedJob) {
    return (
      <JobCompatibility
        job={selectedJob}
        compatibility={compatibility}
        isLoading={isAnalyzing}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="flex gap-3">
        <Input
          placeholder="Job title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Input
          placeholder="Location..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-40"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-footnote text-[var(--error)] text-center">{error}</p>
      )}

      {/* Results */}
      {jobs.length > 0 && (
        <div className="space-y-2">
          <p className="text-footnote text-[var(--text-secondary)]">
            {jobs.length} jobs found. Click to see compatibility.
          </p>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              title={job.title}
              company={job.company}
              location={job.location}
              salaryMin={job.salaryMin}
              salaryMax={job.salaryMax}
              onClick={() => handleSelectJob(job)}
            />
          ))}
        </div>
      )}

      {/* No results */}
      {!isSearching && jobs.length === 0 && title && (
        <p className="text-footnote text-[var(--text-secondary)] text-center">
          No jobs found. Try different search terms.
        </p>
      )}
    </div>
  );
}
