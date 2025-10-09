import {
  loadFixture as hardhatLoadFixture,
  time,
} from "@nomicfoundation/hardhat-network-helpers";
import { assert, expect } from "chai";
import type {
  BaseContract,
  BigNumberish,
  ContractTransactionReceipt,
  ContractTransactionResponse,
  EventLog,
  Signer,
} from "ethers";
import { ethers } from "hardhat";
import type {
  CyberValleyEventManager,
  CyberValleyEventTicket,
  SimpleERC20Xylose,
} from "../../typechain-types";
import {
  defaultCancelEventArgs,
  defaultCloseEventArgs,
  defaultCreateEventPlaceRequest,
  defaultSubmitEventRequest,
  defaultUpdateEventPlaceRequest,
  eventRequestSubmitionPrice,
} from "./data";
import type {
  ApproveEventArgs,
  CancelEventArgs,
  CloseEventArgs,
  CreateEventPlaceArgs,
  Event,
  NewEventRequestEvent,
  SubmitEventRequestArgs,
  UpdateEventPlaceArgs,
} from "./types";

import {
  approveEventArgsToArray,
  cancelEventArgsToArray,
  closeEventArgsToArray,
  createEventPlaceArgsToArray,
  submitEventRequestArgsToArray,
  updateEventPlaceArgsToArray,
} from "./types";

export type ContractsFixture = {
  ERC20: SimpleERC20Xylose & BaseContract;
  eventManager: CyberValleyEventManager & BaseContract;
  eventTicket: CyberValleyEventTicket & BaseContract;
  owner: Signer;
  master: Signer;
  localProvider: Signer;
  creator: Signer;
  staff: Signer;
};

const blockchainRestoreDisabled = process.env.DISABLE_BLOCKHAIN_RESTORE != null;

if (blockchainRestoreDisabled) {
  console.warn("!!! BLOCKCHAIN SNAPSHOT RESTORATION IS DISABLED !!!");
}

type Fixture<T> = () => Promise<T>;
async function dummyLoadFixture<T>(fn: Fixture<T>): Promise<T> {
  return await fn();
}

const loadFixture = blockchainRestoreDisabled
  ? dummyLoadFixture
  : hardhatLoadFixture;

export { loadFixture };

export async function deployContract(): Promise<ContractsFixture> {
  const [owner, master, localProvider, creator, staff] =
    await ethers.getSigners();
  const ERC20 = await ethers.deployContract("SimpleERC20Xylose");
  const CyberValleyEventManagerFactory = await ethers.getContractFactory(
    "CyberValleyEventManager",
  );
  const CyberValleyEventTicketFactory = await ethers.getContractFactory(
    "CyberValleyEventTicket",
  );
  const eventTicket = await CyberValleyEventTicketFactory.deploy(
    "CyberValleyEventTicket",
    "CVET",
    master,
    "",
  );
  const eventManager = await CyberValleyEventManagerFactory.deploy(
    await ERC20.getAddress(),
    await eventTicket.getAddress(),
    master,
    eventRequestSubmitionPrice,
    await timestamp(0),
  );
  await eventTicket
    .connect(master)
    .setEventManagerAddress(await eventManager.getAddress());
  await eventManager.connect(master).setMasterShare(50);
  await eventManager
    .connect(master)
    .grantLocalProvider(await localProvider.getAddress(), 100);
  return {
    ERC20,
    eventManager,
    eventTicket,
    owner,
    master,
    localProvider,
    creator,
    staff,
  };
}

export async function createEventPlace(
  eventManager: CyberValleyEventManager,
  localProvider: Signer,
  patch?: Partial<CreateEventPlaceArgs>,
): Promise<{ eventPlaceId: BigNumberish; tx: ContractTransactionResponse }> {
  const tx = await eventManager.connect(localProvider).createEventPlace(
    ...createEventPlaceArgsToArray({
      ...defaultCreateEventPlaceRequest,
      ...patch,
    }),
  );
  const receipt = await tx.wait();
  assert(receipt != null);
  const event = receipt.logs
    .filter((e): e is EventLog => "fragment" in e && "args" in e)
    .find((e) => e.fragment?.name === "EventPlaceUpdated");
  assert(event != null, "EventPlaceUpdated wasn't emitted");
  return { tx, eventPlaceId: event.args.eventPlaceId };
}

