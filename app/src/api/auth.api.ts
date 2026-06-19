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
export interface RegisterResponse {
  message: string;
  userId: string;
  verificationEmailSent?: boolean;
}

export const authApi = {
  login: (data: LoginPayload) => api.post<{ token: string; user: User }>('/auth/login', data),
  register: (data: RegisterPayload) => api.post<RegisterResponse>('/auth/register', data),
  verifyCode: (email: string, code: string) => api.post<{ message: string }>('/auth/verify-code', { email, code }),
  resendCode: (email: string) => api.post<{ message: string }>('/auth/resend-code', { email }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  verifyResetCode: (email: string, code: string) => api.post<{ resetToken: string, message: string }>('/auth/verify-reset-code', { email, code }),
  resetPassword: (token: string, password: string) => api.post<{ message: string }>('/auth/reset-password', { token, password }),
  me: () => api.get<User>('/auth/me'),
  registerPushToken: (expoPushToken: string) => api.post<{ message: string }>('/auth/push-token', { expoPushToken }),
  uploadAvatar: (formData: FormData) => api.put<{ message: string; avatarUrl: string }>('/auth/avatar', formData),
  updateProfile: (data: { name: string }) => api.put<{ message: string; user: User }>('/auth/profile', data),
};
