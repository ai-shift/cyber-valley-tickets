import type { Event } from "@/entities/event/@x/order";

interface BaseOrder {
  type: "create_event" | "buy_ticket";
}

interface EventOrder extends BaseOrder {
  type: "create_event";
  event: Event;
  eventId?: never;
}

interface TicketOrder extends BaseOrder {
  type: "buy_ticket";
  event?: never;
  eventId: string;
}

export type Order = EventOrder | TicketOrder;
