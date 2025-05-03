import { apiClient } from "@/shared/api";

export const getPlaces = async () => await apiClient.GET("/api/places/");
