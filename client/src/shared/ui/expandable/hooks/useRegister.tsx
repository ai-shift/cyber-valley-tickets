import { useEffect, useRef } from "react";
import type { ExpandableId } from "../types";

export const useRegister = (
  isInsideContext: boolean,
  id: ExpandableId,
  registerId: (id: ExpandableId) => void,
  unregisterId: (id: ExpandableId) => void,
) => {
  const initialRender = useRef(true);
  useEffect(() => {
    if (!isInsideContext || !id) return;

    if (initialRender.current) {
      registerId(id);
      initialRender.current = false;
    }

    return () => {
      unregisterId(id);
    };
  }, [id, isInsideContext, registerId, unregisterId]);
};
