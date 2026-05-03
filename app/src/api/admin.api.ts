import { api } from './axios';
import { Tree } from './trees.api';

export const adminApi = {
  // Trees
  createTree: (data: Partial<Tree>) => api.post<Tree>('/admin/trees', data),
  updateTree: (id: string, data: Partial<Tree>) => api.put<Tree>(`/admin/trees/${id}`, data),
  deleteTree: (id: string) => api.delete(`/admin/trees/${id}`),
  uploadTreePhoto: (id: string, formData: FormData) => api.post<Tree>(`/admin/trees/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Suggestions
  getSuggestions: () => api.get<Tree[]>('/admin/trees/suggestions'),
  approveSuggestion: (id: string) => api.post<Tree>(`/admin/trees/${id}/approve`),
  rejectSuggestion: (id: string) => api.post(`/admin/trees/${id}/reject`),

  // Reports
  getWateringReport: (from: string, to: string) =>
    api.get('/admin/reports/watering', { params: { from, to } }),
  getStats: () => api.get('/admin/stats'),

  // Users
  getUsers: () => api.get('/admin/users'),
  getUserScore: (userId: string) => api.get(`/admin/users/${userId}/score`),
};
