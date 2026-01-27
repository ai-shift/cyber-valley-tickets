import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { LatLng, Placemark as PlacemarkType } from "@/entities/geodata";

type GeodataKey = string;

export type MapState = {
  isInitial: boolean;
  zoom: number;
  center: LatLng;
  selectedId: string;
  selectedPlacemark: PlacemarkType | null;
  infoWindowShown: boolean;
  displayedGroups: GeodataKey[];
}

export type MapAction = {
  setZoom: (zoom: number) => void;
  setCenter: (center: LatLng) => void;
  setSelectedId: (id: string) => void;
  setSelectedPlacemark: (placemark: PlacemarkType | null) => void;
  setInfoWindowShown: (shown: boolean) => void;
  setDisplayedGroups: (groups: GeodataKey[]) => void;
  toggleGroup: (group: GeodataKey) => void;
  resetState: () => void;
}

const initialPos: Pick<MapState, "isInitial" | "zoom" | "center"> = {
      isInitial: true,
      zoom: 16,
      center: { lat: -8.2980705, lng: 115.088186 },
}

export const useMapState = create<MapState & MapAction>()(
  persist(
    (set, get) => ({
      ...initialPos,
      selectedId: "",
      selectedPlacemark: null,
      infoWindowShown: false,
      displayedGroups: [],
      setZoom: (zoom: number) => set({ zoom, isInitial: false }),
      setCenter: (center: LatLng) => set({ center, isInitial: false }),
      setSelectedId: (id: string) => set({ selectedId: id }),
      setSelectedPlacemark: (placemark: PlacemarkType | null) =>
        set({ selectedPlacemark: placemark  }),
      setInfoWindowShown: (shown: boolean) => set({ infoWindowShown: shown  }),
      setDisplayedGroups: (groups: GeodataKey[]) =>
        set({ displayedGroups: groups  }),
      toggleGroup: (group: GeodataKey) => {
        const current = get().displayedGroups;
        set({
          displayedGroups: current.includes(group)
            ? current.filter((g) => g !== group)
            : [...current, group],
        });
      },
      resetState: () => set((state) => ({...state, ...initialPos}))
    }),
    { name: "mapState" },
  ),
);
