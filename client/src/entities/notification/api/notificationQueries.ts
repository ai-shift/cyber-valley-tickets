import { queryOptions } from "@tanstack/react-query";
import { getNotifications } from "./queries";

export const notificationQueries = {
  list: () =>
    queryOptions({
      queryKey: ["notifications", "list"],
      queryFn: getNotifications,
      select: (queryData) => queryData?.data,
    }),
};
