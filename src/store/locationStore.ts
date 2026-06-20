import { create } from 'zustand';

export type LocationState = {
  lat: number | null;
  lng: number | null;
  area: string;
  city: string;
  permissionGranted: boolean | null; // null = not asked yet
  setLocation: (lat: number, lng: number, area: string, city: string) => void;
  setArea: (area: string, city: string) => void;
  setPermission: (granted: boolean) => void;
};

export const useLocationStore = create<LocationState>((set) => ({
  lat: null,
  lng: null,
  area: '',
  city: '',
  permissionGranted: null,
  setLocation: (lat, lng, area, city) => set({ lat, lng, area, city, permissionGranted: true }),
  setArea: (area, city) => set({ area, city }),
  setPermission: (granted) => set({ permissionGranted: granted }),
}));
