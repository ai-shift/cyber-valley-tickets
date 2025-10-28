import { queryOptions } from "@tanstack/react-query";
import { getGeodata, getGeodataLayer } from "./queries";

export const geodataQueries = {
  layer: (layerName: string) =>
    queryOptions({
      queryKey: ["geodata", layerName],
      queryFn: () => getGeodataLayer(layerName),
      select: (queryData) => queryData?.data,
      staleTime: 1000 * 60 * 60,
    }),
  geodata: () =>
    queryOptions({
      queryKey: ["geodata", "layers", "all"],
      queryFn: getGeodata,
      select: (queryData) => queryData?.data,
    }),
};
