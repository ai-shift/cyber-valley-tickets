import type { Role } from "@/shared/lib/RBAC";

export type Route = {
  path: string;
  title: string;
  icon?: string;
  restrictedTo?: Role[];
};

export const routes: Route[] = [
  {
    path: "/",
    title: "Events",
    icon: "home",
  },
  {
    path: "/map",
    title: "Map",
    icon: "event place_1",
  },
  {
    path: "/events/create",
    title: "New",
    icon: "create",
  },
  {
    path: "/notifications",
    title: "Notifs",
    icon: "nnotification_3",
    restrictedTo: ["customer", "verifiedshaman", "localprovider", "master"],
  },
  {
    path: "/account",
    title: "Account",
    icon: "account",
  },
  {
    path: "/manage",
    title: "Manage",
    icon: "manage",
    restrictedTo: ["master", "localprovider", "verifiedshaman"],
  },
];
