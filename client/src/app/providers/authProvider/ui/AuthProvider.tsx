import type React from "react";
import { refresh } from "../api/refresh";

import { client, cvlandChain, wallets } from "@/shared/lib/web3";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useAutoConnect } from "thirdweb/react";
import { useRefreshSlice } from "../model/refreshSlice";

export const AuthProvider: React.FC = () => {
  const navigate = useNavigate();
  //TODO: get mss from env
  const { isError, isLoading } = useQuery({
    queryFn: refresh,
    queryKey: ["refresh"],
    staleTime: 0,
    gcTime: 1000 * 10,
    refetchInterval: 1000 * 10,
    refetchOnWindowFocus: true,
  });

  const hasError = !isLoading && isError;
  const { setHasJWT, hasJWT } = useRefreshSlice();
  const { accountIsLoading } = useAutoConnect({
    client,
    wallets,
    onConnect: (connecting) => console.log("onConnect", connecting),
    timeout: 5000,
  });

  useEffect(() => {
    if (!hasJWT) {
      navigate("/login");
    }

    if (hasError) {
      setHasJWT(false);
      navigate("/login");
    }
  }, [hasError, navigate, hasJWT, setHasJWT]);

  return <Outlet />;
};
