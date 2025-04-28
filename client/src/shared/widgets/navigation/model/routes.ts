import type { Route } from "./link";

export const routes: Route[] = [
  {
    path: "/",
    title: "Home",
  },
  {
    path: "/events",
    title: "/events",
  },
  {
    path: "/profile",
    title: "Profile",
    restrictedTo: ["master", "creator", "staff"],
  },
  {
    path: "/events/create",
    title: "Create event",
    restrictedTo: ["master", "staff", "creator"],
  },
];
