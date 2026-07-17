import type { Author } from "./author";

export type StoryStatus =
  | "draft"
  | "submitted"
  | "processing"
  | "verified"
  | "published"
  | "rejected";

export type JobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface VerificationIssue {
  description: string;
  suggestion: string;
}

export interface StoryVerification {
  status: JobStatus;
  canProceed: boolean;
  issues: VerificationIssue[];
}

export interface StorySummary {
  status: JobStatus;
  content: string;
}

export interface StoryStats {
  likes: number;
  comments: number;
  views: number;
}

export interface Story {
  id: string;
  _id?: string;

  author: string | Author;

  content: string;

  status: StoryStatus;

  verification?: StoryVerification;
  summary?: StorySummary;

  stats?: StoryStats;

  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CreateStoryRequest {
  content: string;
}

export interface UpdateStoryRequest {
  content?: string;
}


interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface StoryListResponse {
  stories: Story[];
  pagination: Pagination;
}