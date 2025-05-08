import type { EventDto } from "@/entities/event/@x/order";
import type { EventDtoWithId } from "@/entities/event/model/types";

export type Socials = {
  type: string;
  contactInfo: string;
};

interface BaseOrder {
  type: "create_event" | "buy_ticket" | "update_event";
  socials?: Socials;
}

interface UpdateEventOrder extends BaseOrder {
  type: "update_event";
  event: EventDtoWithId;
  ticket?: never;
}

interface CreateEventOrder extends BaseOrder {
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

export type Order = CreateEventOrder | TicketOrder | UpdateEventOrder;
