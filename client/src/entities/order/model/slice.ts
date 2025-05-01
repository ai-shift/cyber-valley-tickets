import type { Order } from "./types";
import type { Event } from "@/entities/event/@x/order";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface OrderState {
  order: Order | null;
  setEventOrder: (order: Event) => void;
  setTicketOrder: (order: string) => void;
  setSocialsToTicketOrder: (social: string) => void;
  clearOrder: () => void;
}

export const useOrderStore = create<OrderState>()(
  devtools((set) => ({
    order: null,
    setEventOrder: (event) =>
      set(
        {
          order: {
            type: "create_event",
            event: event,
          },
        },
        undefined,
        "order/setEventOrder",
      ),
    setTicketOrder: (eventId) =>
      set(
        {
          order: {
            type: "buy_ticket",
            ticket: {
              eventId: eventId,
            },
          },
        },
        undefined,
        "order/setTicketOrder",
      ),
    setSocialsToTicketOrder: (social) =>
      set(
        (state) => {
          if (state.order?.type !== "buy_ticket") return state;
          return {
            ...state,
            ticket: {
              eventId: state.order.ticket.eventId,
              social,
            },
          };
        },
        undefined,
        "order/setTicketSocials",
      ),
    clearOrder: () => set({ order: null }, undefined, "order/clearOrder"),
  })),
);
