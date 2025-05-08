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
    path: "/events/create",
    title: "Create",
  },
  {
    path: "/account",
    title: "Account",
  },
  {
    path: "/manage",
    title: "Manage",
    restrictedTo: ["master"],
  },
];
