import { api } from './axios';
import { TreeStatus } from '../store/map.store';

export interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  status: TreeStatus;
  photoUrl?: string;
  estimatedAge: number;
  height: number;
  plantingDate: string;
  wateringPeriodDays: number;
  lastWateredAt?: string;
  location: string;
  isNaturalMonument?: boolean;
  health: 'Sağlıklı' | 'Hasta' | 'Kritik';
  volunteerCount: number;
  maxVolunteers: number;
}

export const treesApi = {
  getAll: (params?: { status?: TreeStatus }) => api.get<Tree[]>('/trees', { params }),
  getById: (id: string) => api.get<Tree>(`/trees/${id}`),
  adopt: (id: string) => api.post(`/trees/${id}/adopt`),
  leaveAdoption: (id: string) => api.delete(`/trees/${id}/adopt`),
  water: (id: string, coords: { lat: number; lng: number }) =>
    api.post(`/trees/${id}/water`, { latitude: coords.lat, longitude: coords.lng }),
  reportIssue: (id: string, description: string) =>
    api.post(`/trees/${id}/report`, { description }),
};
