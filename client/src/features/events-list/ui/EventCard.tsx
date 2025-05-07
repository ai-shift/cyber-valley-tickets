import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";

import { formatTimestamp } from "@/shared/lib/formatTimestamp";
import { Button } from "@/shared/ui/button";
import { Link } from "react-router";
import { StatusBage } from "./StatusBage";

type EventCardProps = {
  event: Event;
  user: User;
};

export const EventCard: React.FC<EventCardProps> = ({ event, user }) => {
  const { place, startDateTimestamp, description, title, ticketPrice, status } =
    event;

  const hasTicket = user.tickets.find((ticket) => ticket.eventId === event.id);
  const isMaster = user.role === "master";

  return (
    <article className="card border-primary/40">
      <Link className="flex flex-col h-full" to={`/events/${event.id}`}>
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <div className="flex items-center gap-3">
          <img className="h-4" src="/icons/calendar.svg" alt="calendar icon" />
          <p className="text-sm text-accent font-light">
            {formatTimestamp(startDateTimestamp)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <img
            className="h-4"
            src="/icons/event place_2.svg"
            alt="calendar icon"
          />
          <p className="text-sm text-accent font-light">{place.title}</p>
        </div>
        <p className="text-sm text-white mt-1 line-clamp-2 mb-2">
          {description}
        </p>
        {isMaster ? (
          <StatusBage status={status} />
        ) : (
          <div className="mt-auto flex justify-between items-center">
            <p className="text-primary text-sm">{ticketPrice} ₮</p>
            {hasTicket ? (
              <Button> Show ticket</Button>
            ) : (
              <Button>Attend</Button>
            )}
          </div>
        )}
      </Link>
    </article>
  );
};
