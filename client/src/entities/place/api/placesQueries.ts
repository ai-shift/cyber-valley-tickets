import { queryOptions } from "@tanstack/react-query";
import { getPlaces } from "./getPlaces";

export const placesQueries = {
  list: () =>
    queryOptions({
      queryKey: ["places"],
      queryFn: getPlaces,
      select: (queryData) => queryData?.data,
    }),
};
