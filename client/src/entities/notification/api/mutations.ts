import { apiClient } from "@/shared/api";

export const readNotification = async (id: number) =>
  await apiClient.POST("/api/notifications/seen/{notification_id}/", {
    params: {
      // OpenAPI types use `notificationId` but our route template is `{notification_id}`.
      // Provide both to keep the runtime URL interpolation correct.
      path: { notificationId: `${id}`, notification_id: `${id}` },
    },
  });

export const readAllNotifications = async () =>
  await apiClient.POST("/api/notifications/seen-all/");
