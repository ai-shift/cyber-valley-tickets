import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";

import { useOrderStore } from "@/entities/order";
import { useNavigate } from "react-router";

import { Button } from "@/shared/ui/button";
type TicketProps = {
  user: User;
  event: Event;
};

export const Ticket: React.FC<TicketProps> = ({ user, event }) => {
  const navigate = useNavigate();
  const { clearOrder, setTicketOrder } = useOrderStore();

  const haveTicket = user.tickets.find((ticket) => ticket.eventId === event.id);

  function initOrder() {
    clearOrder();
    setTicketOrder(event.id);
    navigate("/socials");
  }

  if (!haveTicket) return <Button onClick={initOrder}>Attend</Button>;
  if (haveTicket) return <Button>Show ticket</Button>;
};
