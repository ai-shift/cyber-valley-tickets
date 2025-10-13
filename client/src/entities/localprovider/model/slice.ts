import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LocalproviderState = {
  removedLocalprovider: string[];
  addedLocalprovider: string[];
  optimisticRemoveLocalprovider: (adr: string) => void;
  optimisticAddLocalprovider: (adr: string) => void;
};

export const useLocalproviderState = create<LocalproviderState>()(
  persist(
    (set, get) => ({
      removedLocalprovider: [],
      addedLocalprovider: [],
      optimisticRemoveLocalprovider: (adr: string) =>
        set({
          removedLocalprovider: [
            ...get().removedLocalprovider,
            adr.toLowerCase(),
          ],
          addedLocalprovider: get().addedLocalprovider.filter(
            (staffAdr) => staffAdr !== adr.toLowerCase(),
          ),
        }),
      optimisticAddLocalprovider: (adr: string) =>
        set({
          removedLocalprovider: get().removedLocalprovider.filter(
            (staffAdr) => staffAdr !== adr.toLowerCase(),
          ),
          addedLocalprovider: [...get().addedLocalprovider, adr.toLowerCase()],
        }),
    }),
    { name: "optimisticLocalproviderState" },
  ),
);
