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

    // Set the order without category (will be selected on purchase page)
    setTicketOrder({
      eventId: event.id,
      eventTitle: event.title,
      ticketPrice: event.ticketPrice,
    });

    // Navigate directly to purchase page
    navigate("/purchase");
  }

  if (checkPermission(user.role, "ticket:redeem"))
    return <Redeem eventId={event.id} />;
  if (isCreator) return null;

  return (
    <>
      {tickets.length > 0 ? (
        <ShowTicket hasPassed={hasPassed} tickets={tickets} />
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
