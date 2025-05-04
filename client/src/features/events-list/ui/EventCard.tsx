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

  // TODO: Check if event was not closed or cancells (i.e. approved)
  const hasTicket = user.tickets.find((ticket) => ticket.eventId === event.id);
  const isMaster = user.role === "master";

  return (
    <article className=" border-2 border-red-500">
      <Link to={`/events/${event.id}`}>
        <div className=" p-5">
          <h2>{title}</h2>
          <p>{formatTimestamp(startDateTimestamp)}</p>
          <p>{place.title}</p>
          <p>{description}</p>
          {isMaster ? (
            <StatusBage status={status} />
          ) : (
            <div className="flex justify-between items-center">
              <p>{ticketPrice}</p>
              {hasTicket ? (
                <Button> Show ticket</Button>
              ) : (
                <Button> Attend</Button>
              )}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
};
