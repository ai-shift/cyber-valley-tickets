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
  DynamicRevenueSplitter,
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
  ApproveEventPlaceArgs,
  CancelEventArgs,
  CloseEventArgs,
  CreateEventPlaceArgs,
  DeclineEventPlaceArgs,
  Event,
  NewEventRequestEvent,
  SubmitEventPlaceRequestArgs,
  SubmitEventRequestArgs,
  UpdateEventPlaceArgs,
} from "./types";

import {
  approveEventArgsToArray,
  approveEventPlaceArgsToArray,
  cancelEventArgsToArray,
  closeEventArgsToArray,
  declineEventPlaceArgsToArray,
  submitEventPlaceRequestArgsToArray,
  submitEventRequestArgsToArray,
  updateEventPlaceArgsToArray,
} from "./types";

export type ContractsFixture = {
  ERC20: SimpleERC20Xylose & BaseContract;
  eventManager: CyberValleyEventManager & BaseContract;
  eventTicket: CyberValleyEventTicket & BaseContract;
  splitter: DynamicRevenueSplitter & BaseContract;
  owner: Signer;
  master: Signer;
  localProvider: Signer;
  verifiedShaman: Signer;
  creator: Signer;
  staff: Signer;
  signer: Signer;
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
  const [owner, master, localProvider, verifiedShaman, creator, staff, signer] =
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
  const DynamicRevenueSplitterFactory = await ethers.getContractFactory(
    "DynamicRevenueSplitter",
  );
  const splitter = await DynamicRevenueSplitterFactory.deploy(
    await ERC20.getAddress(),
    await master.getAddress(), // CyberiaDAO placeholder
    await staff.getAddress(), // CVE PT PMA placeholder
    await master.getAddress(), // admin
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

  await eventManager
    .connect(master)
    .setRevenueSplitter(await splitter.getAddress());

  // Setup a default profile: 100% of flexible share goes to localProvider
  await splitter
    .connect(master)
    .createDistributionProfile([await localProvider.getAddress()], [10000]);
  await splitter.connect(master).setDefaultProfile(1);

  await eventManager
    .connect(master)
    .grantLocalProvider(await localProvider.getAddress());
  const BACKEND_ROLE = await eventManager.BACKEND_ROLE();
  await eventManager
    .connect(master)
    .grantRole(BACKEND_ROLE, await master.getAddress());
  const VERIFIED_SHAMAN_ROLE = await eventManager.VERIFIED_SHAMAN_ROLE();
  await eventManager
    .connect(master)
    .grantRole(VERIFIED_SHAMAN_ROLE, await verifiedShaman.getAddress());
  return {
    ERC20,
    eventManager,
    eventTicket,
    splitter,
    owner,
    master,
    localProvider,
    verifiedShaman,
    creator,
    staff,
    signer,
  };
}

export async function submitEventPlaceRequest(
  eventManager: CyberValleyEventManager,
  verifiedShaman: Signer,
  patch?: Partial<SubmitEventPlaceRequestArgs>,
): Promise<{ eventPlaceId: BigNumberish; tx: ContractTransactionResponse }> {
  const tx = await eventManager.connect(verifiedShaman).submitEventPlaceRequest(
    ...submitEventPlaceRequestArgsToArray({
      ...defaultCreateEventPlaceRequest,
      ...patch,
    }),
  );
  const receipt = await tx.wait();
  assert(receipt != null);
  const event = receipt.logs
    .filter((e): e is EventLog => "fragment" in e && "args" in e)
    .find((e) => e.fragment?.name === "NewEventPlaceRequest");
  assert(event != null, "NewEventPlaceRequest wasn't emitted");
  return { tx, eventPlaceId: event.args.id };
}

export async function approveEventPlace(
  eventManager: CyberValleyEventManager,
  localProvider: Signer,
  request: ApproveEventPlaceArgs,
) {
  return await eventManager
    .connect(localProvider)
    .approveEventPlace(...approveEventPlaceArgsToArray(request));
}

export async function declineEventPlace(
  eventManager: CyberValleyEventManager,
  localProvider: Signer,
  request: DeclineEventPlaceArgs,
) {
  return await eventManager
    .connect(localProvider)
    .declineEventPlace(...declineEventPlaceArgsToArray(request));
}

export async function createEventPlace(
  eventManager: CyberValleyEventManager,
  verifiedShaman: Signer,
  localProvider: Signer,
  patch?: Partial<SubmitEventPlaceRequestArgs>,
  deposit?: BigNumberish,
): Promise<{ eventPlaceId: BigNumberish; tx: ContractTransactionResponse }> {
  const { eventPlaceId, tx } = await submitEventPlaceRequest(
    eventManager,
    verifiedShaman,
    patch,
  );
  await approveEventPlace(eventManager, localProvider, { eventPlaceId, eventDepositSize: deposit ?? 100 });
  return { tx, eventPlaceId };
}

export async function createValidEventPlace(
  eventManager: CyberValleyEventManager,
  verifiedShaman: Signer,
  localProvider: Signer,
): ReturnType<typeof createEventPlace> {
  return await createEventPlace(
    eventManager,
    verifiedShaman,
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
  verifiedShaman: Signer,
  localProvider: Signer,
  request: Partial<UpdateEventPlaceArgs>,
) {
  const { eventPlaceId } = await createValidEventPlace(
    eventManager,
    verifiedShaman,
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
  verifiedShaman: Signer,
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
    verifiedShaman,
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

  // Create a default category (required before approval)
  await eventManager
    .connect(verifiedShaman)
    .createCategory(eventId, "Standard", 0, 0, false);

  // Approve
  const tx = eventManager.connect(localProvider).approveEvent(
    ...approveEventArgsToArray({
      eventId,
      ...approveEventPatch,
    }),
  );
  return { request, tx, eventId };
}

export async function createEventForCategories(
  eventManager: CyberValleyEventManager,
  ERC20: SimpleERC20Xylose,
  verifiedShaman: Signer,
  localProvider: Signer,
  creator: Signer,
  eventPlacePatch: Partial<CreateEventPlaceArgs>,
  submitEventPatch: Partial<Event>,
): Promise<{
  request: SubmitEventRequestArgs;
  eventId: BigNumberish;
  eventPlaceId: BigNumberish;
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
    verifiedShaman,
    localProvider,
    eventPlacePatch,
  );

  // Submit request (event is in "Submitted" state, not approved)
  const { request, getEventId } = await submitEventRequest(
    eventManager,
    creator,
    {
      eventPlaceId,
      ...submitEventPatch,
    },
  );

  const eventId = await getEventId();
  return { request, eventId, eventPlaceId };
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
  verifiedShaman: Signer,
  localProvider: Signer,
  creator: Signer,
  patch: Partial<CloseEventArgs>,
): ReturnType<typeof closeEvent> {
  const { tx: createEventTx, eventId } = await createEvent(
    eventManager,
    ERC20,
    verifiedShaman,
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
  verifiedShaman: Signer,
  localProvider: Signer,
  creator: Signer,
  patch: Partial<CancelEventArgs>,
): ReturnType<typeof cancelEvent> {
  const { tx: createEventTx, eventId } = await createEvent(
    eventManager,
    ERC20,
    verifiedShaman,
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
    const { eventManager, owner } = await loadFixture(deployContract);
    const method = eventManager[methodName];
    assert(method != null);
    const masterRole = await eventManager.MASTER_ROLE();
    await expect(method.apply(eventManager, request))
      .to.be.revertedWithCustomError(
        eventManager,
        "AccessControlUnauthorizedAccount",
      )
      .withArgs(await owner.getAddress(), masterRole);
  });
}

export function itExpectsOnlyLocalProvider<
  K extends keyof CyberValleyEventManager,
>(methodName: K, request: Parameters<CyberValleyEventManager[K]>) {
  it(`${String(methodName)} allowed only to local provider`, async () => {
    const { eventManager, owner } = await loadFixture(deployContract);
    const method = eventManager[methodName];
    assert(method != null);
    const localProviderRole = await eventManager.LOCAL_PROVIDER_ROLE();
    await expect(method.apply(eventManager, request))
      .to.be.revertedWithCustomError(
        eventManager,
        "AccessControlUnauthorizedAccount",
      )
      .withArgs(await owner.getAddress(), localProviderRole);
  });
}

export function itExpectsOnlyVerifiedShaman<
  K extends keyof CyberValleyEventManager,
>(methodName: K, request: Parameters<CyberValleyEventManager[K]>) {
  it(`${String(methodName)} allowed only to verified shaman`, async () => {
    const { eventManager, owner } = await loadFixture(deployContract);
    const method = eventManager[methodName];
    assert(method != null);
    if (methodName === "submitEventPlaceRequest") {
      await expect(method.apply(eventManager, request)).to.be.revertedWith(
        "access denied",
      );
    } else {
      const verifiedShamanRole = await eventManager.VERIFIED_SHAMAN_ROLE();
      await expect(method.apply(eventManager, request))
        .to.be.revertedWithCustomError(
          eventManager,
          "AccessControlUnauthorizedAccount",
        )
        .withArgs(await owner.getAddress(), verifiedShamanRole);
    }
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
