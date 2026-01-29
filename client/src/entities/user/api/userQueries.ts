import { queryOptions } from "@tanstack/react-query";
import {
  getCurrentUser,
  getUsersLocalproviders,
  getUsersStaff,
  getUsersVerifiedShamans,
} from "./userApi";

export const userQueries = {
  current: () =>
    queryOptions({
      queryKey: ["user", "current"],
      queryFn: getCurrentUser,
      select: (queryData) => queryData?.data,
    }),
  staff: (search?: string) =>
    queryOptions({
      queryKey: ["user", "list", "staff", search || ""],
      queryFn: () => getUsersStaff(search),
      select: (queryData) => queryData?.data,
      refetchInterval: 3000,
    }),
  localproviders: (search?: string) =>
    queryOptions({
      queryKey: ["user", "list", "localproviders", search || ""],
      queryFn: () => getUsersLocalproviders(search),
      select: (queryData) => queryData?.data,
      refetchInterval: 3000,
    }),
  verifiedShamans: (search?: string) =>
    queryOptions({
      queryKey: ["user", "list", "verifiedshamans", search || ""],
      queryFn: () => getUsersVerifiedShamans(search),
      select: (queryData) => queryData?.data,
      refetchInterval: 3000,
    }),
};
