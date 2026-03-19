import { api } from './axios';
import { Tree } from './trees.api';

export const adminApi = {
  // Trees
  createTree: (data: Partial<Tree>) => api.post<Tree>('/admin/trees', data),
  updateTree: (id: string, data: Partial<Tree>) => api.put<Tree>(`/admin/trees/${id}`, data),
  deleteTree: (id: string) => api.delete(`/admin/trees/${id}`),
  // Reports
  getWateringReport: (from: string, to: string) =>
    api.get('/admin/reports/watering', { params: { from, to } }),
  // Users
  getUsers: () => api.get('/admin/users'),
  getUserScore: (userId: string) => api.get(`/admin/users/${userId}/score`),
};
