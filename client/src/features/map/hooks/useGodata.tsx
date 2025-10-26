import { geodataQueries } from "@/entities/geodata";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import type { Placemark } from "../model/types";

export const useGeodata = (activeLayers: string[]) => {
  const geodata = useRef<Record<string, Placemark[]>>({});

  const { data: layersTitles, isLoading: loadingLayers } = useQuery(
    geodataQueries.geodata(),
  );
  const layersToLoad = activeLayers.filter(
    (layer) => !Object.keys(geodata.current).includes(layer),
  );

  const results = useQueries({
    queries: layersToLoad.map((layer) => ({
      ...geodataQueries.layer(layer),
    })),
  });

  const loadingGeodata = results.some((res) => res.isLoading);

  for (let i = 0; i < results.length; i++) {
    const currRes = results[i];
    if (currRes?.isSuccess) {
      geodata.current = { ...geodata.current, [layersToLoad[i]]: currRes.data };
    }
  }

  return {
    layersTitles: layersTitles ?? [],
    loadingGeodata,
    loadingLayers,
    geodata: geodata.current,
  };
};
