import { apiClient } from "@/shared/api";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useRefreshSlice } from "../../refreshSlice";

export const useRefreshToken = () => {
  const navigate = useNavigate();
  const [tokenRefreshing, setTokenRefreshing] = useState(false);
  const { hasJWT, setHasJWT } = useRefreshSlice();

  const refreshToken = async (): Promise<void> => {
    if (!tokenRefreshing && hasJWT) {
      try {
        setTokenRefreshing(true);
        await apiClient.GET("/api/auth/refresh");
        setHasJWT(true);
      } catch {
        setHasJWT(false);
        navigate("/login");
      } finally {
        setTokenRefreshing(false);
        console.log("refresh");
      }
    }
  };

  return { refreshToken };
};
