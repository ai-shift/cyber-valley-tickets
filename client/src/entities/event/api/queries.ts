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

export const getEventAttendees = async (eventId: number, search?: string) =>
  await apiClient.GET("/api/events/{id}/attendees/", {
    params: {
      path: {
        id: eventId,
      },
      query: search ? { search } : undefined,
    },
  });

export const getEventCategories = async (eventId: number) =>
  await apiClient.GET("/api/events/{event_id}/categories", {
    params: {
      path: {
        // OpenAPI types use `eventId` but our route template is `{event_id}`.
        // Provide both to keep the runtime URL interpolation correct.
        event_id: eventId,
        eventId,
      },
    } as any,
  });
