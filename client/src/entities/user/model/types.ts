import type { components } from "@/shared/api";
import type { Role } from "@/shared/lib/RBAC";

// User type with roles array (single role field removed from API)
export type User = {
  address: string;
  roles: Role[];
  tickets: components["schemas"]["Ticket"][];
  socials: components["schemas"]["Social"][];
  profileManagerBps: number;
};

export type NetworkEnum = components["schemas"]["NetworkEnum"];
export type Socials = components["schemas"]["CurrentUser"]["socials"][0];
