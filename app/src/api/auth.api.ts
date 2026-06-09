import { api } from './axios';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatarUrl: string | null;
  points: number;
  adoptedTreeCount: number;
  totalWaterings: number;
  adoptedTreeIds: string[];
}

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { name: string; email: string; password: string; }

export const authApi = {
  login: (data: LoginPayload) => api.post<{ token: string; user: User }>('/auth/login', data),
  register: (data: RegisterPayload) => api.post('/auth/register', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  me: () => api.get<User>('/auth/me'),
  registerPushToken: (expoPushToken: string) => api.post<{ message: string }>('/auth/push-token', { expoPushToken }),
  uploadAvatar: (formData: FormData) => api.put<{ message: string; avatarUrl: string }>('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

