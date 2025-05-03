import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";

import { Button } from "@/shared/ui/button";
import { Link } from "react-router";
import { StatusBage } from "./StatusBage";
import { formatTimestamp } from "@/shared/lib/formatTimestamp";

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
