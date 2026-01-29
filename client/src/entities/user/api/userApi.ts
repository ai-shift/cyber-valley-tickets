import { apiClient } from "@/shared/api";
import type { Socials } from "../model/types";

export const getCurrentUser = async () =>
  await apiClient.GET("/api/users/current/");

export const getUsersStaff = async (search?: string) =>
  await apiClient.GET("/api/users/staff/", {
    params: {
      query: search ? { search } : undefined,
    },
  });

export const getUsersLocalproviders = async (search?: string) =>
  await apiClient.GET("/api/users/local_providers/", {
    params: {
      query: search ? { search } : undefined,
    },
  });

export const getUsersVerifiedShamans = async (search?: string) =>
  await apiClient.GET("/api/users/verified_shamans/", {
    params: {
      query: search ? { search } : undefined,
    },
  });

export const upsertUserSocials = async (socials: Socials) =>
  await apiClient.POST("/api/users/socials", {
    body: {
      ...socials,
    },
  });
