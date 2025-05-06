import {
  type BigNumberish,
  type BrowserProvider,
  type Signer,
  ethers,
} from "ethers";
import type { CyberValleyEventManager } from "../typechain-types/contracts/CyberValleyEventManager";
import type { CyberValleyEventTicket } from "../typechain-types/contracts/CyberValleyEventTicket";
import { CyberValleyEventManager__factory } from "../typechain-types/factories/contracts/CyberValleyEventManager__factory";
import { CyberValleyEventTicket__factory } from "../typechain-types/factories/contracts/CyberValleyEventTicket__factory";
import { getBytes32FromMultiash } from "./multihash";

const eventManagerAddress = "0x1";
const eventTicketAddress = "0x2";

export async function signMessage(message: string): Promise<string> {
  const { signer } = await getContext();
  return await signer.signMessage(message);
}

export async function createPlace(
  maxTickets: BigNumberish,
  minTickets: BigNumberish,
  minPrice: BigNumberish,
  daysBeforeCancel: BigNumberish,
  minDays: BigNumberish,
  metaCID: string,
): Promise<void> {
  const multihash = getBytes32FromMultiash(metaCID);
  const { eventManager } = await getContext();
  await eventManager.createEventPlace(
    maxTickets,
    minTickets,
    minPrice,
    daysBeforeCancel,
    minDays,
    multihash.digest,
    multihash.hashFunction,
    multihash.size,
  );
}

export async function submitEventRequest(
  eventPlaceId: BigNumberish,
  ticketPrice: BigNumberish,
  startDate: BigNumberish,
  daysAmount: BigNumberish,
  metaCID: string,
): Promise<void> {
  const { digest, hashFunction, size } = getBytes32FromMultiash(metaCID);
  const { eventManager } = await getContext();
  await eventManager.submitEventRequest(
    eventPlaceId,
    ticketPrice,
    startDate,
    daysAmount,
    digest,
    hashFunction,
    size,
  );
}

export async function updateEvent(
  eventId: BigNumberish,
  eventPlaceId: BigNumberish,
  ticketPrice: BigNumberish,
  startDate: BigNumberish,
  daysAmount: BigNumberish,
  metaCID: string,
): Promise<void> {
  const { digest, hashFunction, size } = getBytes32FromMultiash(metaCID);
  const { eventManager } = await getContext();
  await eventManager.updateEvent(
    eventId,
    eventPlaceId,
    ticketPrice,
    startDate,
    daysAmount,
    digest,
    hashFunction,
    size,
  );
}

export async function approveEvent(eventId: BigNumberish): Promise<void> {
  const { eventManager } = await getContext();
  await eventManager.approveEvent(eventId);
}

export async function declineEvent(eventId: BigNumberish): Promise<void> {
  const { eventManager } = await getContext();
  await eventManager.declineEvent(eventId);
}

// TODO: @scipunch add approve call
export async function mintTicket(
  eventId: BigNumberish,
  socialsCID: string,
): Promise<void> {
  const { eventManager } = await getContext();
  const { digest, hashFunction, size } = getBytes32FromMultiash(socialsCID);
  await eventManager.mintTicket(eventId, digest, hashFunction, size);
}

export async function redeemTicket(ticketId: BigNumberish): Promise<void> {
  const { eventTicket } = await getContext();
  await eventTicket.redeemTicket(ticketId);
}

async function getContext(): Promise<{
  provider: BrowserProvider;
  signer: Signer;
  eventManager: CyberValleyEventManager;
  eventTicket: CyberValleyEventTicket;
}> {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  return {
    provider,
    signer,
    eventManager: CyberValleyEventManager__factory.connect(
      eventManagerAddress,
      provider,
    ),
    eventTicket: CyberValleyEventTicket__factory.connect(
      eventTicketAddress,
      provider,
    ),
  };
}

async function getProvider(): Promise<BrowserProvider> {
  if (typeof window === "undefined") {
    throw new Error("Not in a browser environment");
  }

  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  if (window.coinbaseWallet) {
    return new ethers.BrowserProvider(window.coinbaseWallet);
  }
  // WalletConnect or other fallback (see below)
  throw new Error(
    "No wallet found. Please install MetaMask or another compatible wallet.",
  );
}
