import { useState } from "react";
import { useNavigate } from "react-router";

import { ResultDialog } from "@/shared/ui/ResultDialog";
import { useActiveAccount } from "thirdweb/react";
import { useOrderStore } from "@/entities/order";
import { Button } from "@/shared/ui/button";
import { hasEnoughtTokens } from "@/shared/lib/web3";

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
  const [isOpen, setIsOpen] = useState(false);
  const { setTicketOrder } = useOrderStore();
  const account = useActiveAccount();

  if (event.status !== "approved") return null;

  const ticket = user.tickets.find((ticket) => ticket.eventId === event.id);
  const hasPassed = isEventPassed(event.startDateTimestamp, event.daysAmount);
  const isCreator = user.address === event.creator.address;

  async function initOrder() {
    if (account == null) throw new Error("Account isn't connected");
    const { enoughTokens } = await hasEnoughtTokens(
      account,
      BigInt(event.ticketPrice),
    );
    if (!enoughTokens) {
      setIsOpen(true);
      return;
    }
    setTicketOrder({
      eventId: event.id,
      eventTitle: event.title,
      ticketPrice: event.ticketPrice,
    });
    navigate("/purchase");
  }

  if (user.role === "master" || user.role === "staff")
    return <Redeem eventId={event.id} />;
  if (isCreator) return null;
  return (
    <>
      {ticket ? (
        <ShowTicket hasPassed={hasPassed} ticket={ticket} />
      ) : (
        <Button className="w-full" disabled={hasPassed} onClick={initOrder}>
          Get ticket
        </Button>
      )}
      <ResultDialog
        open={isOpen}
        setOpen={setIsOpen}
        title="Not enought tokens"
        body=""
        onConfirm={() => {
          setIsOpen(false);
        }}
        failure={true}
      />
    </>
  );
};
