import { create } from 'zustand';

interface AwardState {
  topWatererPhotoUrl: string | null;
  awardText: string;
  setTopWatererPhotoUrl: (url: string) => void;
  setAwardText: (text: string) => void;
}

export const useAwardStore = create<AwardState>((set) => ({
  topWatererPhotoUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', // Default placeholder
  awardText: 'Haftanın En Çok Sulayanı!',
  setTopWatererPhotoUrl: (url) => set({ topWatererPhotoUrl: url }),
  setAwardText: (text) => set({ awardText: text }),
}));
