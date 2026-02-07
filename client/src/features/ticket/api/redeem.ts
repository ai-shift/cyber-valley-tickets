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
          path: { event_id: eventId },
        } as any,
      });
    },
    select: (resp) => resp?.data,
    refetchInterval: 1 * 1000,
  });

export const redeem = async (
  account: Account | undefined,
  QRCodeValue: string,
  proofToken: string | null,
) => {
  if (!account) throw new Error("No account");
  if (!proofToken) throw new Error("Missing SIWE proof");

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

  const { response, error } = await apiClient.GET(
    "/api/events/{event_id}/tickets/{ticket_id}/nonce/{nonce}",
    {
      headers: { Authorization: `Bearer ${proofToken}` },
      params: {
        path: {
          nonce,
          event_id: eventId,
          ticket_id: ticketId.toString(),
        },
      } as any,
    },
  );

  if (error) {
    throw error;
  }

  if (response.status === 409) {
    alert("Ticket has been redeemed already");
    return;
  }

  if (
    response.status === 202 &&
    !confirm("Redeem transaction was possible started. Proceed anyway?")
  ) {
    return;
  }

  await redeemTicket(account, BigInt(ticketId));
};
