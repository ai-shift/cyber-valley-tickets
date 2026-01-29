import { queryOptions } from "@tanstack/react-query";
import { getNotifications } from "./queries";

export const notificationQueries = {
  list: (search?: string) =>
    queryOptions({
      queryKey: ["notifications", "list", search || ""],
      queryFn: () => getNotifications(search),
      select: (queryData) => queryData?.data,
      refetchInterval: 5 * 1000,
    }),
};
