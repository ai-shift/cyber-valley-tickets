import type { Role } from "@/shared/lib/RBAC";

export type Route = {
  path: string;
  title: string;
  restrictedTo?: Role[];
};

export const routes: Route[] = [
  {
    path: "/",
    title: "Home",
  },
  {
    path: "/manage",
    title: "Manage",
    restrictedTo: ["master"],
  },
  {
    path: "/events/create",
    title: "Create event",
  },
  {
    path: "/account",
    title: "Account",
  },
];
