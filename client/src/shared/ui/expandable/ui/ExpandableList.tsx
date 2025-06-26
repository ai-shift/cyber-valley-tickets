import { useCallback, useState } from "react";
import { ExpandableListContextProvider } from "../context/ExpandableListContext";
import type { ExpandableId } from "../types";

type ExpandableListProps = {
  children: React.ReactNode;
};

export const ExpandableList: React.FC<ExpandableListProps> = ({ children }) => {
  const [expandedId, setExpandedId] = useState<ExpandableId | null>(null);
  const [_, setRegisteredIds] = useState<ExpandableId[]>([]);

  const registerId = useCallback((id: ExpandableId) => {
    setRegisteredIds((prev) => {
      if (prev.includes(id)) throw new Error("All ids should be unique values");
      return [...prev, id];
    });
  }, []);

  const unregisterId = useCallback((id: ExpandableId) => {
    setRegisteredIds((prev) => prev.filter((existedId) => existedId !== id));
  }, []);

  function setExpanded(id: ExpandableId) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <ExpandableListContextProvider
      value={{
        expandedId,
        setExpanded,
        registerId,
        unregisterId,
        isInsideContext: true,
      }}
    >
      {children}
    </ExpandableListContextProvider>
  );
};
