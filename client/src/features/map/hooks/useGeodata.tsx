import { geodataQueries } from "@/entities/geodata";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { Placemark } from "../model/types";

interface Geodata {
  [key: string]: Placemark[];
}

export const useGeodata = (activeLayers: string[]) => {
  const [geodata, setGeodata] = useState<Geodata>({});

  const { data: layersTitles, isLoading: loadingLayers } = useQuery(
    geodataQueries.geodata(),
  );

  const layersToLoad = useMemo(
    () => activeLayers.filter((layer) => !Object.keys(geodata).includes(layer)),
    [activeLayers, geodata],
  );

  const results = useQueries({
    queries: layersToLoad.map((layer) => ({
      ...geodataQueries.layer(layer),
    })),
  });

  const loadingGeodata = results.some((res) => res.isLoading);

  useEffect(() => {
    const newGeodata: Geodata = {};
    let shouldUpdate = false;

    for (let i = 0; i < results.length; i++) {
      const currRes = results[i];
      const key = layersToLoad[i];
      if (!key) {
        continue;
      }

      if (currRes?.data && !geodata[key]) {
        newGeodata[key] = currRes.data as Placemark[];
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      setGeodata((prev) => ({ ...prev, ...newGeodata }));
    }
  }, [results, geodata, layersToLoad]);
  return {
    layersTitles: layersTitles ?? [],
    loadingGeodata,
    loadingLayers,
    geodata: geodata,
  };
};
