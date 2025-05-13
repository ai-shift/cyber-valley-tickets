import { useQuery } from "@tanstack/react-query";
import { userQueries } from "../api/userQueries";

// TODO: Move into single file
export const useUser = () => {
  const { data: user, isLoading } = useQuery(userQueries.current());
  return { user, isLoading };
};
