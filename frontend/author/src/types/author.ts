export interface Avatar {
  url: string;
  publicId: string;
}

export interface SocialLinks {
  x: string;
  linkedin: string;
  instagram: string;
}

export interface AuthorVerification {
  status: "pending" | "approved" | "rejected";
  rejectionReason: string;
  verifiedAt: string | null;
}

export interface Author {
  id: string;

  email: string;
  fullName: string;
  profession: string;

  avatar: Avatar;

  bio: string;
  website?: string;

  socialLinks: SocialLinks;

  verification: AuthorVerification;

  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  profession: string;
  bio: string;
  website?: string;
  avatar: File | null;

  socialLinks: {
    x: string;
    linkedin: string;
    instagram: string;
  };
}
export interface AuthResponse {
  author: Author;
}