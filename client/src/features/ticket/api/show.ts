import { apiClient } from "@/shared/api";
import { queryOptions } from "@tanstack/react-query";

export const useGetNonce = (eventId: number, ticketId: string) =>
  queryOptions({
    queryKey: ["ticket", "nonce"],
    queryFn: async () => {
      return await apiClient.GET(
        "/api/events/{event_id}/tickets/{ticket_id}/nonce",
        {
          params: {
            path: { eventId, ticketId: Number(ticketId) },
          },
        },
      );
    },
    select: (resp) => resp?.data,
    refetchInterval: 5 * 60 * 1000,
  });
