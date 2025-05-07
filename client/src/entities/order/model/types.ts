import type { EventDto } from "@/entities/event/@x/order";

export type Socials = {
  type: "telegram" | "instagram" | "discord" | "whatsapp" | "";
  contactInfo: string;
};

interface BaseOrder {
  type: "create_event" | "buy_ticket";
  socials?: Socials;
}

interface EventOrder extends BaseOrder {
  type: "create_event";
  event: EventDto;
  ticket?: never;
}

interface TicketOrder extends BaseOrder {
  type: "buy_ticket";
  event?: never;
  ticket: OrderTicket;
}

export interface OrderTicket {
  eventId: number;
  eventTitle: string;
  ticketPrice: number;
}

export type Order = EventOrder | TicketOrder;
