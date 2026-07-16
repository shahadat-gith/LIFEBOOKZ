import type { Author } from "./author";

export type StoryStatus =
  | "draft"
  | "submitted"
  | "processing"
  | "published"
  | "rejected";

export type JobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface StoryVerification {
  status: JobStatus;
  canProceed: boolean;
  issues: string[];
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

  author: string | Author;

  title: string;
  content: string;

  status: StoryStatus;

  verification: StoryVerification;
  summary: StorySummary;

  stats: StoryStats;

  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CreateStoryRequest {
  title: string;
  content: string;
}

export interface UpdateStoryRequest {
  title?: string;
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