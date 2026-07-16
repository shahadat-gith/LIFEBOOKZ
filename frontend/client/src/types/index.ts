export interface User {
  _id: string; id: string; email: string; name: string; avatar: string;
  preferences: { interests: string[]; profession: string; languages: string[]; location: { country: string; city: string } };
  createdAt: string;
}

export interface StoryAuthor {
  _id: string; fullName?: string; name?: string; avatar?: string; bio?: string;
}

export interface StorySummary {
  _id: string; id: string; title: string; summary?: string; tags?: string[];
  language?: string; publishedAt?: string; createdAt: string;
  author?: StoryAuthor; bannerImage?: { url?: string; publicId?: string };
}
