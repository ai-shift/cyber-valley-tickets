import { geodataQueries } from "@/entities/geodata";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { Placemark } from "../model/types";

interface Geodata {
  [key: string]: Placemark[];
}

export const useGeodata = (activeLayers: string[]) => {
  const [geodata, setGeodata] = useState<Geodata>({});

  const { data: layersTitles, isLoading: loadingTitles} = useQuery(
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
  const modifiedResults = results.map((res, idx) => {
    return {
      layer: layersToLoad[idx],
      res: res
    }
  })
  
  const loadingLayers = modifiedResults.filter(({res}) => res.isLoading).map(({layer}) => layer);
  const errorLayers = modifiedResults.filter(({res}) => res.isError).map(({layer}) => layer);

  useEffect(() => {
    const newGeodata: Geodata = {};
    let shouldUpdate = false;

    for (const {res, layer} of modifiedResults)  {
      if (res.data && !geodata[layer]) {
        newGeodata[layer] = res.data as Placemark[];
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      setGeodata((prev) => ({ ...prev, ...newGeodata }));
    }
  }, [results, geodata, layersToLoad]);

  return {
    layersTitles: layersTitles ?? [],
    loadingTitles,
    errorLayers,
    loadingLayers,
    geodata: geodata,
  };
};
