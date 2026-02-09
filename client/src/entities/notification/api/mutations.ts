import { apiClient } from "@/shared/api";

export const readNotification = async (id: number) =>
  // Use explicit URL construction to avoid OpenAPI spec mismatch
  // The spec uses notificationId (camelCase) but URL template uses {notification_id} (snake_case)
  await apiClient.POST(
    `/api/notifications/seen/${id}/` as "/api/notifications/seen/{notification_id}/",
    {
      params: {
        path: { notificationId: `${id}` },
      },
    },
  );

export const readAllNotifications = async () =>
  await apiClient.POST("/api/notifications/seen-all/");
