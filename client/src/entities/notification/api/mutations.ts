import { apiClient } from "@/shared/api";

export const readNotification = async (id: number) =>
  await apiClient.POST("/api/notifications/{id}/seen/", {
    params: { path: { id: `${id}` } },
  });
