import { type Dispatch, type SetStateAction, useState } from "react";
import type { ExpandableId } from "../types";

export const useExpand = (
  isInsideContext: boolean,
  expandedByContext: boolean,
  setExpanded: (id: ExpandableId) => void,
  id?: ExpandableId,
  externalOpen?: boolean,
  setExternalOpen?: Dispatch<SetStateAction<boolean>>,
): [boolean, () => void] => {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled =
    externalOpen !== undefined && setExternalOpen !== undefined;

  const isContextControlled = isInsideContext;

  const state = isControlled
    ? externalOpen
    : isContextControlled
      ? expandedByContext
      : internalOpen;

  const toggleState = () => {
    if (isControlled) {
      setExternalOpen((prev) => !prev);
    } else if (isInsideContext && id !== undefined) {
      setExpanded(id);
    } else {
      setInternalOpen((prev) => !prev);
    }
  };

  return [state, toggleState];
};
