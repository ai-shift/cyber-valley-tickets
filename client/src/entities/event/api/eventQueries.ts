import { queryOptions } from "@tanstack/react-query";
import { getDetailEvent, getEvents } from "./queries";

export const eventQueries = {
  list: () =>
    queryOptions({
      queryKey: ["events", "lists"],
      queryFn: getEvents,
      select: (queryData) => queryData?.data,
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: ["events", "lists", id],
      queryFn: () => getDetailEvent(id),
      select: (queryData) => queryData?.data,
    }),
};
