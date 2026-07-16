export type AuthRole = 'admin';

export interface User {
  _id: string; fullName: string; email: string;
  avatar: { url: string; publicId: string; };
  interests: string[]; createdAt: string;
}

export interface Author {
  _id: string; email: string; fullName: string; profession: string;
  bio: string; website: string;
  avatar: { url: string; publicId: string; };
  socialLinks: { x: string; linkedin: string; instagram: string; };
  verification: { status: 'pending' | 'approved' | 'rejected'; rejectionReason?: string; verifiedAt?: string; };
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalAuthors: number;
  totalStories: number;
  pendingAuthors: number;
}

export interface Story {
  _id: string; title: string; content: string; status: string;
  author?: { _id: string; fullName: string; };
  tags: string[]; createdAt: string; publishedAt?: string;
}
