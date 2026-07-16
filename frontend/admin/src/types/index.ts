export type AuthRole = 'admin';
export interface User { _id: string; name: string; email: string; avatar: string; createdAt: string; }
export interface Author {
  _id: string; email: string; fullName: string; bio: string; website: string;
  verification: { status: 'pending' | 'approved' | 'rejected'; rejectionReason?: string; verifiedAt?: string; };
  kyc: Record<string, unknown>; createdAt: string;
}
