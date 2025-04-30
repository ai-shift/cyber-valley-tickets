import type { Event } from "../model/types";

import { queryClient } from "@/shared/api/query-client";
import { queryOptions } from "@tanstack/react-query";
import { getEvents } from "./get-events";

export const eventQueries = {
  all: ["events"],
  lists: () => [...eventQueries.all, "list"],
  list: () =>
    queryOptions({
      queryKey: [...eventQueries.lists()],
      queryFn: getEvents,
    }),
  details: () => [...eventQueries.all, "details"],
  detail: (id: number) =>
    queryOptions({
      queryKey: [...eventQueries.details(), id],
      initialData: () => {
        return queryClient
          .getQueryData<Event[]>([...eventQueries.lists()])
          ?.find((event) => event.id === id);
      },
    }),
};
