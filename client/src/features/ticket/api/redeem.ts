import { redeemTicket } from "@/shared/lib/web3";
import type { Account } from "thirdweb/wallets";

export const redeem = async (
  account: Account | undefined,
  ticketId: string,
) => {
  if (!account) throw new Error("No account");

  const ticketAsNumber = Number(ticketId);
  if (!Number.isNaN(ticketAsNumber)) throw new Error("Invalid ticket id");

  await redeemTicket(account, ticketAsNumber);
};
