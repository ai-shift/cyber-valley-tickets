import {
  prepareContractCall,
  readContract,
  sendTransaction,
  waitForReceipt,
} from "thirdweb";
import { balanceOf } from "thirdweb/extensions/erc20";
import type { Account } from "thirdweb/wallets";
import { getBytes32FromMultiash } from "./multihash";
export { formatTxError } from "./formatTxError";
import {
  LOCAL_PROVIDER_ROLE,
  STAFF_ROLE,
  erc20,
  eventManager,
  eventTicket,
  revenueSplitter,
} from "./state";
export { client, wallets, cvlandChain, erc20, revenueSplitter } from "./state";

export async function mintERC20(
  account: Account,
  amount: bigint,
): Promise<TxHash> {
  const transaction = prepareContractCall({
    contract: erc20,
    method: "mint",
    params: [BigInt(amount)],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export function getCurrencySymbol(): string {
  return "/icons/tether.svg";
}

export function getEventSubmitionPrice(): bigint {
  return 100n;
}

export type TxHash = `0x${string}`;

export async function submitEventPlaceRequest(
  account: Account,
  maxTickets: number,
  minTickets: number,
  minPrice: number,
  daysBeforeCancel: number,
  minDays: number,
  available: boolean,
  metaCID: string,
  eventDepositSize: number,
): Promise<TxHash> {
  const multihash = getBytes32FromMultiash(metaCID);
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "submitEventPlaceRequest",
    params: [
      maxTickets,
      minTickets,
      minPrice,
      daysBeforeCancel,
      minDays,
      available,
      multihash.digest,
      multihash.hashFunction,
      multihash.size,
      BigInt(eventDepositSize),
    ],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function approveEventPlace(
  account: Account,
  placeId: bigint,
  deposit: bigint,
): Promise<TxHash> {
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "approveEventPlace",
    params: [placeId, deposit],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function declineEventPlace(
  account: Account,
  placeId: bigint,
): Promise<TxHash> {
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "declineEventPlace",
    params: [placeId],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function updatePlace(
  account: Account,
  placeId: bigint,
  maxTickets: number,
  minTickets: number,
  minPrice: number,
  daysBeforeCancel: number,
  minDays: number,
  available: boolean,
  metaCID: string,
  eventDepositSize: number,
): Promise<TxHash> {
  const multihash = getBytes32FromMultiash(metaCID);
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "updateEventPlace",
    params: [
      BigInt(placeId),
      maxTickets,
      minTickets,
      minPrice,
      daysBeforeCancel,
      minDays,
      available,
      multihash.digest,
      multihash.hashFunction,
      multihash.size,
      BigInt(eventDepositSize),
    ],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function approveSubmitEventRequest(
  account: Account,
  deposit: bigint,
) {
  const approveTransaction = prepareContractCall({
    contract: erc20,
    method: "approve",
    params: [eventManager.address, deposit],
  });
  await sendTransaction({ account, transaction: approveTransaction });
}

export interface CategoryInput {
  name: string;
  discountPercentage: number;
  quota: number;
  hasQuota: boolean;
}

export interface SubmitEventResult {
  txHash: TxHash;
  eventId: bigint;
}

export async function submitEventRequest(
  account: Account,
  eventPlaceId: bigint,
  ticketPrice: number,
  startDate: bigint,
  daysAmount: number,
  metaCID: string,
  categories: CategoryInput[],
): Promise<SubmitEventResult> {
  const { digest, hashFunction, size } = getBytes32FromMultiash(metaCID);
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
      categories,
    ],
  });
  const result = await sendTransaction({ account, transaction });

  // Wait for receipt and then get the events count to determine the new event ID
  await waitForReceipt({
    client: eventManager.client,
    chain: eventManager.chain,
    transactionHash: result.transactionHash,
  });

  // Get the total events count - the new event ID is events.length - 1
  const eventsCount = await readContract({
    contract: eventManager,
    method: "getEventsCount",
    params: [],
  });
  const eventId = eventsCount - 1n;

  return {
    txHash: result.transactionHash,
    eventId,
  };
}

export async function updateEvent(
  account: Account,
  eventId: bigint,
  eventPlaceId: bigint,
  ticketPrice: number,
  startDate: bigint,
  daysAmount: number,
  metaCID: string,
): Promise<TxHash> {
  const { digest, hashFunction, size } = getBytes32FromMultiash(metaCID);
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

async function validateEventApproval(
  account: Account,
  eventId: bigint,
): Promise<{ valid: boolean; reason?: string }> {
  try {
    // Check if user has LOCAL_PROVIDER_ROLE
    const hasRole = await readContract({
      contract: eventManager,
      method: "hasRole",
      params: [LOCAL_PROVIDER_ROLE, account.address],
    });
    console.log("User has LOCAL_PROVIDER_ROLE:", hasRole);

    if (!hasRole) {
      return {
        valid: false,
        reason: "You don't have LOCAL_PROVIDER_ROLE permission",
      };
    }

    // Get event details
    const event = await readContract({
      contract: eventManager,
      method: "events",
      params: [eventId],
    });
    console.log("Event details:", event);

    // Check event status (should be Submitted = 0)
    if (event[5] !== 0) {
      // event[5] is status
      const statusNames = [
        "Submitted",
        "Approved",
        "Declined",
        "Cancelled",
        "Closed",
      ];
      return {
        valid: false,
        reason: `Event status is ${statusNames[event[5]]} but must be Submitted`,
      };
    }

    // Get event place details
    const eventPlaceId = event[1]; // event[1] is eventPlaceId
    const eventPlace = await readContract({
      contract: eventManager,
      method: "eventPlaces",
      params: [eventPlaceId],
    });
    console.log("Event place details:", eventPlace);

    // Check if the event place provider matches the caller
    const placeProvider = eventPlace[1]; // eventPlace[1] is provider
    console.log("Place provider:", placeProvider, "Caller:", account.address);

    if (placeProvider.toLowerCase() !== account.address.toLowerCase()) {
      return {
        valid: false,
        reason: `This event belongs to place owned by ${placeProvider}, but you are ${account.address}`,
      };
    }

    return { valid: true };
  } catch (error) {
    console.error("Validation failed:", error);
    return {
      valid: false,
      reason: `Validation check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function approveEvent(
  account: Account,
  eventId: bigint,
  distributionProfileId: bigint,
): Promise<TxHash> {
  console.log("approveEvent called with:", {
    account: account.address,
    eventId,
    distributionProfileId,
  });
  console.log("eventManager contract:", {
    address: eventManager.address,
    chain: eventManager.chain,
  });

  // Pre-flight validation
  const validation = await validateEventApproval(account, eventId);
  if (!validation.valid) {
    console.error("Pre-flight validation failed:", validation.reason);
    throw new Error(validation.reason);
  }

  try {
    const transaction = prepareContractCall({
      contract: eventManager,
      method: "approveEvent",
      params: [eventId, distributionProfileId],
    });
    console.log("prepareContractCall result:", transaction);
    console.log("Sending transaction...");
    const result = await sendTransaction({ account, transaction });
    console.log("sendTransaction result:", result);
    return result.transactionHash;
  } catch (error) {
    console.error("approveEvent failed:", error);
    // Try to extract more meaningful error info
    if (error && typeof error === "object" && "data" in error) {
      const errorData = (error as { data?: { message?: string } }).data;
      console.error("Contract revert reason:", errorData?.message);
    }
    throw error;
  }
}

export async function declineEvent(
  account: Account,
  eventId: bigint,
): Promise<TxHash> {
  console.log("declineEvent called with:", {
    account: account.address,
    eventId,
  });
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "declineEvent",
    params: [eventId],
  });
  console.log("prepareContractCall result:", transaction);
  const result = await sendTransaction({ account, transaction });
  console.log("sendTransaction result:", result);
  return result.transactionHash;
}

export async function closeEvent(
  account: Account,
  eventId: bigint,
): Promise<TxHash> {
  console.log("closeEvent called with:", { account: account.address, eventId });
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "closeEvent",
    params: [eventId],
  });
  console.log("prepareContractCall result:", transaction);
  const result = await sendTransaction({ account, transaction });
  console.log("sendTransaction result:", result);
  return result.transactionHash;
}

export async function cancelEvent(
  account: Account,
  eventId: bigint,
): Promise<TxHash> {
  console.log("cancelEvent called with:", {
    account: account.address,
    eventId,
  });
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "cancelEvent",
    params: [eventId],
  });
  console.log("prepareContractCall result:", transaction);
  const result = await sendTransaction({ account, transaction });
  console.log("sendTransaction result:", result);
  return result.transactionHash;
}

export async function approveMintTicket(account: Account, ticketPrice: bigint) {
  const transaction = prepareContractCall({
    contract: erc20,
    method: "approve",
    params: [eventManager.address, ticketPrice],
  });
  await sendTransaction({ account, transaction });
}

export async function mintTicket(
  account: Account,
  eventId: bigint,
  categoryId: bigint,
  socialsCID: string,
  referrer?: string,
): Promise<TxHash> {
  const { digest, hashFunction, size } = getBytes32FromMultiash(socialsCID);
  const mintTransaction = prepareContractCall({
    contract: eventManager,
    method: "mintTicket",
    params: [
      eventId,
      categoryId,
      digest,
      hashFunction,
      size,
      referrer ?? "0x0000000000000000000000000000000000000000",
    ],
  });
  const { transactionHash } = await sendTransaction({
    account,
    transaction: mintTransaction,
  });
  return transactionHash;
}

export async function mintTickets(
  account: Account,
  eventId: bigint,
  categoryId: bigint,
  amount: bigint,
  socialsCID: string,
  referrer?: string,
): Promise<TxHash> {
  const { digest, hashFunction, size } = getBytes32FromMultiash(socialsCID);
  const mintTransaction = prepareContractCall({
    contract: eventManager,
    method: "mintTickets",
    params: [
      eventId,
      categoryId,
      amount,
      digest,
      hashFunction,
      size,
      referrer ?? "0x0000000000000000000000000000000000000000",
    ],
  });
  const { transactionHash } = await sendTransaction({
    account,
    transaction: mintTransaction,
  });
  return transactionHash;
}

export async function redeemTicket(
  account: Account,
  ticketId: bigint,
): Promise<TxHash> {
  const transaction = prepareContractCall({
    contract: eventTicket,
    method: "redeemTicket",
    params: [ticketId],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function assignStaff(
  account: Account,
  address: string,
): Promise<TxHash> {
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "grantRole",
    params: [STAFF_ROLE, address],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function removeStaff(
  account: Account,
  address: string,
): Promise<TxHash> {
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "revokeRole",
    params: [STAFF_ROLE, address],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function grantLocalProvider(
  account: Account,
  address: string,
  defaultSharePercent: number,
): Promise<TxHash> {
  const shareBps = BigInt(Math.round(defaultSharePercent * 100));
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "grantLocalProvider",
    params: [address, Number(shareBps)],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function removeRevokeLocalProvider(
  account: Account,
  address: string,
): Promise<TxHash> {
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "revokeLocalProvider",
    params: [address],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function revokeVerifiedShaman(
  account: Account,
  address: string,
): Promise<TxHash> {
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "revokeVerifiedShaman",
    params: [address],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function hasEnoughtTokens(
  account: Account,
  tokens?: bigint,
): Promise<{
  enoughTokens: boolean;
  balanceAfterPayment: bigint;
}> {
  const tokensToCheck = tokens == null ? getEventSubmitionPrice() : tokens;
  const erc20Balance = await balanceOf({
    contract: erc20,
    address: account.address,
  });
  console.log("ERC20 balance", erc20Balance);
  const balanceAfterPayment = erc20Balance - tokensToCheck;
  return {
    enoughTokens: balanceAfterPayment >= BigInt(0),
    balanceAfterPayment: babs(balanceAfterPayment),
  };
}

function babs(x: bigint): bigint {
  return x < 0 ? -x : x;
}

export async function createCategory(
  account: Account,
  eventId: bigint,
  name: string,
  discountPercentage: number,
  quota: number,
  hasQuota: boolean,
): Promise<TxHash> {
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "createCategory",
    params: [eventId, name, discountPercentage, quota, hasQuota],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function updateCategory(
  account: Account,
  _eventId: bigint,
  categoryId: bigint,
  name: string,
  discountPercentage: number,
  quota: number,
  hasQuota: boolean,
): Promise<TxHash> {
  const transaction = prepareContractCall({
    contract: eventManager,
    method: "updateCategory",
    params: [categoryId, name, discountPercentage, quota, hasQuota],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

// ============================================================================
// Distribution Profile Functions
// ============================================================================

export async function createDistributionProfile(
  account: Account,
  recipients: string[],
  shares: number[],
): Promise<TxHash> {
  const transaction = prepareContractCall({
    contract: revenueSplitter,
    method: "createDistributionProfile",
    params: [account.address, recipients, shares.map((s) => BigInt(s))],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function createDistributionProfileAsMaster(
  account: Account,
  ownerAddress: string,
  recipients: string[],
  shares: number[],
): Promise<TxHash> {
  const transaction = prepareContractCall({
    contract: revenueSplitter,
    method: "createDistributionProfile",
    params: [ownerAddress, recipients, shares.map((s) => BigInt(s))],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function updateDistributionProfile(
  account: Account,
  profileId: bigint,
  recipients: string[],
  shares: number[],
): Promise<TxHash> {
  const transaction = prepareContractCall({
    contract: revenueSplitter,
    method: "updateDistributionProfile",
    params: [profileId, recipients, shares.map((s) => BigInt(s))],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function deactivateProfile(
  account: Account,
  profileId: bigint,
): Promise<TxHash> {
  const transaction = prepareContractCall({
    contract: revenueSplitter,
    method: "deactivateProfile",
    params: [profileId],
  });
  const { transactionHash } = await sendTransaction({ account, transaction });
  return transactionHash;
}

export async function isProfileOwner(
  profileId: bigint,
  address: string,
): Promise<boolean> {
  return readContract({
    contract: revenueSplitter,
    method: "isProfileOwner",
    params: [profileId, address],
  });
}
