import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";

import { useOrderStore } from "@/entities/order";
import { useNavigate } from "react-router";

import { Button } from "@/shared/ui/button";
import { eventPassed } from "../lib/eventPassed";
type TicketProps = {
  user: User;
  event: Event;
};

export const Ticket: React.FC<TicketProps> = ({ user, event }) => {
  if (user.role === "master") return null;
  const navigate = useNavigate();
  const { setTicketOrder } = useOrderStore();

  const haveTicket = user.tickets.find((ticket) => ticket.eventId === event.id);
  const isOld = eventPassed(event.startDateTimestamp / 1000, event.daysAmount);

  function initOrder() {
    setTicketOrder(event.id);
    navigate("/socials");
  }

  // TODO: Add is redeemed when endpoint ready

  return (
    <div>
      {isOld && <p>Event is already over</p>}
      {haveTicket ? (
        <Button disabled={isOld}>Show ticket</Button>
      ) : (
        <Button disabled={isOld} onClick={initOrder}>
          Attend
        </Button>
      )}
    </div>
  );
};
