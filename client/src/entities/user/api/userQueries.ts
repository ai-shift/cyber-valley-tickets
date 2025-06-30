import { queryOptions } from "@tanstack/react-query";
import { getCurrentUser, getUsersStaff } from "./userApi";

export const userQueries = {
  current: () =>
    queryOptions({
      queryKey: ["user", "current"],
      queryFn: getCurrentUser,
      select: (queryData) => queryData?.data,
    }),
  staff: () =>
    queryOptions({
      queryKey: ["user", "list", "staff"],
      queryFn: getUsersStaff,
      select: (queryData) => queryData?.data,
      refetchInterval: 3000,
    }),
};
