import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";

export const uniteFilter = (event: Event, user: User) => {
  if (user.role === "master") return true;
  if (event.creator.address === user.address) return true;
  return event.status === "approved";
};

export const myEventsFilter = (event: Event, user: User) => {
  if (user.role === "master") {
    return event.status === "submitted";
  }
  return (
    !!user.tickets.find((ticket) => ticket.eventId === event.id) ||
    event.creator.address === user.address
  );
};
