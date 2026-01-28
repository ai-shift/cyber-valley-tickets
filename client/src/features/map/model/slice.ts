import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Event } from "@/entities/event";
import type { LatLng, Placemark as PlacemarkType } from "@/entities/geodata";
import { getGeodata, getGeodataLayer } from "@/entities/geodata/api/queries";
import type { PlaceWithEvents } from "./type";

type GeodataKey = string;

export type MapState = {
  isInitial: boolean;
  zoom: number;
  center: LatLng;

  selectedPlacemark: PlacemarkType | null;
  displayedGroups: GeodataKey[];
  layersTitles: string[];
  loadingTitles: boolean;
  error: string;
  loadingLayers: string[];
  fetchedLayers: Record<string, PlacemarkType[]>;

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
  fetchLayersTitles: () => Promise<void>;
  fetchLayer: (layerName: string) => Promise<void>;
  getDisplayedLayers: () => Record<string, PlacemarkType[]>;

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
      infoWindowShown: false,
      displayedGroups: ["events", "trails", "places"],
      layersTitles: [],
      loadingTitles: false,
      error: "",
      loadingLayers: [],
      fetchedLayers: {},
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
        const { displayedGroups, fetchLayer } = get();
        fetchLayer(group);
        set({
          displayedGroups: displayedGroups.includes(group)
            ? displayedGroups.filter((g) => g !== group)
            : [...displayedGroups, group],
        });
      },
      resetState: () => set((state) => ({ ...state, ...initialPos })),

      fetchLayersTitles: async () => {
        set({ loadingTitles: true });
        const { data, error } = await getGeodata();
        console.log("data", data, "error", error);
        if (data) {
          set({ layersTitles: data });
        }
        if (error) {
          set({ error: "Failed to fetch the tiles" });
          console.error("Failed to fetch layers titles:", error);
        }
        set({ loadingTitles: false });
      },

      fetchLayer: async (layerName: string) => {
        const { fetchedLayers, loadingLayers } = get();
        if (fetchedLayers[layerName]) {
          return;
        }
        set({
          loadingLayers: [...loadingLayers, layerName],
          error: "",
        });
        const { data, error } = await getGeodataLayer(layerName);
        if (data) {
          set({
            fetchedLayers: {
              ...fetchedLayers,
              [layerName]: data as PlacemarkType[],
            },
          });
        }
        if (error) {
          console.error(`Failed to fetch layer ${layerName}:`, error);
          set({
            error: `Failed to fetch the layer: ${layerName}`,
          });
        }
        set({
          loadingLayers: loadingLayers.filter((layer) => layer !== layerName),
        });
      },

      getDisplayedLayers: () => {
        const { fetchedLayers, displayedGroups } = get();
        const result: Record<string, PlacemarkType[]> = {};

        for (const layerName of displayedGroups) {
          if (fetchedLayers[layerName]) {
            result[layerName] = fetchedLayers[layerName];
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
