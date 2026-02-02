import { useNavigate } from "react-router";

import { useAuthSlice } from "@/app/providers";
import { useOrderStore } from "@/entities/order";
import { checkPermission } from "@/shared/lib/RBAC";
import { Button } from "@/shared/ui/button";

import { isEventPassed } from "../lib/eventPassed";
import { Redeem } from "./Redeem";
import { ShowTicket } from "./ShowTicket";

import type { Event } from "@/entities/event";
import type { User } from "@/entities/user";

type TicketProps = {
  user: User;
  event: Event;
};

export const Ticket: React.FC<TicketProps> = ({ user, event }) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthSlice();
  const { setTicketOrder } = useOrderStore();

  if (event.status !== "approved") return null;

  const tickets = user.tickets.filter((ticket) => ticket.eventId === event.id);
  const hasPassed = isEventPassed(event.startDateTimestamp, event.daysAmount);
  const isCreator = user.address === event.creator.address;

  function handleGetTicketClick() {
    if (!authUser) return;

    // Check if user has socials
    if (authUser.socials.length === 0) {
      navigate("/socials");
      return;
    }

    // Set the order with multi-ticket support
    setTicketOrder({
      eventId: event.id,
      eventTitle: event.title,
      ticketPrice: event.ticketPrice,
      totalTickets: 1,
      allocations: [],
    });

    // Navigate directly to purchase page
    navigate("/purchase");
  }

  if (checkPermission(user.roles, "ticket:redeem"))
    return <Redeem eventId={event.id} />;
  if (isCreator) return null;

  return (
    <>
      {tickets.length > 0 ? (
        <ShowTicket hasPassed={hasPassed} tickets={tickets} event={event} />
      ) : (
        <Button
          className="w-full"
          disabled={hasPassed}
          onClick={handleGetTicketClick}
        >
          Get ticket
        </Button>
      )}
    </>
  );
};
