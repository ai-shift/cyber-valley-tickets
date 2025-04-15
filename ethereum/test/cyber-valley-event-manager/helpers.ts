import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { assert, expect } from "chai";
import type {
  BaseContract,
  BigNumberish,
  ContractTransactionResponse,
  EventLog,
  Signer,
} from "ethers";
import { ethers } from "hardhat";
import type {
  CyberValleyEventManager,
  SimpleERC20Xylose,
} from "../../typechain-types";
import {
  defaultCreateEventPlaceRequest,
  defaultSubmitEventRequest,
  defaultUpdateEventPlaceRequest,
  eventRequestSubmitionPrice,
} from "./data";
import type {
  CreateEventPlaceRequest,
  EventPlaceCreated,
  EventRequest,
  UpdateEventPlaceRequest,
  ApproveEventRequest,
} from "./types";

export type ContractsFixture = {
  ERC20: SimpleERC20Xylose & BaseContract;
  eventManager: CyberValleyEventManager & BaseContract;
  owner: Signer;
  master: Signer;
  devTeam: Signer;
  creator: Signer;
};

export function updateEventPlaceRequestAsArguments(
  req: UpdateEventPlaceRequest,
): Parameters<CyberValleyEventManager["updateEventPlace"]> {
  return [
    req.eventPlaceId,
    req.maxTickets,
    req.minTickets,
    req.minPrice,
    req.minDays,
  ];
}

export function createEventPlaceRequestAsArguments(
  req: CreateEventPlaceRequest,
): Parameters<CyberValleyEventManager["createEventPlace"]> {
  return [req.maxTickets, req.minTickets, req.minPrice, req.minDays];
}

export function eventRequestAsArguments(
  req: EventRequest,
): Parameters<CyberValleyEventManager["submitEventRequest"]> {
  return [
    req.id,
    req.eventPlaceId,
    req.ticketPrice,
    req.cancelDate,
    req.startDate,
    req.daysAmount,
  ];
}

export function approveEventRequestAsArguments(req: ApproveEventRequest): Parameters<CyberValleyEventManager["approveEvent"]> {
  return [ req.id ];
}

export async function deployContract(): Promise<ContractsFixture> {
  console.log("Deploying contract");
  const [owner, master, devTeam, creator] = await ethers.getSigners();
  const ERC20 = await ethers.deployContract("SimpleERC20Xylose");
  const CyberValleyEventManagerFactory = await ethers.getContractFactory(
    "CyberValleyEventManager",
  );
  const eventManager = await CyberValleyEventManagerFactory.deploy(
    await ERC20.getAddress(),
    master,
    50,
    devTeam,
    10,
    eventRequestSubmitionPrice,
    timestamp(0),
  );
  return { ERC20, eventManager, owner, master, devTeam, creator };
}

export async function createEventPlace(
  eventManager: CyberValleyEventManager,
  master: Signer,
  patch?: Partial<CreateEventPlaceRequest>,
): Promise<EventPlaceCreated> {
  const tx = await eventManager.connect(master).createEventPlace(
    ...createEventPlaceRequestAsArguments({
      ...defaultCreateEventPlaceRequest,
      ...patch,
    }),
  );
  const receipt = await tx.wait();
  assert(receipt != null);
  const event = receipt.logs
    .filter((e): e is EventLog => "fragment" in e && "args" in e)
    .find((e) => e.fragment?.name === "NewEventPlaceAvailable");
  assert(event != null, "NewEventPlaceAvailable wasn't emitted");
  return { tx, eventPlaceId: event.args.eventPlaceId };
}

export async function createValidEventPlace(
  eventManager: CyberValleyEventManager,
  master: Signer,
): Promise<EventPlaceCreated> {
  return await createEventPlace(
    eventManager,
    master,
    defaultCreateEventPlaceRequest,
  );
}

export async function updateEventPlace(
  eventManager: CyberValleyEventManager,
  master: Signer,
  request: UpdateEventPlaceRequest,
) {
  return await eventManager
    .connect(master)
    .updateEventPlace(...updateEventPlaceRequestAsArguments(request));
}

export async function createAndUpdateEventPlace(
  eventManager: CyberValleyEventManager,
  master: Signer,
  maybeUpdateEventPlaceRequest?: UpdateEventPlaceRequest,
) {
  const { eventPlaceId } = await createValidEventPlace(eventManager, master);
  return await updateEventPlace(
    eventManager,
    master,
    maybeUpdateEventPlaceRequest || {
      ...defaultUpdateEventPlaceRequest,
      eventPlaceId,
    },
  );
}

export async function createEvent(
  eventManager: CyberValleyEventManager,
  ERC20: SimpleERC20Xylose,
  master: Signer,
  creator: Signer,
  eventPlacePatch: Partial<CreateEventPlaceRequest>,
  submitEventPatch: Partial<EventRequest>,
  approveEventPatch: Partial<ApproveEventRequest>
): Promise<{
  request: EventRequest;
  tx: Promise<ContractTransactionResponse>;
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
    master,
    eventPlacePatch,
  );

  // Submit request
  const { tx: submitEventRequestTx, request } = await submitEventRequest(
    eventManager,
    creator,
    submitEventPatch,
  );
  await submitEventRequestTx;

  // Approve
  const tx = eventManager.connect(master).approveEvent(...approveEventRequestAsArguments({id: request.id, ...approveEventPatch}));
  return { request, tx };
}

export async function submitEventRequest(
  eventManager: CyberValleyEventManager,
  creator: Signer,
  patch: Partial<EventRequest>,
): Promise<{
  request: EventRequest;
  tx: Promise<ContractTransactionResponse>;
}> {
  const request = {
    ...defaultSubmitEventRequest,
    ...patch,
  };
  assert(request.eventPlaceId != null);
  const tx = eventManager
    .connect(creator)
    .submitEventRequest(...eventRequestAsArguments(request));
  return { request, tx };
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

export function timestamp(daysFromNow: number): BigNumberish {
  return Math.floor(
    new Date(new Date().setDate(new Date().getDate() + daysFromNow)).setHours(
      0,
      0,
      0,
      0,
    ) / 1000,
  );
}

export function stringify<T>(obj: T): string {
  return JSON.stringify(obj, (_, v) =>
    typeof v === "bigint" ? v.toString() : v,
  );
}
