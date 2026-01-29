import { queryOptions } from "@tanstack/react-query";
import { getPlaces } from "./getPlaces";

export const placesQueries = {
  list: (search?: string) =>
    queryOptions({
      queryKey: ["places", search || ""],
      queryFn: () => getPlaces(search),
      select: (queryData) => queryData?.data,
      refetchInterval: 3000,
    }),
};
