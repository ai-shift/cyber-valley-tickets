import { apiClient } from "@/shared/api";
import { queryOptions } from "@tanstack/react-query";

export const useGetNonce = (
  eventId: number,
  ticketId: string,
  _proofToken: string | null,
) =>
  queryOptions({
    queryKey: ["ticket", "nonce", eventId, ticketId],
    queryFn: async () => {
      return await apiClient.GET(
        "/api/events/{event_id}/tickets/{ticket_id}/nonce",
        {
          params: {
            path: { event_id: eventId, ticket_id: Number(ticketId) },
          } as any,
        },
      );
    },
    select: (resp) => resp?.data,
    refetchInterval: 5 * 60 * 1000,
  });
