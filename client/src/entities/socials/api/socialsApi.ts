import { apiClient } from "@/shared/api";
import type { Socials } from "../model/types";

export const upsertSocials = async (socials: Socials) =>
  await apiClient.POST("/api/users/socials", {
    body: {
      ...socials,
    },
  });
