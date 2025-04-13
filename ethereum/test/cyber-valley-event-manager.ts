import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { assert, Assertion, expect } from "chai";
import type { BaseContract, Signer } from "ethers";
import hre from "hardhat";
import {
  type CyberValleyEventManager,
  CyberValleyEventTicket,
  type SimpleERC20Xylose,
} from "../typechain-types";

type ContractsFixture = {
  sex: SimpleERC20Xylose & BaseContract;
  eventManager: CyberValleyEventManager & BaseContract;
  owner: Signer;
  master: Signer;
  devTeam: Signer;
};

describe("CyberValleyEventManager", () => {
  const devTeamPercentage = 10;
  const masterPercentage = 50;
  const createEventPlaceRequest = {
    maxTickets: 100,
    minTickets: 50,
    minPrice: 20,
    minDays: 1,
  };
  type CreateEventPlaceRequest = typeof createEventPlaceRequest;

  const updateEventPlaceRequest = {
    eventPlaceId: 0,
    maxTickets: 150,
    minTickets: 20,
    minPrice: 30,
    minDays: 2,
  };
  type UpdateEventPlaceRequest = typeof updateEventPlaceRequest;

  function asArguments(
    req: CreateEventPlaceRequest | UpdateEventPlaceRequest,
  ): number[] {
    if ("eventPlaceId" in req) {
      return [
        req.eventPlaceId,
        req.maxTickets,
        req.minTickets,
        req.minPrice,
        req.minDays,
      ];
    }
    return [req.maxTickets, req.minTickets, req.minPrice, req.minDays];
  }

  const eventPlaceCornerCases = [
    {
      patch: {
        minTickets: 0,
      },
      revertedWith: "Values must be greater than zero",
    },
    {
      patch: {
        minTickets: 0,
        maxTickets: 0,
      },
      revertedWith: "Values must be greater than zero",
    },
    {
      patch: {
        minTickets: 5,
        maxTickets: 0,
      },
      revertedWith: "Max tickets must be greater or equal min tickets",
    },
    {
      patch: {
        minPrice: 0,
      },
      revertedWith: "Values must be greater than zero",
    },
    {
      patch: {
        minDays: 0,
      },
      revertedWith: "Values must be greater than zero",
    },
  ];

  async function deployContract(): Promise<ContractsFixture> {
    console.log("Deploying contract");
    const [owner, master, devTeam] = await hre.ethers.getSigners();
    const sex = await hre.ethers.deployContract("SimpleERC20Xylose");
    const CyberValleyEventManagerFactory = await hre.ethers.getContractFactory(
      "CyberValleyEventManager",
    );
    const eventManager = await CyberValleyEventManagerFactory.deploy(
      await sex.getAddress(),
      master,
      50,
      devTeam,
      10,
    );
    return { sex, eventManager, owner, master, devTeam };
  }

  async function createEventPlace(
    eventManager: CyberValleyEventManager,
    master: Signer,
    request: CreateEventPlaceRequest,
  ) {
    return await eventManager
      .connect(master)
      .createEventPlace(...asArguments(request));
  }

  async function createValidEventPlace(
    eventManager: CyberValleyEventManager,
    master: Signer,
  ) {
    return await createEventPlace(
      eventManager,
      master,
      createEventPlaceRequest,
    );
  }

  async function updateEventPlace(
    eventManager: CyberValleyEventManager,
    master: Signer,
    request: UpdateEventPlaceRequest,
  ) {
    return await eventManager
      .connect(master)
      .updateEventPlace(...asArguments(request));
  }

  async function createAndUpdateEventPlace(
    eventManager: CyberValleyEventManager,
    master: Signer,
    maybeUpdateEventPlaceRequest?: UpdateEventPlaceRequest,
  ) {
    const tx = await createValidEventPlace(eventManager, master);
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (e) => e.fragment?.name === "NewEventPlaceAvailable",
    );
    assert(event != null, "NewEventPlaceAvailable wasn't emitted");
    return await updateEventPlace(
      eventManager,
      master,
      maybeUpdateEventPlaceRequest || {
        ...updateEventPlaceRequest,
        eventPlaceId: event.args.eventPlaceId,
      },
    );
  }

  /**
   * The fuck do u mean that expect works only inside of `it`
   * i.e. it raises `AssertionError`, but the runner doesn't care and ignore it
   */
  function itExpectsOnlyMaster(methodName, request) {
    it(`${methodName} allowed only to master`, async () => {
      const { eventManager } = await loadFixture(deployContract);
      const method = eventManager[methodName];
      assert(method != null);
      await expect(method.apply(eventManager, request)).to.be.revertedWith(
        "Must have master role",
      );
    });
  }

  describe("createEventPlace", () => {
    itExpectsOnlyMaster(
      "createEventPlace",
      asArguments(createEventPlaceRequest),
    );

    it("should emit NewEventPlaceAvailable", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      await expect(await createValidEventPlace(eventManager, master))
        .to.emit(eventManager, "NewEventPlaceAvailable")
        .withArgs(0, ...asArguments(createEventPlaceRequest));
    });

    eventPlaceCornerCases.forEach(({ patch, revertedWith }, idx) =>
      it(`should validate invariants. Case ${idx + 1}: ${JSON.stringify(patch)}`, async () => {
        const { eventManager, master } = await loadFixture(deployContract);
        await expect(
          createEventPlace(eventManager, master, {
            ...createEventPlaceRequest,
            ...patch,
          }),
        ).to.be.revertedWith(revertedWith);
      }),
    );
  });

  describe("updateEventPlace", () => {
    itExpectsOnlyMaster(
      "updateEventPlace",
      asArguments(updateEventPlaceRequest),
    );

    it("should emit NewEventPlaceAvailable", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      const tx = await createAndUpdateEventPlace(eventManager, master);
      await expect(tx)
        .to.emit(eventManager, "EventPlaceUpdated")
        .withArgs(...asArguments(updateEventPlaceRequest));
    });

    eventPlaceCornerCases.forEach(({ patch, revertedWith }, idx) =>
      it(`should validate invariants. Case ${idx + 1}: ${JSON.stringify(patch)}`, async () => {
        const { eventManager, master } = await loadFixture(deployContract);
        await expect(
          createAndUpdateEventPlace(eventManager, master, {
            ...updateEventPlaceRequest,
            ...patch,
          }),
        ).to.be.revertedWith(revertedWith);
      }),
    );
  });
});
