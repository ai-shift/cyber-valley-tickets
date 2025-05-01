import type { Order } from "./types";
import type { Event } from "@/entities/event/@x/order";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface OrderState {
  order: Order | null;
  setEventOrder: (order: Event) => void;
  setTicketOrder: (order: string) => void;
  clearOrder: () => void;
}

export const useOrderStore = create<OrderState, [["zustand/devtools", never]]>(
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
            eventId: eventId,
          },
        },
        undefined,
        "order/setTicketOrder",
      ),
    clearOrder: () => set({ order: null }, undefined, "order/clearOrder"),
  })),
);
