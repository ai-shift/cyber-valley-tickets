import { queryOptions } from "@tanstack/react-query";
import { getCurrentUser } from "./getCurrentUser";

export const userQueries = {
  current: () =>
    queryOptions({
      queryKey: ["user", "current"],
      queryFn: getCurrentUser,
      select: (queryData) => queryData?.data,
    }),
};
