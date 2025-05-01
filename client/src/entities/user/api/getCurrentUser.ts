import { apiClient } from "@/shared/api";

export const getCurrentUser = async () =>
  await apiClient.GET("/api/users/current/");
