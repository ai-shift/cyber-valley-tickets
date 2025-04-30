import { apiClient } from "@/shared/api";

export const getEvents = async () => await apiClient.GET("/api/events/");
