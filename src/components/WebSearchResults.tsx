"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Search,
  Newspaper,
  BookOpen,
  Mic,
  Award,
  Video,
  Code,
  Building2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
  FileText,
  Lightbulb,
} from "lucide-react";
import type { DeepSearchResults, CatalogedSearchResult } from "@/types";

interface WebSearchResultsProps {
  results: DeepSearchResults;
  className?: string;
  embedded?: boolean;
}

interface CategorySectionProps {
  title: string;
  icon: React.ReactNode;
  items: CatalogedSearchResult[];
  emptyMessage: string;
  accentColor: string;
}

function CategorySection({
  title,
  icon,
  items,
  emptyMessage,
  accentColor,
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(items.length <= 3);
  const displayItems = isExpanded ? items : items.slice(0, 3);

  if (items.length === 0) {
    return (
      <div className="py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 text-gray-400">
          {icon}
          <span className="text-sm">{emptyMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={accentColor}>{icon}</span>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
            {items.length}
          </span>
        </div>
        {items.length > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show all <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {displayItems.map((item, idx) => (
          <a
            key={idx}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                    {item.platform}
                  </span>
                  {item.date && (
                    <span className="text-xs text-gray-400">{item.date}</span>
                  )}
                  <span className="text-xs text-gray-300">
                    Score: {item.relevanceScore}
                  </span>
                </div>
                <p className="font-medium text-gray-900 text-sm line-clamp-1 group-hover:text-blue-700">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                  {item.snippet}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-1" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export function WebSearchResults({ results, className, embedded = false }: WebSearchResultsProps) {
  const visibilityColors = {
    high: "text-green-600 bg-green-100",
    medium: "text-yellow-600 bg-yellow-100",
    low: "text-orange-600 bg-orange-100",
    minimal: "text-red-600 bg-red-100",
  };

  const content = (
    <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {results.profiles.length}
            </div>
            <div className="text-xs text-gray-500">Profiles</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {results.news.length}
            </div>
            <div className="text-xs text-gray-500">News</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {results.publications.length}
            </div>
            <div className="text-xs text-gray-500">Publications</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {results.speaking.length}
            </div>
            <div className="text-xs text-gray-500">Speaking</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {results.awards.length}
            </div>
            <div className="text-xs text-gray-500">Awards</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {results.press.length}
            </div>
            <div className="text-xs text-gray-500">Press</div>
          </div>
        </div>

        {/* Quick Status */}
        <div className="flex flex-wrap gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              results.summary.hasLinkedIn
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {results.summary.hasLinkedIn ? "✓" : "✗"} LinkedIn
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              results.summary.hasGitHub
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {results.summary.hasGitHub ? "✓" : "✗"} GitHub
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              results.summary.hasTwitter
                ? "bg-sky-100 text-sky-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {results.summary.hasTwitter ? "✓" : "✗"} Twitter/X
          </span>
        </div>

        {/* Categories */}
        <div className="space-y-6">
          <CategorySection
            title="Professional Profiles"
            icon={<Globe className="w-5 h-5" />}
            items={results.profiles}
            emptyMessage="No professional profiles found"
            accentColor="text-blue-600"
          />

          <CategorySection
            title="News Coverage"
            icon={<Newspaper className="w-5 h-5" />}
            items={results.news}
            emptyMessage="No news coverage found"
            accentColor="text-blue-600"
          />

          <CategorySection
            title="Publications & Research"
            icon={<BookOpen className="w-5 h-5" />}
            items={results.publications}
            emptyMessage="No publications found"
            accentColor="text-purple-600"
          />

          <CategorySection
            title="Speaking Engagements"
            icon={<Mic className="w-5 h-5" />}
            items={results.speaking}
            emptyMessage="No speaking engagements found"
            accentColor="text-green-600"
          />

          <CategorySection
            title="Patents"
            icon={<Lightbulb className="w-5 h-5" />}
            items={results.patents}
            emptyMessage="No patents found"
            accentColor="text-amber-600"
          />

          <CategorySection
            title="Awards & Recognition"
            icon={<Award className="w-5 h-5" />}
            items={results.awards}
            emptyMessage="No awards found"
            accentColor="text-yellow-600"
          />

          <CategorySection
            title="Video Content"
            icon={<Video className="w-5 h-5" />}
            items={results.videos}
            emptyMessage="No video content found"
            accentColor="text-red-600"
          />

          <CategorySection
            title="Podcasts"
            icon={<Mic className="w-5 h-5" />}
            items={results.podcasts}
            emptyMessage="No podcast appearances found"
            accentColor="text-purple-600"
          />

          <CategorySection
            title="Open Source"
            icon={<Code className="w-5 h-5" />}
            items={results.opensource}
            emptyMessage="No open source contributions found"
            accentColor="text-gray-800"
          />

          <CategorySection
            title="Press & Company News"
            icon={<Building2 className="w-5 h-5" />}
            items={results.press}
            emptyMessage="No press coverage found"
            accentColor="text-orange-600"
          />

          <CategorySection
            title="General Mentions"
            icon={<FileText className="w-5 h-5" />}
            items={results.mentions}
            emptyMessage="No other mentions found"
            accentColor="text-gray-600"
          />
        </div>
      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4 border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg text-gray-900">
            <Search className="w-5 h-5 text-blue-600" />
            Deep Web Search Results
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              {results.totalResults} results from {results.searchesPerformed} searches
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                visibilityColors[results.summary.overallVisibility]
              }`}
            >
              {results.summary.overallVisibility} visibility
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {content}
      </CardContent>
    </Card>
  );
}
