import type { EventDto } from "@/entities/event/@x/order";

interface BaseOrder {
  type: "create_event" | "buy_ticket";
}

interface EventOrder extends BaseOrder {
  type: "create_event";
  event: EventDto;
  ticket?: never;
}

interface TicketOrder extends BaseOrder {
  type: "buy_ticket";
  event?: never;
  ticket: {
    eventId: number;
    socials?: string;
  };
}

export type Order = EventOrder | TicketOrder;
