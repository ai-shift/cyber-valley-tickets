import { apiClient } from "@/shared/api";

export const getPlaces = async (search?: string) =>
  await apiClient.GET("/api/places/", {
    params: {
      query: search ? { search } : undefined,
    },
  });
