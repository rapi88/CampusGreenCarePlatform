// Map store — selected tree, filters, view mode
import { create } from 'zustand';

export type TreeStatus = 'watered' | 'needs_water' | 'due_soon';
export type MapViewMode = 'map' | 'list';

interface MapState {
  selectedTreeId: string | null;
  filterStatus: TreeStatus | null;
  viewMode: MapViewMode;
  setSelectedTree: (id: string | null) => void;
  setFilterStatus: (status: TreeStatus | null) => void;
  setViewMode: (mode: MapViewMode) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedTreeId: null,
  filterStatus: null,
  viewMode: 'map',
  setSelectedTree: (id) => set({ selectedTreeId: id }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
