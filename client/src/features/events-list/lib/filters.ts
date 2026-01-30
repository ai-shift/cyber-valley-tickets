import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";
import { checkPermission } from "@/shared/lib/RBAC";
import { getUnixTime } from "date-fns";

export const uniteFilter = (event: Event, user: User) => {
  if (checkPermission(user.role, "event:edit", "event:accept/decline"))
  if (event.creator.address === user.address) return true;
  return event.status === "approved";
};

export type Chronology = "past" | "current" | "upcoming";
export const myEventsFilter = (
  event: Event,
  user: User,
  option: Chronology,
) => {
  const mapper: { [key in Chronology]: (event: Event) => boolean } = {
    past: isPast,
    current: isCurrent,
    upcoming: isUpcoming(user),
  };

  if (checkPermission(user.role, "event:edit", "event:accept/decline")) {
    return mapper[option](event);
  }

  return (
    (user.tickets.find((ticket) => ticket.eventId === event.id) ||
      event.creator.address === user.address) &&
    mapper[option](event)
  );
};

const isPast = (event: Event) => {
  return event.status !== "submitted" && event.status !== "approved";
};

const isUpcoming = (user: User) => (event: Event) => {
  if (isCurrent(event)) {
    return false;
  }
  if (event.status === "approved") {
    return true;
  }
  if (
    event.status === "submitted" &&
    (checkPermission(user.role, "event:edit", "event:accept/decline") || user.address === event.creator.address)
  ) {
    return true;
  }
  return false;
};

const isCurrent = (event: Event) => {
  return !isPast(event) && getUnixTime(new Date()) >= event.startDateTimestamp;
};

export const upcomingFilter = (event: Event) => {
  return event.status === "approved";
};
