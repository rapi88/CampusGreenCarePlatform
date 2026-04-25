// Map store — selected tree, filters, view mode, admin add-tree mode
import { create } from 'zustand';

export type TreeStatus = 'watered' | 'needs_water' | 'due_soon';
export type MapViewMode = 'map' | 'list';

export interface TreeData {
  id: string;
  name: string;
  location: string;
  status: TreeStatus;
  lat: number;
  lng: number;
  distanceM: number;
}

interface MapState {
  selectedTreeId: string | null;
  filterStatus: TreeStatus | null;
  viewMode: MapViewMode;
  // Admin add-tree mode
  isAddingTree: boolean;
  pendingPin: { lat: number; lng: number } | null;
  trees: TreeData[];
  setSelectedTree: (id: string | null) => void;
  setFilterStatus: (status: TreeStatus | null) => void;
  setViewMode: (mode: MapViewMode) => void;
  setIsAddingTree: (val: boolean) => void;
  setPendingPin: (pin: { lat: number; lng: number } | null) => void;
  addTree: (tree: TreeData) => void;
  removeTree: (id: string) => void;
}

// Initial mock data
const INITIAL_TREES: TreeData[] = [
  { id: '1', name: 'Ak Meşe', location: 'Merkezi Avlu, Sektör A', status: 'needs_water', lat: 40.804, lng: 29.361, distanceM: 20 },
  { id: '2', name: 'Kestane #042', location: 'Kütüphane Önü', status: 'watered', lat: 40.805, lng: 29.362, distanceM: 150 },
  { id: '3', name: 'Sedir #17', location: 'Mühendislik Binası', status: 'due_soon', lat: 40.803, lng: 29.360, distanceM: 300 },
];

export const useMapStore = create<MapState>((set) => ({
  selectedTreeId: null,
  filterStatus: null,
  viewMode: 'map',
  isAddingTree: false,
  pendingPin: null,
  trees: INITIAL_TREES,
  setSelectedTree: (id) => set({ selectedTreeId: id }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setIsAddingTree: (val) => set({ isAddingTree: val, pendingPin: val ? null : null }),
  setPendingPin: (pin) => set({ pendingPin: pin }),
  addTree: (tree) => set((state) => ({
    trees: [...state.trees, tree],
    isAddingTree: false,
    pendingPin: null,
  })),
  removeTree: (id) => set((state) => ({
    trees: state.trees.filter((t) => t.id !== id),
  })),
}));
