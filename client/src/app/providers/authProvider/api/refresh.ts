import { apiClient } from "@/shared/api";

export const refresh = () => apiClient.GET("/api/auth/refresh");
