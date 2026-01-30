import type { View } from "@/shared/lib/RBAC";

export type Route = {
  path: string;
  title: string;
  icon?: string;
  view?: View;
  requireLogin?: boolean;
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
    path: "/notifications",
    title: "Notifs",
    icon: "nnotification_3",
    requireLogin: true,
  },
  {
    path: "/account",
    title: "Account",
    icon: "account",
  },
];
