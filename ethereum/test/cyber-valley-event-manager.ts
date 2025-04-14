import { keccak256 } from "@ethersproject/keccak256";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { assert, Assertion, expect } from "chai";
import type { BaseContract, ContractTransaction, Signer } from "ethers";
import fc from "fast-check";
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
  creator: Signer;
};

describe("CyberValleyEventManager", () => {
  const devTeamPercentage = 10;
  const masterPercentage = 50;
  const eventRequestSubmitionPrice = 100;
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

  function eventRequestAsArguments(req: EventRequest) {
    return [
      req.id,
      req.eventPlaceId,
      req.ticketPrice,
      req.startDate,
      req.cancelDate,
      req.daysAmount,
    ];
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
    const [owner, master, devTeam, creator] = await hre.ethers.getSigners();
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
    return { sex, eventManager, owner, master, devTeam, creator };
  }

  type EventPlaceCreated = {
    tx: ContractTransaction;
    eventPlaceId: number;
  };

  async function createEventPlace(
    eventManager: CyberValleyEventManager,
    master: Signer,
    patch: Partial<CreateEventPlaceRequest>,
  ): Promise<EventPlaceCreated> {
    const tx = await eventManager
      .connect(master)
      .createEventPlace(...asArguments({ ...createEventPlace, ...patch }));
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (e) => e.fragment?.name === "NewEventPlaceAvailable",
    );
    assert(event != null, "NewEventPlaceAvailable wasn't emitted");
    return { tx, eventPlaceId: event.args.eventPlaceId };
  }

  async function createValidEventPlace(
    eventManager: CyberValleyEventManager,
    master: Signer,
  ): Promise<EventPlaceCreated> {
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
    const { eventPlaceId } = await createValidEventPlace(eventManager, master);
    return await updateEventPlace(
      eventManager,
      master,
      maybeUpdateEventPlaceRequest || {
        ...updateEventPlaceRequest,
        eventPlaceId,
      },
    );
  }

  type EventRequest = {
    id: string;
    eventPlaceId: number;
    ticketPrice: number;
    startDate: number;
    cancelDate: number;
    daysAmount: number;
  };

  async function createEvent(
    eventManager: CyberValleyEventManager,
    master: Signer,
    creator: Signer,
    patch: Partial<EventRequest>,
  ): Promise<{ request: EventRequest; tx: ContractTransaction }> {
    const { request } = await submitEventRequest(eventManager, master, patch);
    const tx = eventManager.connect(master).approveEvent(request.id);
    return { request, tx };
  }

  async function submitEventRequest(
    eventManager: CyberValleyEventManager,
    creator: Signer,
    patch: Partial<EventRequest>,
  ): Promise<{ request: EventRequest; tx: ContractTransaction }> {
    const request = {
      ...defaultSubmitEventRequest,
      creatorAddress: creator,
      ...patch,
    };
    const tx = eventManager
      .connect(creator)
      .submitEvent(...eventRequestAsArguments(request));
    return { request, tx };
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
      const { tx } = await createValidEventPlace(eventManager, master);
      await expect(tx)
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

  describe("submitEventRequest", () => {
    it("emits NewEventRequest", async () => {});

    it("transfers funds to ERC20", async () => {});

    it("reverts on insufficient funds", async () => {
      const { eventManager, master, creator } =
        await loadFixture(deployContract);
      const { eventPlaceId } = await createEventPlace(eventManager, master, {
        ...createEventPlaceRequest,
      });
      const eventRequest = {
        id: Math.floor(Math.random() * 10e6),
        creatorAddress: creator.address,
        eventPlaceId,
        ticketPrice: createEventPlaceRequest.minPrice,
        startDate: 5,
        cancelDate: 3,
        daysAmount: createEventPlaceRequest.minDays,
      };
      await expect(
        eventManager
          .connect(creator)
          .submitEventRequest(...eventRequestAsArguments(eventRequest)),
      ).to.be.revertedWith(revertedWith);
    });

    it("reverts on incompatibale data with event place", async () => {
      const { eventManager, master, creator } =
        await loadFixture(deployContract);
      await expect(
        eventManager
          .connect(creator)
          .submitEventRequest({ ...submitEventRequestRequest, ...patch }),
      ).to.be.revertedWith(revertedWith);
    });

    it("reverts on date overlap in given event place", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      const minDaysAmount = 1;
      const maxDaysAmount = 5;
      for (
        let daysAmount = minDaysAmount;
        daysAmount < maxDaysAmount;
        daysAmount++
      ) {
        for (
          let approvedEventStart = minDaysAmount;
          approvedEventStart <= maxDaysAmount;
          approvedEventStart++
        ) {
          for (
            let requestedEventStart = approvedEventStart - daysAmount;
            requestedEventStart <= approvedEventStart + daysAmount;
            requestedEventStart++
          ) {
            const { eventPlaceId } = await createEventPlace(
              eventManager,
              master,
              { daysAmount },
            );
            const { approvedEventRequest } = await createEvent(
              eventManager,
              master,
              {
                eventPlaceId,
                startDate: approvedEventStart,
              },
            );
            const { tx } = await submitEventRequest(eventManager, master, {
              eventPlaceId,
              requestedEventStart,
            });
            await expect(tx).to.be.revertedWith(
              "Requested event overlaps with approved one",
            );
          }
        }
      }
    });
  });
});
