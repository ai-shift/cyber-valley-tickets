import { queryOptions } from "@tanstack/react-query";
import { getGeodata, getGeodataLayer } from "./queries";

/**
 * Query keys for geodata to ensure consistency across the app.
 */
export const geodataKeys = {
  all: ["geodata"] as const,
  layers: () => [...geodataKeys.all, "layers"] as const,
  layer: (name: string) => [...geodataKeys.layers(), name] as const,
};

/**
 * TanStack Query options for geodata API.
 * All layers are cached with staleTime: Infinity to keep them for the session.
 */
export const geodataQueries = {
  layer: (layerName: string) =>
    queryOptions({
      queryKey: geodataKeys.layer(layerName),
      queryFn: async () => {
        const response = await getGeodataLayer(layerName);
        if (response.error) {
          throw new Error(
            `Failed to fetch layer ${layerName}: ${response.error}`,
          );
        }
        return response.data;
      },
      // Cache for the entire session - data doesn't change during the session
      staleTime: Number.POSITIVE_INFINITY,
      // Don't refetch on window focus
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect
      refetchOnReconnect: false,
    }),
  geodata: () =>
    queryOptions({
      queryKey: geodataKeys.layers(),
      queryFn: async () => {
        const response = await getGeodata();
        if (response.error) {
          throw new Error(`Failed to fetch geodata layers: ${response.error}`);
        }
        return response.data as string[];
      },
      staleTime: Number.POSITIVE_INFINITY,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
};
