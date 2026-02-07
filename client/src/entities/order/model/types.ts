import type { EventDto } from "@/entities/event/@x/order";
import type { EventDtoWithId } from "@/entities/event/model/types";

export interface TicketAllocation {
  categoryId: number;
  categoryName: string;
  discount: number;
  count: number;
  finalPricePerTicket: number;
}

export interface OrderTicket {
  eventId: number;
  eventTitle: string;
  ticketPrice: number;
  totalTickets: number;
  allocations: TicketAllocation[];
  // Legacy single-ticket fields kept for backward compatibility
  categoryId?: number;
  categoryName?: string;
  discount?: number;
  finalPrice?: number;
}

interface BaseOrder {
  type: "create_event" | "buy_ticket" | "update_event";
}

interface UpdateEventOrder extends BaseOrder {
  type: "update_event";
  event: EventDtoWithId;
  ticket?: never;
}

interface CreateEventOrder extends BaseOrder {
  type: "create_event";
  event: EventDto;
  placeDepositSize: number;
  ticket?: never;
}

interface TicketOrder extends BaseOrder {
  type: "buy_ticket";
  event?: never;
  ticket: OrderTicket;
}

export type Order = CreateEventOrder | TicketOrder | UpdateEventOrder;
