import { create } from "zustand";
import { persist } from "zustand/middleware";

export type StaffState = {
  removedStaff: string[];
  optimisticRemoveStaff: (adr: string) => void;
  optimisticAddStaff: (adr: string) => void;
};

export const useStaffState = create<StaffState>()(
  persist(
    (set, get) => ({
      removedStaff: [],
      optimisticRemoveStaff: (adr: string) =>
        set({
          removedStaff: [...get().removedStaff, adr.toLowerCase()],
        }),
      optimisticAddStaff: (adr: string) =>
        set({
          removedStaff: get().removedStaff.filter(
            (staffAdr) => staffAdr !== adr.toLowerCase(),
          ),
        }),
    }),
    { name: "optimisticStaffState" },
  ),
);
