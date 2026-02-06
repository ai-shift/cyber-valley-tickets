import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Placemark } from "../model/types";
import { geodataQueries } from "./geodataQueries";

/**
 * Hook to preload all geodata layers in the background.
 * Fetches layer titles first, then fetches all layers in parallel.
 * Data is cached by TanStack Query until page reload.
 */
export const usePreloadGeodataLayers = () => {
  const queryClient = useQueryClient();

  // First, fetch all layer titles
  const {
    data: layerTitles,
    isLoading: isLoadingTitles,
    error: titlesError,
  } = useQuery(geodataQueries.geodata());

  // Then, fetch all layers in parallel using useQueries
  const layerQueries = useQueries({
    queries:
      layerTitles?.map((title) => ({
        ...geodataQueries.layer(title),
        // Keep data fresh for the session but don't refetch automatically
        staleTime: Number.POSITIVE_INFINITY,
        // Start fetching immediately when titles are available
        enabled: !!layerTitles && layerTitles.length > 0,
      })) ?? [],
  });

  // Calculate overall loading state
  const isLoadingLayers = layerQueries.some((query) => query.isLoading);
  const isFetchingLayers = layerQueries.some((query) => query.isFetching);
  const allLayersLoaded =
    layerQueries.length > 0 && layerQueries.every((query) => query.isSuccess);

  // Get all loaded layers as a record
  const layersRecord: Record<string, Placemark[]> = {};
  layerQueries.forEach((query, index) => {
    const title = layerTitles?.[index];
    if (title && query.data) {
      layersRecord[title] = query.data as Placemark[];
    }
  });

  // Prefetch function for manual use if needed
  const prefetchLayer = async (layerName: string) => {
    await queryClient.prefetchQuery(geodataQueries.layer(layerName));
  };

  return {
    layerTitles: layerTitles ?? [],
    layers: layersRecord,
    isLoadingTitles,
    isLoadingLayers,
    isFetchingLayers,
    allLayersLoaded,
    titlesError,
    prefetchLayer,
  };
};

/**
 * Hook to get a specific layer from the cache.
 * Returns undefined if the layer is not yet loaded.
 */
export const useGeodataLayer = (layerName: string) => {
  return useQuery({
    ...geodataQueries.layer(layerName),
    staleTime: Number.POSITIVE_INFINITY,
  });
};

/**
 * Hook to check if all specified layers are loaded.
 * Useful for checking if layers are ready before displaying them.
 */
export const useAreLayersReady = (layerNames: string[]) => {
  const queryClient = useQueryClient();

  const checkLayers = () => {
    return layerNames.every((name) => {
      const data = queryClient.getQueryData(
        geodataQueries.layer(name).queryKey,
      );
      return !!data;
    });
  };

  return checkLayers();
};
