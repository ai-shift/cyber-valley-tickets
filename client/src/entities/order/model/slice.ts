import type { EventDto } from "@/entities/event/@x/order";
import type { Order } from "./types";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface OrderState {
  order: Order | null;
  setEventOrder: (order: EventDto) => void;
  setTicketOrder: (order: number) => void;
  setSocialsToTicketOrder: (social: string) => void;
}

const initialState = { order: null };

export const useOrderStore = create<OrderState>()(
  devtools((set) => ({
    initialState,
    setEventOrder: (event) =>
      set(
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
    setTicketOrder: (eventId) =>
      set(
        {
          ...initialState,
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
            order: {
              ...state.order,
              ticket: {
                ...state.order.ticket,
                social,
              },
            },
          };
        },
        undefined,
        "order/setTicketSocials",
      ),
  })),
);
