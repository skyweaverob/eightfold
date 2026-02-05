// Resume and Profile Types
export interface WorkExperience {
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  highlights?: string[];
}

export interface Education {
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  highlights?: string[];
}

export interface Skill {
  name: string;
  level?: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience?: number;
  category?: string;
}

export interface InferredSkill extends Skill {
  inferenceReason?: string;
}

export interface Certification {
  name: string;
  issuer?: string;
  date?: string;
  expirationDate?: string;
  credentialId?: string;
}

export interface ParsedResume {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  rawText: string;
}

// Web Presence Types
export interface WebPresenceResult {
  platform: string;
  url: string;
  username?: string;
  title?: string;
  description?: string;
  profilePicture?: string;
  followers?: number;
  connections?: number;
  rawData?: Record<string, unknown>;
}

export interface LinkedInPost {
  text: string;
  postUrl: string;
  postedAt: string;
  timeAgo: string;
  numReactions: number;
  numComments: number;
  numReposts: number;
  images: string[];
  videoUrl?: string;
}

export interface LinkedInProfile {
  url: string;
  fullName?: string;
  headline?: string;
  summary?: string;
  location?: string;
  industry?: string;
  connections?: number;
  experience?: WorkExperience[];
  education?: Education[];
  skills?: string[];
  certifications?: Certification[];
  profilePicture?: string;
  recentPosts?: LinkedInPost[];
}

// Search Results
export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source?: string;
  date?: string;
}

// Labor Market Types
export interface SkillDemand {
  skillName: string;
  demandScore: number;
  growthRate: number;
  averageSalary?: number;
  jobPostings?: number;
  relatedSkills?: string[];
}

export interface CareerPath {
  currentRole: string;
  nextRoles: {
    title: string;
    probability: number;
    salaryRange?: { min: number; max: number };
    requiredSkills?: string[];
  }[];
}

export interface MarketPosition {
  overallScore: number;
  skillsInDemand: string[];
  skillsToAcquire: string[];
  salaryRange: { min: number; max: number; median: number };
  competitiveness: "low" | "medium" | "high";
}

// Analysis Types
export interface SkillAnalysis {
  stated: Skill[];
  inferred: InferredSkill[];
  gaps: {
    skill: string;
    importance: "low" | "medium" | "high";
    reason: string;
  }[];
  strengths: string[];
}

export interface CareerAnalysis {
  trajectory: string;
  progression: "linear" | "pivoting" | "accelerating" | "stagnating";
  yearsOfExperience: number;
  industryFocus: string[];
  potentialPaths: CareerPath[];
}

export interface ProfileAnalysis {
  skills: SkillAnalysis;
  career: CareerAnalysis;
  marketPosition: MarketPosition;
  webPresence: {
    platforms: WebPresenceResult[];
    consistency: number;
    issues: string[];
  };
  recommendations: {
    priority: "high" | "medium" | "low";
    category: string;
    title: string;
    description: string;
    actionItems: string[];
  }[];
  concerns: {
    severity: "low" | "medium" | "high";
    area: string;
    description: string;
    mitigation?: string;
  }[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AnalysisProgress {
  stage:
    | "uploading"
    | "parsing"
    | "searching"
    | "enriching"
    | "analyzing"
    | "complete"
    | "error";
  progress: number;
  message: string;
}

// Market Value Types
export interface SalaryEstimate {
  min: number;
  max: number;
  median: number;
  percentile: {
    low: number;
    high: number;
    rationale: string;
  };
  location: string;
  sampleSize: number;
}

// Job Search Types
export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salaryMin?: number;
  salaryMax?: number;
  createdAt?: string;
  category?: string;
}

// Job Compatibility Types
export interface JobCompatibility {
  score: number;
  breakdown: {
    skills: number;
    experience: number;
    industry: number;
  };
  strengths: string[];
  gaps: string[];
  salaryLeverage: {
    targetLow: number;
    targetHigh: number;
    rationale: string;
  };
  recommendation: string;
}

// Red Flag Types
export interface RedFlag {
  title: string;
  priority: "high" | "medium" | "low";
  whatSystemSees: string;
  whyConcerning: string;
  action: string;
}

// Parse Preview Types
export interface ParsePreview {
  detectedRole: string;
  experienceYears: number;
  experienceParsedCorrectly: boolean;
  skillsExtracted: string[];
  sectionsFound: {
    experience: boolean;
    education: boolean;
    skills: boolean;
    summary: boolean;
    contact: boolean;
  };
  parseIssues: string[];
}

// Deep Web Search Types
export interface CatalogedSearchResult {
  category:
    | "profile"
    | "news"
    | "publication"
    | "speaking"
    | "patent"
    | "award"
    | "podcast"
    | "video"
    | "opensource"
    | "press"
    | "mention"
    | "other";
  platform: string;
  url: string;
  title: string;
  snippet: string;
  date?: string;
  source?: string;
  relevanceScore: number;
  searchQuery: string;
}

export interface DeepSearchResults {
  profiles: CatalogedSearchResult[];
  news: CatalogedSearchResult[];
  publications: CatalogedSearchResult[];
  speaking: CatalogedSearchResult[];
  patents: CatalogedSearchResult[];
  awards: CatalogedSearchResult[];
  podcasts: CatalogedSearchResult[];
  videos: CatalogedSearchResult[];
  opensource: CatalogedSearchResult[];
  press: CatalogedSearchResult[];
  mentions: CatalogedSearchResult[];
  totalResults: number;
  searchesPerformed: number;
  summary: {
    hasLinkedIn: boolean;
    hasGitHub: boolean;
    hasTwitter: boolean;
    newsCount: number;
    publicationCount: number;
    speakingCount: number;
    overallVisibility: "high" | "medium" | "low" | "minimal";
  };
}
