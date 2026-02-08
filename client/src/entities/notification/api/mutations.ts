import { apiClient } from "@/shared/api";

export const readNotification = async (id: number) =>
  await apiClient.POST("/api/notifications/seen/{notification_id}/", {
    params: {
      path: { notificationId: `${id}` },
    },
  });

export const readAllNotifications = async () =>
  await apiClient.POST("/api/notifications/seen-all/");
