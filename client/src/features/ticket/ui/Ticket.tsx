import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";

import { useOrderStore } from "@/entities/order";
import { useNavigate } from "react-router";

import { Button } from "@/shared/ui/button";
import { eventPassed } from "../lib/eventPassed";
import { ShowTicket } from "./ShowTicket";
import { Redeem } from "./Redeem";
type TicketProps = {
  user: User;
  event: Event;
};

export const Ticket: React.FC<TicketProps> = ({ user, event }) => {
  const navigate = useNavigate();
  const { setTicketOrder } = useOrderStore();

  const ticket = user.tickets.find((ticket) => ticket.eventId === event.id);
  const isOld = eventPassed(event.startDateTimestamp / 1000, event.daysAmount);

  function initOrder() {
    setTicketOrder(event.id);
    navigate("/socials");
  }

  if (user.role === "master" || user.role === "staff") return <Redeem />;
  return (
    <div>
      {isOld && <p>Event is already over</p>}
      {ticket ? (
        <ShowTicket isOld={isOld} ticket={ticket} />
      ) : (
        <Button disabled={isOld} onClick={initOrder}>
          Attend
        </Button>
      )}
    </div>
  );
};
