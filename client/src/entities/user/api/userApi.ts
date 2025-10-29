import { apiClient } from "@/shared/api";
import type { Socials } from "../model/types";

export const getCurrentUser = async () =>
  await apiClient.GET("/api/users/current/");

export const getUsersStaff = async () =>
  await apiClient.GET("/api/users/staff/");

export const getUsersLocalproviders = async () =>
  await apiClient.GET("/api/users/local_providers/");

export const getUsersVerifiedShamans = async () =>
  await apiClient.GET("/api/users/verified_shamans/");

export const upsertUserSocials = async (socials: Socials) =>
  await apiClient.POST("/api/users/socials", {
    body: {
      ...socials,
    },
  });
