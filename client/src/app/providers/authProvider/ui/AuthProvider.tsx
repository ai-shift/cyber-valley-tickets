import type React from "react";
import { refresh } from "../api/refresh";

import { useNavigate, Outlet } from "react-router";
import { useRefreshSlice } from "../model/refreshSlice";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export const AuthProvider: React.FC = () => {
  const navigate = useNavigate();
  //TODO: get mss from env
  const { isError, isLoading } = useQuery({
    queryFn: refresh,
    queryKey: ["refresh"],
    staleTime: 1000 * 60 * 4,
    gcTime: 1000 * 60 * 4,
    refetchInterval: 1000 * 60 * 4,
  });

  const hasError = !isLoading && isError;
  const { setHasJWT, hasJWT } = useRefreshSlice();

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
