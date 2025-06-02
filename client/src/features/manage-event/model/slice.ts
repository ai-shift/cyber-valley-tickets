import type { Event, EventStatus } from "@/entities/event";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ManageEventState = {
  optimisticEventsStatuses: Record<Event["id"], EventStatus>;
  optimisticSetEventStatus: (id: Event["id"], status: EventStatus) => void;
};

export const useManageEventState = create<ManageEventState>()(
  persist(
    (set, get) => ({
      optimisticEventsStatuses: {},
      optimisticSetEventStatus: (id: Event["id"], status: EventStatus) =>
        set({
          optimisticEventsStatuses: {
            ...get().optimisticEventsStatuses,
            ...{ [id]: status },
          },
        }),
    }),
    { name: "optimisticStaffState" },
  ),
);
