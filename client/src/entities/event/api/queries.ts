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

export const getTotalRevenue = async () =>
  await apiClient.GET("/api/events/total_revenue");

export const getEventAttendees = async (eventId: number) =>
  await apiClient.GET("/api/events/{id}/attendees/", {
    params: {
      path: {
        id: eventId,
      },
    },
  });

export const getEventCategories = async (eventId: number) =>
  await apiClient.GET("/api/events/{event_id}/categories", {
    params: {
      path: {
        event_id: eventId,
      },
    } as unknown as { path: { eventId: number } },
  });
