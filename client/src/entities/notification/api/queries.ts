import { apiClient } from "@/shared/api";

export const getNotifications = async () =>
  await apiClient.GET("/api/notifications/");
