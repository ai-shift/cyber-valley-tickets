import {
  type BigNumberish,
  type BrowserProvider,
  type Signer,
  ethers,
} from "ethers";
import {
  type PreparedTransaction,
  createThirdwebClient,
  defineChain,
  getContract,
  prepareContractCall,
  sendTransaction,
} from "thirdweb";
import { go } from "thirdweb/chains";
import { createWallet } from "thirdweb/wallets";
import type { CyberValleyEventManager } from "../../../../typechain-types/contracts/CyberValleyEventManager";
import type { CyberValleyEventTicket } from "../../../../typechain-types/contracts/CyberValleyEventTicket";
import type { SimpleERC20Xylose } from "../../../../typechain-types/contracts/mocks/SimpleERC20Xylose";
import { CyberValleyEventManager__factory } from "../../../../typechain-types/factories/contracts/CyberValleyEventManager__factory";
import { CyberValleyEventTicket__factory } from "../../../../typechain-types/factories/contracts/CyberValleyEventTicket__factory";
import { SimpleERC20Xylose__factory } from "../../../../typechain-types/factories/contracts/mocks/SimpleERC20Xylose__factory";
import EventManagerABI from "./contracts/EventManager";
import EventTicketABI from "./contracts/EventTicket";
import { getBytes32FromMultiash } from "./multihash";
const erc20Address = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

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
  address: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
  abi: EventManagerABI,
});

export async function mintERC20(amount: BigNumberish): Promise<void> {
  const { erc20 } = await getContext();
  await erc20.mint(amount);
}

export function getCurrencySymbol(): string {
  return "₮";
}

export function getEventSubmitionPrice(): BigNumberish {
  return 100;
}

export async function getAddress(): Promise<string> {
  const { signer } = await getContext();
  return await signer.getAddress();
}

export async function signMessage(message: string): Promise<string> {
  const { signer } = await getContext();
  return await signer.signMessage(message);
}

export async function createPlace(
  account: Account,
  maxTickets: BigNumberish,
  minTickets: BigNumberish,
  minPrice: BigNumberish,
  daysBeforeCancel: BigNumberish,
  minDays: BigNumberish,
  metaCID: string,
): Promise<`0x${string}`> {
  const multihash = getBytes32FromMultiash(metaCID);
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
  console.log("acount", account, "tx", transaction);
  const { transactionHash } = await sendTransaction({ account, transaction });
  console.log("tx hash", transactionHash);
  return transactionHash;
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

export async function mintTicket(
  eventId: BigNumberish,
  socialsCID: string,
): Promise<void> {
  const { erc20, eventManager, signer } = await getContext();
  const { digest, hashFunction, size } = getBytes32FromMultiash(socialsCID);
  const balance = await erc20.balanceOf(signer);
  const submitionPrice = getEventSubmitionPrice();
  if (balance < submitionPrice) {
    throw `Not enough funds. Balance ${balance}, required: ${submitionPrice}`;
  }
  const approveTx = await erc20.approve(
    await eventManager.getAddress(),
    submitionPrice,
  );
  await approveTx.wait();
  console.log("Trying to mint ticket", eventManager, approveTx);
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
  erc20: SimpleERC20Xylose;
}> {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  return {
    provider,
    signer,
    eventManager: CyberValleyEventManager__factory.connect(
      eventManagerAddress,
      signer,
    ),
    eventTicket: CyberValleyEventTicket__factory.connect(
      eventTicketAddress,
      signer,
    ),
    erc20: SimpleERC20Xylose__factory.connect(erc20Address, signer),
  };
}

async function getProvider(): Promise<BrowserProvider> {
  return new ethers.getDefaultProvider(
    "https://ce9d-109-93-188-5.ngrok-free.app",
  );
}