export async function createValidEventPlace(
  eventManager: CyberValleyEventManager,
  localProvider: Signer,
): ReturnType<typeof createEventPlace> {
  return await createEventPlace(
    eventManager,
    localProvider,
    defaultCreateEventPlaceRequest,
  );
}

export async function updateEventPlace(
  eventManager: CyberValleyEventManager,
  localProvider: Signer,
  request: UpdateEventPlaceArgs,
) {
  return await eventManager
    .connect(localProvider)
    .updateEventPlace(...updateEventPlaceArgsToArray(request));
}

export async function createAndUpdateEventPlace(
  eventManager: CyberValleyEventManager,
  localProvider: Signer,
  request: Partial<UpdateEventPlaceArgs>,
) {
  const { eventPlaceId } = await createValidEventPlace(
    eventManager,
    localProvider,
  );
  return await updateEventPlace(eventManager, localProvider, {
    ...defaultUpdateEventPlaceRequest,
    eventPlaceId,
    ...request,
  });
}

export async function createEvent(
  eventManager: CyberValleyEventManager,
  ERC20: SimpleERC20Xylose,
  localProvider: Signer,
  creator: Signer,
  eventPlacePatch: Partial<CreateEventPlaceArgs>,
  submitEventPatch: Partial<Event>,
  approveEventPatch: Partial<ApproveEventArgs>,
): Promise<{
  request: SubmitEventRequestArgs;
  tx: Promise<ContractTransactionResponse>;
  eventId: BigNumberish;
}> {
  // Mint tokens & approve
  await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
  await ERC20.connect(creator).approve(
    await eventManager.getAddress(),
    eventRequestSubmitionPrice,
  );

  // Create event place
  const { eventPlaceId } = await createEventPlace(
    eventManager,
    localProvider,
    eventPlacePatch,
  );

  // Submit request
  const {
    tx: submitEventRequestTx,
    request,
    getEventId,
  } = await submitEventRequest(eventManager, creator, submitEventPatch);

  const eventId = await getEventId();

  // Approve
  const tx = eventManager.connect(localProvider).approveEvent(
    ...approveEventArgsToArray({
      eventId,
      ...approveEventPatch,
    }),
  );
  return { request, tx, eventId };
}

export async function submitEventRequest(
  eventManager: CyberValleyEventManager,
  creator: Signer,
  patch: Partial<SubmitEventRequestArgs>,
): Promise<{
  request: SubmitEventRequestArgs;
  tx: Promise<ContractTransactionResponse>;
  getEventId: () => Promise<BigNumberish>;
}> {
  const request = {
    ...defaultSubmitEventRequest,
    startDate: await timestamp(5),
    ...patch,
  };
  assert(request.eventPlaceId != null);
  const tx = eventManager
    .connect(creator)
    .submitEventRequest(...submitEventRequestArgsToArray(request));
  return {
    request,
    tx,
    getEventId: async () => {
      const { id } = extractEvent<NewEventRequestEvent>(
        await (await tx).wait(),
        "NewEventRequest",
      );
      return id;
    },
  };
}

export async function closeEvent(
  eventManager: CyberValleyEventManager,
  localProvider: Signer,
  patch: Partial<CloseEventArgs>,
): Promise<{
  request: CloseEventArgs;
  tx: Promise<ContractTransactionResponse>;
}> {
  const request = {
    ...defaultCloseEventArgs,
    ...patch,
  };
  const tx = eventManager
    .connect(localProvider)
    .closeEvent(...closeEventArgsToArray(request));
  return { request, tx };
}

