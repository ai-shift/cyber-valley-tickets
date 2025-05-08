import { apiClient } from "@/shared/api";

export const readNotification = async (id: number) =>
  await apiClient.POST("/api/notifications/seen/{notification_id}/", {
    params: {
      // @ts-ignore: TS2561
      path: { notification_id: `${id}` },
    },
  });
