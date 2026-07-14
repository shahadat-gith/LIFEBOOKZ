// ============================================================
// Lifebookz Shared Type Definitions
// ============================================================

// ---- Auth ----

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export type AuthRole = 'user' | 'author' | 'admin' | null;

// ---- User ----

export interface UserPreferences {
  interests: string[];
  profession: string;
  languages: string[];
  location: { country: string; city: string };
}

export interface UserUpdatePreferences {
  interests?: string[];
  profession?: string;
  languages?: string[];
  location?: { country?: string; city?: string };
}

export interface User {
  _id: string;
  id: string;
  email: string;
  name: string;
  avatar: string;
  preferences: UserPreferences;
  createdAt: string;
}

// ---- Author ----

export interface AuthorKYC {
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  governmentId?: {
    type: string;
    number: string;
    documentUrl: string;
  };
}

export interface AuthorSocialLinks {
  x: string;
  linkedin: string;
  instagram: string;
}

export interface AuthorVerification {
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  verifiedAt?: string;
}

export interface Author {
  _id: string;
  id: string;
  email: string;
  fullName: string;
  avatar: string;
  bio: string;
  website: string;
  socialLinks: AuthorSocialLinks;
  kyc: AuthorKYC;
  verification: AuthorVerification;
  createdAt: string;
}

export interface AuthorUpdateData {
  fullName?: string;
  bio?: string;
  website?: string;
  avatar?: string;
  socialLinks?: Partial<AuthorSocialLinks>;
}

// ---- Story ----

export interface StoryBannerImage {
  url?: string;
  publicId?: string;
}

export interface StoryAuthor {
  _id: string;
  fullName?: string;
  name?: string;
  avatar?: string;
  bio?: string;
}

export interface StorySummary {
  _id: string;
  id: string;
  title: string;
  summary?: string;
  tags?: string[];
  language?: string;
  publishedAt?: string;
  createdAt: string;
  author?: StoryAuthor;
  bannerImage?: StoryBannerImage;
}

export interface CreateStoryData {
  title: string;
  content: string;
  tags?: string[];
  language?: string;
  bannerImage?: StoryBannerImage;
}

export interface UpdateStoryData {
  title?: string;
  content?: string;
  tags?: string[];
  language?: string;
  bannerImage?: StoryBannerImage;
}

export interface StoryListParams {
  limit?: number;
  cursor?: string;
  language?: string;
  tags?: string;
  authorId?: string;
}

export interface CommentData {
  content: string;
}

// ---- Search ----

export interface SearchParams {
  q: string;
  limit?: number;
  language?: string;
  category?: string;
}