export async function createAndCloseEvent(
  eventManager: CyberValleyEventManager,
  ERC20: SimpleERC20Xylose,
  localProvider: Signer,
  creator: Signer,
  patch: Partial<CloseEventArgs>,
): ReturnType<typeof closeEvent> {
  const { tx: createEventTx, eventId } = await createEvent(
    eventManager,
    ERC20,
    localProvider,
    creator,
    {},
    {},
    {},
  );
  await createEventTx;
  await time.increase(100_000_000);
  return await closeEvent(eventManager, localProvider, { eventId, ...patch });
}

export async function cancelEvent(
  eventManager: CyberValleyEventManager,
  localProvider: Signer,
  patch: Partial<CancelEventArgs>,
): Promise<{
  request: CancelEventArgs;
  tx: Promise<ContractTransactionResponse>;
}> {
  const request = {
    ...defaultCancelEventArgs,
    ...patch,
  };
  const tx = eventManager
    .connect(localProvider)
    .cancelEvent(...cancelEventArgsToArray(request));
  return { request, tx };
}

export async function createAndCancelEvent(
  eventManager: CyberValleyEventManager,
  ERC20: SimpleERC20Xylose,
  localProvider: Signer,
  creator: Signer,
  patch: Partial<CancelEventArgs>,
): ReturnType<typeof cancelEvent> {
  const { tx: createEventTx, eventId } = await createEvent(
    eventManager,
    ERC20,
    localProvider,
    creator,
    {},
    {},
    {},
  );
  await createEventTx;
  await time.increase(100_000_000);
  return await cancelEvent(eventManager, localProvider, { eventId, ...patch });
}

export function extractEvent<T>(
  receipt: ContractTransactionReceipt | null,
  eventName: string,
): T {
  assert(receipt != null, "Got null receipt");
  const event = receipt.logs
    .filter((e): e is EventLog => "fragment" in e && "args" in e)
    .find((e) => e.fragment?.name === eventName);
  assert(event != null, `${eventName} wasn't emitted`);
  return event.args as T;
}

/**
 * The fuck do u mean that expect works only inside of `it`
 * i.e. it raises `AssertionError`, but the runner doesn't care and ignore it
 */
export function itExpectsOnlyMaster<K extends keyof CyberValleyEventManager>(
  methodName: K,
  request: Parameters<CyberValleyEventManager[K]>,
) {
  it(`${String(methodName)} allowed only to master`, async () => {
    const { eventManager } = await loadFixture(deployContract);
    const method = eventManager[methodName];
    assert(method != null);
    await expect(method.apply(eventManager, request)).to.be.revertedWith(
      "Must have master role",
    );
  });
}

export function itExpectsOnlyLocalProvider<
  K extends keyof CyberValleyEventManager,
>(methodName: K, request: Parameters<CyberValleyEventManager[K]>) {
  it(`${String(methodName)} allowed only to local provider`, async () => {
    const { eventManager } = await loadFixture(deployContract);
    const method = eventManager[methodName];
    assert(method != null);
    await expect(method.apply(eventManager, request)).to.be.revertedWith(
      "Must have local provider role",
    );
  });
}

export function itExpectsOnlyStaff<K extends keyof CyberValleyEventManager>(
  methodName: K,
  request: Parameters<CyberValleyEventManager[K]>,
) {
  it(`${String(methodName)} allowed only to staff`, async () => {
    const { eventManager } = await loadFixture(deployContract);
    const method = eventManager[methodName];
    assert(method != null);
    await expect(method.apply(eventManager, request)).to.be.revertedWith(
      "Must have staff role",
    );
  });
}

export async function timestamp(daysFromNow: number): Promise<BigNumberish> {
  // Use genesis block timestamp for consistent results across test runs
  const genesisBlock = await ethers.provider.getBlock(0);
  const baseTimestamp = genesisBlock?.timestamp || 0;
  const days = daysFromNow * 24 * 60 * 60;
  return baseTimestamp + days;
}

export function stringify<T>(obj: T): string {
  return JSON.stringify(obj, (_, v) =>
    typeof v === "bigint" ? v.toString() : v,
  );
}
