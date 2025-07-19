import type { Event } from "@/entities/event";

import { formatTimestamp } from "@/shared/lib/formatTimestamp";
import { Link } from "react-router";
import { StatusBage } from "./StatusBage";
import { getTimeString } from "@/shared/lib/getTimeString";

type EventCardProps = {
  event: Event;
};

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const {
    place,
    startDateTimestamp,
    description,
    title,
    status,
    imageUrl,
    ticketsBought,
  } = event;

  return (
    <article className="relative">
      <div className="absolute top-3 right-2 ">
        {status === "approved" ? (
          <p className="px-3 py-1 text-primary text-md font-semibold rounded-full self-start bg-black">
            Tickets available: {place.maxTickets - (ticketsBought || 0)}
          </p>
        ) : (
          <StatusBage status={status} />
        )}
      </div>
      <Link className="flex flex-col h-full" to={`/events/${event.id}`}>
        <img
          className="aspect-video object-cover"
          src={imageUrl ?? "event_default.jpg"}
          alt={title}
        />
        <div className="flex justify-between items-center">
          <div className="py-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-white line-clamp-1">{description}</p>
            <div className="grid grid-cols-[auto_1fr] items-center gap-y-1 gap-x-3 py-2">
              <img
                className="h-4"
                src="/icons/calendar.svg"
                alt="calendar icon"
              />
              <p className="text-sm text-accent font-light">
                {formatTimestamp(startDateTimestamp)} ({getTimeString(startDateTimestamp)})
              </p>
              <img
                className="h-4"
                src="/icons/event place_2.svg"
                alt="calendar icon"
              />
              <p className="text-sm text-accent font-light">{place.title}</p>
            </div>
          </div>
          <img className="h-10" src="/icons/chevrone_right.svg" alt="" />
        </div>
      </Link>
    </article>
  );
};
