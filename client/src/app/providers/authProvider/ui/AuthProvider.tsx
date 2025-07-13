import type React from "react";
import { refresh } from "../api/refresh";

import { client, wallets } from "@/shared/lib/web3";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useAutoConnect } from "thirdweb/react";
import { useAuthSlice } from "../model/authSlice";

export const AuthProvider: React.FC = () => {
  const navigate = useNavigate();
  const { logout, hasJWT } = useAuthSlice();
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
    }
  }, [hasError, navigate, hasJWT, logout]);

  return <Outlet />;
};
