// TODO: Investigate thirdweb/react/web/ui/ConnectWallet/screens/SignatureScreen.tsx
// to find a way of only signing in message on account switch instead of
// complete login flow
import type { User } from "@/entities/user";
import { apiClient } from "@/shared/api";
import { client, wallets } from "@/shared/lib/web3";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type React from "react";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useActiveWallet, useAutoConnect } from "thirdweb/react";
import { refresh } from "../api/refresh";
import { useAuthSlice } from "../model/authSlice";

export const AuthProvider: React.FC = () => {
  const navigate = useNavigate();
  const { login, logout, hasJWT } = useAuthSlice();
  const [walletChanged, setWalletChanged] = useState(false);
  const { isError, isLoading } = useQuery({
    queryFn: refresh,
    queryKey: ["refresh"],
    enabled: hasJWT,
    refetchInterval: 1000 * 60 * 3,
    refetchOnWindowFocus: true,
  });

  const wallet = useActiveWallet();
  useEffect(() => {
    if (wallet == null) {
      return;
    }
    wallet.subscribe("accountChanged", () => {
      console.log("account changed");
      setWalletChanged(true);
    });
  }, [wallet]);

  const hasError = !isLoading && isError;
  useAutoConnect({
    client,
    wallets,
    onConnect: (connecting) => console.log("onConnect", connecting),
    timeout: 5000,
  });

  useEffect(() => {
    if (hasError || walletChanged) {
      apiClient.GET("/api/auth/logout").finally(() => {
        logout();
        navigate("/login");
      });
    } else {
      apiClient.GET("/api/users/current/").then((resp) => {
        login(resp.data as User);
        setWalletChanged(false);
      });
    }
  }, [hasError, navigate, hasJWT, logout, walletChanged]);

  return <Outlet />;
};
