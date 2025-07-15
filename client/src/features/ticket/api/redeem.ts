import { apiClient } from "@/shared/api";
import { redeemTicket } from "@/shared/lib/web3";
import { queryOptions } from "@tanstack/react-query";
import type { Account } from "thirdweb/wallets";

export const useEventStatus = (eventId: number) =>
  queryOptions({
    queryKey: ["event", "info", eventId],
    queryFn: async () => {
      return await apiClient.GET("/api/events/{event_id}/status", {
        params: {
          // @ts-ignore: TS2561
          path: { event_id: eventId },
        },
      });
    },
    select: (resp) => resp?.data,
    refetchInterval: 1 * 1000,
  });

export const redeem = async (
  account: Account | undefined,
  QRCodeValue: string,
) => {
  if (!account) throw new Error("No account");

  const parts = QRCodeValue.split(",");
  const eventId = Number(parts[0]);
  const ticketId = Number(parts[1]);
  const nonce = parts[2];

  if (Number.isNaN(ticketId)) {
    throw new Error(`Invalid ticket id: ${parts}`);
  }
  if (!nonce) {
    throw new Error(`There is no nonce in the QR code data: ${parts}`);
  }

  const { error } = await apiClient.GET(
    "/api/events/{event_id}/tickets/{ticket_id}/nonce/{nonce}",
    {
      params: {
        // @ts-ignore: TS2561
        path: { nonce, event_id: eventId, ticket_id: ticketId },
      },
    },
  );

  if (error) {
    throw error;
  }

  await redeemTicket(account, BigInt(ticketId));
};
