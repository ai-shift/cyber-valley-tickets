import { useQuery } from "@tanstack/react-query";
import { verify } from "../api/verify";
import { apiClient } from "@/shared/api";
import { useCallback } from "react";

export const useAuth = () => {
  const { isError, isLoading } = useQuery({
    queryFn: verify,
    queryKey: ["verify"],
    staleTime: 1000 * 60 * 4,
    gcTime: 1000 * 60 * 4,
    refetchInterval: 1000 * 60 * 4,
  });

  const logout = useCallback(async () => apiClient.GET("/api/auth/logout"), []);
  const isAuth = !isError && !isLoading;
  console.log("isAuth", isAuth, "isError", isError, isLoading);

  return { isAuth, logout };
};
