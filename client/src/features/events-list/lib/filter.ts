import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";

export const filter = (event: Event, user: User) => {
  if (user.role === "master") return true;
  if (event.creator.address === user.address) return true;
  return event.status === "approved";
};
