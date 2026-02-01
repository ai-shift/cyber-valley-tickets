import { apiClient } from "@/shared/api";

export const getPlaceById = async (id: number) =>
  await apiClient.GET("/api/places/{id}/", {
    params: {
      path: { id },
    },
  });
