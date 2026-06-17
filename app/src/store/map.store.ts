// Map store — selected tree, filters, view mode, admin add-tree mode
import { create } from 'zustand';

export type TreeStatus = 'watered' | 'needs_water' | 'due_soon';
export type MapViewMode = 'map' | 'list';

interface MapState {
  selectedTreeId: string | null;
  filterStatus: TreeStatus | null;
  filterOwnership: 'all' | 'mine';
  viewMode: MapViewMode;
  mapStyle: 'outdoors' | 'satellite';
  // Admin add-tree mode
  isAddingTree: boolean;
  // User suggest-tree mode
  isSuggestingTree: boolean;
  pendingPin: { lat: number; lng: number } | null;
  
  setSelectedTree: (id: string | null) => void;
  setFilterStatus: (status: TreeStatus | null) => void;
  setFilterOwnership: (ownership: 'all' | 'mine') => void;
  setViewMode: (mode: MapViewMode) => void;
  toggleMapStyle: () => void;
  setIsAddingTree: (val: boolean) => void;
  setIsSuggestingTree: (val: boolean) => void;
  setPendingPin: (pin: { lat: number; lng: number } | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedTreeId: null,
  filterStatus: null,
  filterOwnership: 'all',
  viewMode: 'map',
  mapStyle: 'satellite',
  isAddingTree: false,
  isSuggestingTree: false,
  pendingPin: null,
  
  setSelectedTree: (id) => set({ selectedTreeId: id }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterOwnership: (ownership) => set({ filterOwnership: ownership }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleMapStyle: () => set((state) => ({ mapStyle: state.mapStyle === 'outdoors' ? 'satellite' : 'outdoors' })),
  setIsAddingTree: (val) => set({ isAddingTree: val, pendingPin: null }),
  setIsSuggestingTree: (val) => set({ isSuggestingTree: val, pendingPin: null }),
  setPendingPin: (pin) => set({ pendingPin: pin }),
}));
