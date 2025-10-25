import type { components } from "@/shared/api";

export type User = components["schemas"]["CurrentUser"];
export type NetworkEnum = components["schemas"]["NetworkEnum"];
export type Socials = components["schemas"]["CurrentUser"]["socials"][0];
