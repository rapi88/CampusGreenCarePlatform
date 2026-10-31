// API Client for Campus Green Care CMS
const API_BASE = '/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  points: number;
  avatarUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  _count?: {
    adoptions?: number;
    wateringEvents?: number;
  };
}

export interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  location: string;
  photoPath: string | null;
  estimatedAge: number;
  height: number;
  plantingDate?: string | null;
  wateringPeriodDays: number;
  isNaturalMonument: boolean;
  health: 'HEALTHY' | 'SICK' | 'CRITICAL';
  status: 'PENDING' | 'DENIED' | 'ACTIVE' | 'REMOVED';
  maxVolunteers: number;
  createdAt: string;
  updatedAt: string;
  adoptions?: Array<{
    id: string;
    userId: string;
    user?: { name: string; email: string };
  }>;
  wateringEvents?: Array<{
    id: string;
    userId: string;
    createdAt: string;
    gpsVerified: boolean;
    user?: { name: string };
  }>;
}

export interface TreeSuggestion {
  id: string;
  treeId: string;
  userId: string;
  dismissed: boolean;
  createdAt: string;
  rejectionReason: string | null;
  tree: Tree;
  user: User;
}

export interface WateringLog {
  id: string;
  userId: string;
  treeId: string;
  latitude: number;
  longitude: number;
  gpsVerified: boolean;
  pointsAwarded: number;
  createdAt: string;
  tree?: { name: string; species: string; location: string };
  user?: { name: string; email: string };
}

export interface DashboardStats {
  totalTrees: number;
  activeVolunteers: number;
  wateringsToday: number;
  criticalTrees?: number;
  sickTrees?: number;
  healthyTrees?: number;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('cms_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_user');
    window.location.reload();
    throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Sunucu hatası: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{ token: string; user: User }>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User>(res);
  },

  // Dashboard stats
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<DashboardStats>(res);
  },

  // Trees CRUD
  async getTrees(status?: string) {
    const url = status ? `${API_BASE}/trees?status=${status}` : `${API_BASE}/trees`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Tree[]>(res);
  },

  async createTree(data: Partial<Tree>) {
    const res = await fetch(`${API_BASE}/admin/trees`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Tree>(res);
  },

  async updateTree(id: string, data: Partial<Tree>) {
    const res = await fetch(`${API_BASE}/admin/trees/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Tree>(res);
  },

  async deleteTree(id: string) {
    const res = await fetch(`${API_BASE}/admin/trees/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  async uploadTreePhoto(id: string, file: File) {
    const token = localStorage.getItem('cms_token');
    const formData = new FormData();
    formData.append('photo', file);

    const res = await fetch(`${API_BASE}/admin/trees/${id}/photo`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    return handleResponse<Tree>(res);
  },

  // Suggestions
  async getSuggestions() {
    const res = await fetch(`${API_BASE}/admin/trees/suggestions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Tree[]>(res);
  },

  async approveSuggestion(id: string) {
    const res = await fetch(`${API_BASE}/admin/trees/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<Tree>(res);
  },

  async rejectSuggestion(id: string, reason?: string) {
    const res = await fetch(`${API_BASE}/admin/trees/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason: reason || 'Uygun görülmedi' }),
    });
    return handleResponse<{ success: boolean }>(res);
  },

  // Users & Volunteers
  async getUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User[]>(res);
  },

  // Watering History / Reports
  async getWateringReport(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const res = await fetch(`${API_BASE}/admin/reports/watering?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<WateringLog[]>(res);
  },
};
