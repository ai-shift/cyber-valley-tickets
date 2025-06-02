import { create } from "zustand";
import { persist } from "zustand/middleware";

export type StaffListState = {
  removedStaff: string[];
  optimisitcRemoveStaff: (adr: string) => void;
};

export const useStaffListState = create<StaffListState>()(
  persist(
    (set, get) => ({
      removedStaff: [],
      optimisitcRemoveStaff: (adr: string) =>
        set({
          ...get(),
          removedStaff: [...get().removedStaff, adr],
        }),
    }),
    { name: "manageStaff" },
  ),
);
