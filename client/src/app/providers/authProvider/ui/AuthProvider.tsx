import type { User } from "@/entities/user";
import { apiClient } from "@/shared/api";
import { client, wallets } from "@/shared/lib/web3";
import { useQuery } from "@tanstack/react-query";
import type React from "react";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useAutoConnect } from "thirdweb/react";
import { refresh } from "../api/refresh";
import { useAuthSlice } from "../model/authSlice";

export const AuthProvider: React.FC = () => {
  const navigate = useNavigate();
  const { login, logout, hasJWT } = useAuthSlice();
  const { isError, isLoading } = useQuery({
    queryFn: refresh,
    queryKey: ["refresh"],
    enabled: hasJWT,
    refetchInterval: 1000 * 60 * 3,
    refetchOnWindowFocus: true,
  });

  const hasError = !isLoading && isError;
  useAutoConnect({
    client,
    wallets,
    onConnect: (connecting) => console.log("onConnect", connecting),
    timeout: 5000,
  });

  useEffect(() => {
    if (hasError) {
      logout();
    } else {
      apiClient.GET("/api/users/current/").then((resp) => {
        login(resp.data as User);
      });
    }
  }, [hasError, navigate, hasJWT, logout]);

  return <Outlet />;
};
