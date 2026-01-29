import { apiClient } from "@/shared/api";

export const getEvents = async (search?: string) =>
  await apiClient.GET("/api/events/", {
    params: {
      query: search ? { search } : undefined,
    },
  });

export const getDetailEvent = async (id: number) =>
  await apiClient.GET("/api/events/{id}/", {
    params: {
      path: {
        id,
      },
    },
  });
