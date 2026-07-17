export interface User {
  _id: string; id: string; email: string; fullName: string;
  avatar: { url: string; publicId: string; };
  interests: string[];
  createdAt: string;
}

export interface StoryAuthor {
  _id: string; id?: string; fullName?: string; avatar?: { url?: string; publicId?: string };
  bio?: string; website?: string; socialLinks?: Record<string, string>;
}

export interface Story {
  _id: string; id: string; content: string;
  summary?: { status?: string; content?: string };
  stats?: { likes: number; comments: number; views: number };
  verification?: {
    status: string; canProceed: boolean;
    issues: Array<{ description: string; suggestion: string }>;
  };
  author?: StoryAuthor;
  status: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  likedByUser?: boolean;
}

export interface StorySummary {
  _id: string; id: string; content: string;
  summary?: { status?: string; content?: string };
  publishedAt?: string; createdAt: string;
  author?: StoryAuthor; status?: string;
}
