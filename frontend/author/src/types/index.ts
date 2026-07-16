export type AuthRole = 'author';
export interface AuthorSocialLinks { x: string; linkedin: string; instagram: string; }
export interface AuthorVerification { status: 'pending' | 'approved' | 'rejected'; rejectionReason?: string; verifiedAt?: string; }
export interface Author {
  _id: string; id: string; email: string; fullName: string; avatar: string;
  bio: string; website: string; socialLinks: AuthorSocialLinks;
  kyc: Record<string, unknown>; verification: AuthorVerification; createdAt: string;
}
export interface StorySummary {
  _id: string; id: string; title: string; summary?: string; tags?: string[]; language?: string;
  publishedAt?: string; createdAt: string; bannerImage?: { url?: string; publicId?: string };
}
export interface CommentData { content: string; }
