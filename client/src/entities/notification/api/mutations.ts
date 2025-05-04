import { apiClient } from "@/shared/api";

// TODO: Use int instead of string
export const readNotification = async (id: string) =>
  await apiClient.POST("/api/notifications/{id}/seen/", {
    params: { path: { id } },
  });
