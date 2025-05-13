import { apiClient } from "@/shared/api";
import { redeemTicket } from "@/shared/lib/web3";
import type { Account } from "thirdweb/wallets";

export const redeem = async (
  account: Account | undefined,
  QRCodeValue: string,
) => {
  if (!account) throw new Error("No account");

  const parts = QRCodeValue.split(",");
  const ticketId = Number(parts[0]);
  const nonce = parts[1];

  if (Number.isNaN(ticketId)) {
    throw new Error(`Invalid ticket id: ${parts}`);
  }
  if (!nonce) {
    throw new Error(`There is no nonce in the QR code data: ${parts}`);
  }

  const { error } = await apiClient.GET("/api/events/tickets/nonce/{nonce}", {
    params: {
      path: { nonce },
    },
  });

  if (error) {
    throw error;
  }

  await redeemTicket(account, ticketId);
};
