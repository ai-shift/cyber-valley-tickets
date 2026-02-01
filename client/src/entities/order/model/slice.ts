import type { EventDto, EventDtoWithId } from "@/entities/event/@x/order";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Order, OrderTicket, TicketAllocation } from "./types";

interface OrderState {
  order: Order | null;
  setEventOrder: (event: EventDto | EventDtoWithId) => void;
  setTicketOrder: (order: OrderTicket) => void;
  updateTicketAllocations: (allocations: TicketAllocation[]) => void;
  updateTotalTickets: (total: number) => void;
}

const initialState = { order: null };

export const useOrderStore = create<OrderState>()(
  devtools((set) => ({
    initialState,
    setEventOrder: (event) =>
      "id" in event
        ? set(
            {
              ...initialState,
              order: {
                type: "update_event",
                event: event,
              },
            },
            undefined,
            "order/setEventOrder",
          )
        : set(
            {
              ...initialState,
              order: {
                type: "create_event",
                event: event,
              },
            },
            undefined,
            "order/setEventOrder",
          ),
    setTicketOrder: (ticket: OrderTicket) =>
      set(
        {
          ...initialState,
          order: {
            type: "buy_ticket",
            ticket,
          },
        },
        undefined,
        "order/setTicketOrder",
      ),
    updateTicketAllocations: (allocations: TicketAllocation[]) =>
      set(
        (state) => {
          if (state.order?.type !== "buy_ticket") return state;
          return {
            order: {
              ...state.order,
              ticket: {
                ...state.order.ticket,
                allocations,
              },
            },
          };
        },
        undefined,
        "order/updateTicketAllocations",
      ),
    updateTotalTickets: (total: number) =>
      set(
        (state) => {
          if (state.order?.type !== "buy_ticket") return state;
          return {
            order: {
              ...state.order,
              ticket: {
                ...state.order.ticket,
                totalTickets: total,
              },
            },
          };
        },
        undefined,
        "order/updateTotalTickets",
      ),
  })),
);
