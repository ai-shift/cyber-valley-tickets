import { apiClient } from "@/shared/api";

export const getCurrentUser = async () =>
  await apiClient.GET("/api/users/current/");

export const getUsersStaff = async () =>
  await apiClient.GET("/api/users/staff/");

//FIXME: Pass an actual URL to local providers retrieval
export const getUsersLocalproviders = async () =>
  await apiClient.GET("/api/users/staff/");
