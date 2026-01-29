import { apiClient } from "@/shared/api";

export const getNotifications = async (search?: string) =>
  await apiClient.GET("/api/notifications/", {
    params: {
      query: search ? { search } : undefined,
    },
  });
