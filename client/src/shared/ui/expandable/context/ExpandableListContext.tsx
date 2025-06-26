import { createContext, use } from "react";
import type { ExpandableId } from "../types";

type ExpandableListContextType = {
  expandedId: ExpandableId | null;
  setExpanded: (id: ExpandableId) => void;
  isInsideContext: boolean;
  registerId: (id: ExpandableId) => void;
  unregisterId: (id: ExpandableId) => void;
};

const ExpandableListContext = createContext<ExpandableListContextType>({
  expandedId: null,
  setExpanded: () => {},
  registerId: () => {},
  unregisterId: () => {},
  isInsideContext: false,
});

export const useExpandableListContext = () => use(ExpandableListContext);

type ExpandableListContextProviderProps = {
  children: React.ReactNode;
  value: ExpandableListContextType;
};

export const ExpandableListContextProvider: React.FC<
  ExpandableListContextProviderProps
> = ({ children, value }) => {
  return (
    <ExpandableListContext.Provider value={value}>
      {children}
    </ExpandableListContext.Provider>
  );
};
