import { apiClient } from "@/shared/api";

export const verify = async () => await apiClient.GET("/api/auth/verify");
