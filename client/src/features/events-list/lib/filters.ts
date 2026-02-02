import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";
import { checkPermission } from "@/shared/lib/RBAC";
import { getUnixTime } from "date-fns";

export const uniteFilter = (event: Event, user: User) => {
  const isStaff = checkPermission(
    user.roles,
    "event:edit",
    "event:accept/decline",
  );
  if (isStaff && event.creator.address === user.address) return true;
  if (event.status !== "approved") return false;
  if (!isStaff) return !isEventPast(event);
  return true;
};

export type Chronology = "past" | "current" | "upcoming";
export const myEventsFilter = (
  event: Event,
  user: User,
  option: Chronology,
) => {
  const mapper: { [key in Chronology]: (event: Event) => boolean } = {
    past: isEventPast,
    current: isCurrent,
    upcoming: isUpcoming(user),
  };

  if (checkPermission(user.roles, "event:edit", "event:accept/decline")) {
    return mapper[option](event);
  }

  return (
    (user.tickets.find((ticket) => ticket.eventId === event.id) ||
      event.creator.address === user.address) &&
    mapper[option](event)
  );
};

const getEventEndTimestamp = (event: Event) => {
  return event.startDateTimestamp + event.daysAmount * 24 * 60 * 60;
};

export const isEventPast = (event: Event) => {
  return getUnixTime(new Date()) > getEventEndTimestamp(event);
};

const isUpcoming = (user: User) => (event: Event) => {
  if (isCurrent(event) || isEventPast(event)) {
    return false;
  }
  if (event.status === "approved") {
    return true;
  }
  if (
    event.status === "submitted" &&
    (checkPermission(user.roles, "event:edit", "event:accept/decline") ||
      user.address === event.creator.address)
  ) {
    return true;
  }
  return false;
};

const isCurrent = (event: Event) => {
  const now = getUnixTime(new Date());
  return now >= event.startDateTimestamp && now <= getEventEndTimestamp(event);
};

export const upcomingFilter = (event: Event) => {
  return event.status === "approved";
};
