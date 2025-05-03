import { useQuery } from "@tanstack/react-query";
import { userQueries } from "../api/userQueries";

export const useUser = () => {
  const { data: user } = useQuery(userQueries.current());
  return { user };
};
