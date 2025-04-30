import type { Role } from "@/shared/lib/RBAC";

export type Route = {
  path: string;
  title: string;
  restrictedTo?: Role[];
};
