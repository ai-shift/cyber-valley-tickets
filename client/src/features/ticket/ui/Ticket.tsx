import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";

import { useOrderStore } from "@/entities/order";
import { useNavigate } from "react-router";

import { Button } from "@/shared/ui/button";
import { isEventPassed } from "../lib/eventPassed";
import { Redeem } from "./Redeem";
import { ShowTicket } from "./ShowTicket";
type TicketProps = {
  user: User;
  event: Event;
};

export const Ticket: React.FC<TicketProps> = ({ user, event }) => {
  const navigate = useNavigate();
  const { setTicketOrder } = useOrderStore();

  if (event.status !== "approved") return null;

  const ticket = user.tickets.find((ticket) => ticket.eventId === event.id);
  const hasPassed = isEventPassed(event.startDateTimestamp, event.daysAmount);

  function initOrder() {
    setTicketOrder({
      eventId: event.id,
      eventTitle: event.title,
      ticketPrice: event.ticketPrice,
    });
    navigate("/socials");
  }

  if (user.role === "master" || user.role === "staff") return <Redeem />;
  return (
    <div>
      {hasPassed && <p>Event is already over</p>}
      {ticket ? (
        <ShowTicket hasPassed={hasPassed} ticket={ticket} />
      ) : (
        <Button disabled={hasPassed} onClick={initOrder}>
          Attend
        </Button>
      )}
    </div>
  );
};
