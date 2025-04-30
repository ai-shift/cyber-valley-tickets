import type { Route } from "./link";

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
    path: "/profile",
    title: "Profile",
  },
  {
    path: "/events/create",
    title: "Create event",
    restrictedTo: ["master", "staff", "creator"],
  },
];
