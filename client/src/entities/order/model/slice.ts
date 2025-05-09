import type { EventDto, EventDtoWithId } from "@/entities/event/@x/order";
import type { Order, OrderTicket, Socials } from "./types";

import type { EventDtoWithId } from "@/entities/event/model/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface OrderState {
  order: Order | null;
  setEventOrder: (event: EventDto | EventDtoWithId) => void;
  setTicketOrder: (order: OrderTicket) => void;
  setSocials: (social: Socials) => void;
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
