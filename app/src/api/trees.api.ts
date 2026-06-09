import { api } from './axios';

export type TreeStatus = 'ACTIVE' | 'PENDING' | 'DENIED' | 'REMOVED';

export interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  status: TreeStatus;
  approvalStatus?: 'PENDING' | 'DENIED' | 'ACTIVE' | 'REMOVED';
  photoUrl?: string;
  estimatedAge: number;
  height: number;
  plantingDate: string;
  wateringPeriodDays: number;
  lastWateredAt?: string;
  location: string;
  isNaturalMonument?: boolean;
  health: 'Healthy' | 'Sick' | 'Critical';
  volunteerCount: number;
  maxVolunteers: number;
  isAdopted?: boolean;
  isSuggested?: boolean;
  suggestionId?: string;
  volunteers?: { id: string; name: string; avatarUrl: string | null }[];
}

export interface MyTreesResponse {
  adopted: Tree[];
  suggested: Tree[];
}

export const treesApi = {
  getAll: (params?: { status?: TreeStatus }) => api.get<Tree[]>('/trees', { params }),
  getById: (id: string) => api.get<Tree>(`/trees/${id}`),
  getMyTrees: () => api.get<MyTreesResponse>('/trees/mine'),
  suggest: (data: Partial<Tree>) => api.post('/trees/suggest', data),
  dismissSuggestion: (id: string) => api.put(`/trees/suggestions/${id}/dismiss`),
  adopt: (id: string) => api.post(`/trees/${id}/adopt`),
  leaveAdoption: (id: string) => api.delete(`/trees/${id}/adopt`),
  water: (id: string, coords: { lat: number; lng: number }) =>
    api.post(`/trees/${id}/water`, { latitude: coords.lat, longitude: coords.lng }),
};
