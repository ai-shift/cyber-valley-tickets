import type { EventDto } from "@/entities/event/@x/order";
import type { Order, Socials } from "./types";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface OrderState {
  order: Order | null;
  setEventOrder: (order: EventDto) => void;
  setTicketOrder: (order: number) => void;
  setSocials: (social: Socials) => void;
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
    setSocials: (socials) =>
      set(
        (state) => ({
          order: state.order && { ...state.order, socials },
        }),
        undefined,
        "order/setTicketSocials",
      ),
  })),
);
