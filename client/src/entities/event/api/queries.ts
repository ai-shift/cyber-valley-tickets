import { apiClient } from "@/shared/api";

export const getEvents = async () => await apiClient.GET("/api/events/");

export const getDetailEvent = async (id: number) =>
  await apiClient.GET("/api/events/{id}/", {
    params: {
      path: {
        id,
      },
    },
  });
