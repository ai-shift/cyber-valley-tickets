import type { BigNumberish } from "ethers";
import {
  createThirdwebClient,
  defineChain,
  getContract,
  prepareContractCall,
  sendTransaction,
} from "thirdweb";
import { type Account, createWallet } from "thirdweb/wallets";
import EventManagerABI from "./contracts/EventManager";
import EventTicketABI from "./contracts/EventTicket";
import SimpleERC20XyloseABI from "./contracts/SimpleERC20Xylose";
import { getBytes32FromMultiash } from "./multihash";

export const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

export const cvlandChain = defineChain({
  id: 31337,
  rpc: "https://ce9d-109-93-188-5.ngrok-free.app",
});

export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_PUBLIC_CLIENT_ID,
});

const eventManager = getContract({
  client: client,
  chain: cvlandChain,
  address: "0xDFf575f11Ee33f2540f7e9F45cD88D2d7cA74f34",
  // @ts-ignore: TS2322
  abi: EventManagerABI,
});

const eventTicket = getContract({
  client: client,
  chain: cvlandChain,
  address: "0xea7E3dA37B67097Be45051753142688BFB779f0C",
  // @ts-ignore: TS2322
  abi: EventTicketABI,
});

const erc20 = getContract({
  client: client,
  chain: cvlandChain,
  address: "0x82DC358728283e9dc82fdDD7ebbB6fAf1dbcBDF9",
  // @ts-ignore: TS2322
  abi: SimpleERC20XyloseABI,
});

export async function mintERC20(
  account: Account,
  amount: BigNumberish,
): Promise<TxHash> {
  // @ts-ignore: TS2345
  const transaction = prepareContractCall({
    contract: erc20,
    method: "mint",
    params: [amount],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export function getCurrencySymbol(): string {
  return "₮";
}

export function getEventSubmitionPrice(): BigNumberish {
  return 100;
}

export type TxHash = `0x${string}`;

export async function createPlace(
  account: Account,
  maxTickets: BigNumberish,
  minTickets: BigNumberish,
  minPrice: BigNumberish,
  daysBeforeCancel: BigNumberish,
  minDays: BigNumberish,
  metaCID: string,
): Promise<TxHash> {
  const multihash = getBytes32FromMultiash(metaCID);
  // @ts-ignore: TS2345
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "createEventPlace",
    params: [
      maxTickets,
      minTickets,
      minPrice,
      daysBeforeCancel,
      minDays,
      multihash.digest,
      multihash.hashFunction,
      multihash.size,
    ],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function submitEventRequest(
  account: Account,
  eventPlaceId: BigNumberish,
  ticketPrice: BigNumberish,
  startDate: BigNumberish,
  daysAmount: BigNumberish,
  metaCID: string,
): Promise<TxHash> {
  const { digest, hashFunction, size } = getBytes32FromMultiash(metaCID);
  // @ts-ignore: TS2345
  const approveTransaction = prepareContractCall({
    contract: erc20,
    method: "approve",
    params: [eventManager.address, getEventSubmitionPrice()],
  });
  await sendTransaction({ account, transaction: approveTransaction });
  // @ts-ignore: TS2345
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "submitEventRequest",
    params: [
      eventPlaceId,
      ticketPrice,
      startDate,
      daysAmount,
      digest,
      hashFunction,
      size,
    ],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function updateEvent(
  account: Account,
  eventId: BigNumberish,
  eventPlaceId: BigNumberish,
  ticketPrice: BigNumberish,
  startDate: BigNumberish,
  daysAmount: BigNumberish,
  metaCID: string,
): Promise<TxHash> {
  const { digest, hashFunction, size } = getBytes32FromMultiash(metaCID);
  // @ts-ignore: TS2345
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "updateEvent",
    params: [
      eventId,
      eventPlaceId,
      ticketPrice,
      startDate,
      daysAmount,
      digest,
      hashFunction,
      size,
    ],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function approveEvent(
  account: Account,
  eventId: BigNumberish,
): Promise<TxHash> {
  // @ts-ignore: TS2345
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "approveEvent",
    params: [eventId],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function declineEvent(
  account: Account,
  eventId: BigNumberish,
): Promise<TxHash> {
  // @ts-ignore: TS2345
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "declineEvent",
    params: [eventId],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function mintTicket(
  account: Account,
  ticketPrice: BigNumberish,
  eventId: BigNumberish,
  socialsCID: string,
): Promise<TxHash> {
  // @ts-ignore: TS2345
  const approveTransaction = prepareContractCall({
    contract: erc20,
    method: "approve",
    params: [eventManager.address, ticketPrice],
  });
  await sendTransaction({ account, transaction: approveTransaction });
  const { digest, hashFunction, size } = getBytes32FromMultiash(socialsCID);
  // @ts-ignore: TS2345
  const mintTransaction = prepareContractCall({
    contract: eventManager,
    method: "mintTicket",
    params: [eventId, digest, hashFunction, size],
  });
  const { transactionHash } = await sendTransaction({
    account,
    transaction: mintTransaction,
  });
  return transactionHash;
}

export async function redeemTicket(
  account: Account,
  ticketId: BigNumberish,
): Promise<TxHash> {
  // @ts-ignore: TS2345
  const transaction = prepareContractCall({
    contract: eventTicket,
    method: "redeemTicket",
    params: [ticketId],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}
