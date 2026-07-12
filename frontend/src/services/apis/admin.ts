import api from '../../lib/axios';

export const adminApi = {
  /** Get admin dashboard stats */
  dashboard: () => api.get('/admin/dashboard'),

  /** List pending author applications */
  listApplications: () => api.get('/admin/applications'),

  /** Approve an author application */
  approveApplication: (authorId: string, note?: string) =>
    api.post(`/admin/applications/${authorId}/approve`, { note }),

  /** Reject an author application */
  rejectApplication: (authorId: string, reason: string) =>
    api.post(`/admin/applications/${authorId}/reject`, { reason }),

  /** Health check */
  health: () => api.get('/admin/health'),
};
