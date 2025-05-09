import { apiClient } from "@/shared/api";
import { queryOptions } from "@tanstack/react-query";

export const getNonce = queryOptions({
  queryKey: ["ticket", "nonce"],
  queryFn: async () => {
    const { data, error } = await apiClient.GET("/api/events/tickets/nonce");
    if (!data) throw error;
    return data;
  },
  refetchInterval: 5 * 60 * 1000,
});
