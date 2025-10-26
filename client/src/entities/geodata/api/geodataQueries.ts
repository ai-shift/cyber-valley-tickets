import { queryOptions } from "@tanstack/react-query";
import { getGeodataLayer } from "./queries";

export const geodataQueries = {
  layer: (layerName: string) =>
    queryOptions({
      queryKey: ["geodata", layerName],
      queryFn: () => getGeodataLayer(layerName),
      select: (queryData) => queryData?.data,
      staleTime: 1000 * 60 * 60,
    }),
};
