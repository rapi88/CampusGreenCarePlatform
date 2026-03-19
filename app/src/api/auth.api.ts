import { api } from './axios';

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { name: string; email: string; password: string; }

export const authApi = {
  login: (data: LoginPayload) => api.post<{ token: string; user: any }>('/auth/login', data),
  register: (data: RegisterPayload) => api.post('/auth/register', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  me: () => api.get('/auth/me'),
};
