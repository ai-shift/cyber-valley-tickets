import { type Dispatch, type SetStateAction, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { ExpandableContextProvider } from "../context/ExpandableContext";
import { useExpandableListContext } from "../context/ExpandableListContext";
import { useExpand } from "../hooks/useExpand";
import { useRegister } from "../hooks/useRegister";
import type { ExpandableAxle, ExpandableId } from "../types";

type ExpandableProps = {
  children: React.ReactNode;
  id?: ExpandableId;
  expanded?: boolean;
  setExpanded?: Dispatch<SetStateAction<boolean>>;
  className?: string;
  axle?: ExpandableAxle;
  contentAbsolute?: boolean;
};

export const Expandable: React.FC<ExpandableProps> = ({
  children,
  id,
  expanded: externalOpen,
  setExpanded: setExpernalOpen,
  className,
  axle = "vertical",
  contentAbsolute = false,
}) => {
  const { expandedId, setExpanded, registerId, unregisterId, isInsideContext } =
    useExpandableListContext();
  const expandedByContext = expandedId === id;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  if (isInsideContext && id == null)
    throw new Error(
      "If you use 'Expandable' inside 'ExpandableList', pass the 'id' prop",
    );

  id !== undefined &&
    useRegister(isInsideContext, id, registerId, unregisterId);

  const [isCurrentExpanded, toggleCurrentExpanded] = useExpand(
    isInsideContext,
    expandedByContext,
    setExpanded,
    id,
    externalOpen,
    setExpernalOpen,
  );

  return (
    <ExpandableContextProvider
      value={{
        isCurrentExpanded,
        toggleCurrentExpanded,
        triggerRef,
        contentRef,
        isInsideContext: true,
        axle,
        contentAbsolute,
      }}
    >
      <div
        className={twMerge(
          "relative items-center justify-center",
          axle === "horisontal" && "flex h-full",
          axle === "vertical" && contentAbsolute && "flex",
          className,
        )}
      >
        {children}
      </div>
    </ExpandableContextProvider>
  );
};
