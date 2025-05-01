import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";
import { Button } from "@/shared/ui/button";

type TicketProps = {
  user: User;
  event: Event;
};

/**
 * Cases:
 * 1. No ticket
 * 2. Have ticket
 * 3. Ticket redeemed
 */

export const Ticket: React.FC<TicketProps> = ({ user, event }) => {
  const haveTicket = user.tickets.find((ticket) => ticket.eventId === event.id);

  if (!haveTicket) return <Button>Attend event</Button>;
  if (haveTicket) return <Button>Show ticket</Button>;
};
