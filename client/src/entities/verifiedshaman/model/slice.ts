import { create } from "zustand";
import { persist } from "zustand/middleware";

export type VerifiedShamanState = {
  removedVerifiedShaman: string[];
  addedVerifiedShaman: string[];
  optimisticRemoveVerifiedShaman: (adr: string) => void;
  optimisticAddVerifiedShaman: (adr: string) => void;
};

export const useVerifiedShamanState = create<VerifiedShamanState>()(
  persist(
    (set, get) => ({
      removedVerifiedShaman: [],
      addedVerifiedShaman: [],
      optimisticRemoveVerifiedShaman: (adr: string) =>
        set({
          removedVerifiedShaman: [
            ...get().removedVerifiedShaman,
            adr.toLowerCase(),
          ],
          addedVerifiedShaman: get().addedVerifiedShaman.filter(
            (shamanAdr) => shamanAdr !== adr.toLowerCase(),
          ),
        }),
      optimisticAddVerifiedShaman: (adr: string) =>
        set({
          removedVerifiedShaman: get().removedVerifiedShaman.filter(
            (shamanAdr) => shamanAdr !== adr.toLowerCase(),
          ),
          addedVerifiedShaman: [
            ...get().addedVerifiedShaman,
            adr.toLowerCase(),
          ],
        }),
    }),
    { name: "optimisticVerifiedShamanState" },
  ),
);
