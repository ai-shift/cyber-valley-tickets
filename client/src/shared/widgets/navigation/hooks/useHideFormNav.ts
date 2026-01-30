import { useEffect } from "react";
import { useNavStore } from "../model/navSlice";

export const useHideFormNav = () => {
  const toggleFormNav = useNavStore((state) => state.toggleFormNav);

  useEffect(() => {
    toggleFormNav(false);
    return () => {
      toggleFormNav(true);
    };
  }, [toggleFormNav]);
};
