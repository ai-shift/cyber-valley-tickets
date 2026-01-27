import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { LatLng, Placemark as PlacemarkType } from "@/entities/geodata";

type GeodataKey = string;

export type MapState = {
  zoom: number;
  center: LatLng;
  selectedId: string;
  selectedPlacemark: PlacemarkType | null;
  infoWindowShown: boolean;
  setZoom: (zoom: number) => void;
  setCenter: (center: LatLng) => void;
  setSelectedId: (id: string) => void;
  setSelectedPlacemark: (placemark: PlacemarkType | null) => void;
  setInfoWindowShown: (shown: boolean) => void;

  displayedGroups: GeodataKey[];
  setDisplayedGroups: (groups: GeodataKey[]) => void;
  toggleGroup: (group: GeodataKey) => void;
};

export const useMapState = create<MapState>()(
  persist(
    (set, get) => ({
      zoom: 16,
      center: { lat: -8.2980705, lng: 115.088186 },
      selectedId: "",
      selectedPlacemark: null,
      infoWindowShown: false,
      displayedGroups: ["paths"],
      setZoom: (zoom: number) => set({ zoom }),
      setCenter: (center: LatLng) => set({ center }),
      setSelectedId: (id: string) => set({ selectedId: id }),
      setSelectedPlacemark: (placemark: PlacemarkType | null) =>
        set({ selectedPlacemark: placemark }),
      setInfoWindowShown: (shown: boolean) => set({ infoWindowShown: shown }),
      setDisplayedGroups: (groups: GeodataKey[]) =>
        set({ displayedGroups: groups }),
      toggleGroup: (group: GeodataKey) => {
        const current = get().displayedGroups;
        set({
          displayedGroups: current.includes(group)
            ? current.filter((g) => g !== group)
            : [...current, group],
        });
      },
    }),
    { name: "mapState" },
  ),
);
