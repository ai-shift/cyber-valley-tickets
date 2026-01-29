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

export const getLifetimeRevenue = async (eventId: number) =>
  await apiClient.GET("/api/events/{event_id}/lifetime_revenue", {
    params: {
      path: {
        event_id: eventId,
      },
    },
  });
