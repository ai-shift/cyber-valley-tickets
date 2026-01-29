import { queryOptions } from "@tanstack/react-query";
import { getDetailEvent, getEvents } from "./queries";

export const eventQueries = {
  list: (search?: string) =>
    queryOptions({
      queryKey: ["events", "lists", search || ""],
      queryFn: () => getEvents(search),
      select: (queryData) => queryData?.data,
      refetchInterval: 3000,
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: ["events", "lists", id],
      queryFn: () => getDetailEvent(id),
      select: (queryData) => queryData?.data,
      refetchInterval: 3000,
    }),
};
