import { create } from "zustand";
import { persist } from "zustand/middleware";

type GeodataKey = string;

export type MapState = {
  displayedGroups: GeodataKey[];
  setDisplayedGroups: (groups: GeodataKey[]) => void;
  toggleGroup: (group: GeodataKey) => void;
};

export const useMapState = create<MapState>()(
  persist(
    (set, get) => ({
      displayedGroups: ["paths"],
      setDisplayedGroups: (groups: GeodataKey[]) =>
        set({ displayedGroups: groups }),
      toggleGroup: (group: GeodataKey) => {
        const current = get().displayedGroups;
        set({
          displayedGroups: current.includes(group)
            ? current.filter((g) => g !== group)
            : [...current, group],
        });
      },
    }),
    { name: "mapState" },
  ),
);
