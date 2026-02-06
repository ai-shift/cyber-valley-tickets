import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Event } from "@/entities/event";
import type { LatLng, Placemark as PlacemarkType } from "@/entities/geodata";
import type { PlaceWithEvents } from "./type";

type GeodataKey = string;

export type MapState = {
  isInitial: boolean;
  zoom: number;
  center: LatLng;

  selectedPlacemark: PlacemarkType | null;
  displayedGroups: GeodataKey[];

  selectedPlace: PlaceWithEvents | null;
  eventPlaceLayer: Record<number, PlaceWithEvents>;
  events: Event[];
};

export type MapAction = {
  setZoom: (zoom: number) => void;
  setCenter: (center: LatLng) => void;

  setSelectedPlacemark: (placemark: PlacemarkType | null) => void;
  setDisplayedGroups: (groups: GeodataKey[]) => void;
  toggleGroup: (group: GeodataKey) => void;
  resetState: () => void;
  getDisplayedLayers: (
    preloadedLayers: Record<string, PlacemarkType[]>,
  ) => Record<string, PlacemarkType[]>;

  setEventLayer: (
    record: Record<number, PlaceWithEvents>,
    events: Event[],
  ) => void;
  selectEventPlace: (placeId: number | null) => void;
};

const initialPos: Pick<MapState, "isInitial" | "zoom" | "center"> = {
  isInitial: true,
  zoom: 16,
  center: { lat: -8.2980705, lng: 115.088186 },
};

export const useMapState = create<MapState & MapAction>()(
  persist(
    (set, get) => ({
      ...initialPos,
      selectedPlacemark: null,
      displayedGroups: ["trails", "places"],
      selectedPlace: null,
      events: [],
      eventPlaceLayer: {},

      setZoom: (zoom: number) => set({ zoom, isInitial: false }),
      setCenter: (center: LatLng) => set({ center, isInitial: false }),
      setSelectedPlacemark: (placemark: PlacemarkType | null) =>
        set({ selectedPlacemark: placemark }),
      setDisplayedGroups: (groups: GeodataKey[]) =>
        set({ displayedGroups: groups }),
      toggleGroup: (group: GeodataKey) => {
        const { displayedGroups } = get();
        const isAdding = !displayedGroups.includes(group);
        set({
          displayedGroups: isAdding
            ? [...displayedGroups, group]
            : displayedGroups.filter((g) => g !== group),
        });
        // Layer data is now preloaded by usePreloadGeodataLayers hook
        // No need to fetch here - data is already cached in TanStack Query
      },
      resetState: () => set((state) => ({ ...state, ...initialPos })),

      getDisplayedLayers: (
        preloadedLayers: Record<string, PlacemarkType[]>,
      ) => {
        const { displayedGroups } = get();
        const result: Record<string, PlacemarkType[]> = {};

        for (const layerName of displayedGroups) {
          if (preloadedLayers[layerName]) {
            result[layerName] = preloadedLayers[layerName];
          }
        }

        return result;
      },

      setEventLayer: (
        record: Record<number, PlaceWithEvents>,
        events: Event[],
      ) => {
        set({
          events,
          eventPlaceLayer: record,
        });
      },

      selectEventPlace: (placeId: number | null) => {
        const placeRecord = get().eventPlaceLayer;
        if (placeId === null) {
          set({ selectedPlace: null });
          return;
        }
        set({ selectedPlace: placeRecord[placeId] });
      },
    }),
    { name: "mapState" },
  ),
);
