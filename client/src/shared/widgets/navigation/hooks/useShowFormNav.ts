import { useEffect } from "react";
import { useNavStore } from "../model/navSlice";

export const useShowFormNav = () => {
  const setFormNavVisible = useNavStore((state) => state.setFormNavVisible);

  useEffect(() => {
    setFormNavVisible(true);
    return () => {
      setFormNavVisible(false);
    };
  }, [setFormNavVisible]);
};
