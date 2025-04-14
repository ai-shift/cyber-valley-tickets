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
  ERC20: SimpleERC20Xylose & BaseContract;
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
  const defaultCreateEventPlaceRequest = {
    maxTickets: 100,
    minTickets: 50,
    minPrice: 20,
    minDays: 1,
  };
  type CreateEventPlaceRequest = typeof defaultCreateEventPlaceRequest;

  const updateEventPlaceRequest = {
    eventPlaceId: 0,
    maxTickets: 150,
    minTickets: 20,
    minPrice: 30,
    minDays: 2,
  };
  type UpdateEventPlaceRequest = typeof updateEventPlaceRequest;

  const defaultSubmitEventRequest = {
    id: Math.floor(Math.random() * 10e6),
    ticketPrice: defaultCreateEventPlaceRequest.minPrice,
    startDate: 5,
    cancelDate: 3,
    daysAmount: defaultCreateEventPlaceRequest.minDays,
  };

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
    const ERC20 = await hre.ethers.deployContract("SimpleERC20Xylose");
    const CyberValleyEventManagerFactory = await hre.ethers.getContractFactory(
      "CyberValleyEventManager",
    );
    const eventManager = await CyberValleyEventManagerFactory.deploy(
      await ERC20.getAddress(),
      master,
      50,
      devTeam,
      10,
    );
    return { ERC20, eventManager, owner, master, devTeam, creator };
  }

  type EventPlaceCreated = {
    tx: ContractTransaction;
    eventPlaceId: number;
  };

  async function createEventPlace(
    eventManager: CyberValleyEventManager,
    master: Signer,
    patch?: Partial<CreateEventPlaceRequest>,
  ): Promise<EventPlaceCreated> {
    const tx = await eventManager
      .connect(master)
      .createEventPlace(
        ...asArguments({ ...defaultCreateEventPlaceRequest, ...patch }),
      );
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
      defaultCreateEventPlaceRequest,
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
      .submitEventRequest(...eventRequestAsArguments(request));
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
      asArguments(defaultCreateEventPlaceRequest),
    );

    it("should emit NewEventPlaceAvailable", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      const { tx } = await createValidEventPlace(eventManager, master);
      await expect(tx)
        .to.emit(eventManager, "NewEventPlaceAvailable")
        .withArgs(0, ...asArguments(defaultCreateEventPlaceRequest));
    });

    eventPlaceCornerCases.forEach(({ patch, revertedWith }, idx) =>
      it(`should validate invariants. Case ${idx + 1}: ${JSON.stringify(patch)}`, async () => {
        const { eventManager, master } = await loadFixture(deployContract);
        await expect(
          createEventPlace(eventManager, master, {
            ...defaultCreateEventPlaceRequest,
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
    it("emits NewEventRequest", async () => {
      const { eventManager, master, creator } =
        await loadFixture(deployContract);
      const { eventPlaceId } = await createEventPlace(eventManager, master);
      const { tx } = await submitEventRequest(eventManager, master, creator, {
        eventPlaceId,
      });
      await expect(tx)
        .to.emit(eventManager, "NewEventRequest")
        .withArgs(...asArguments(updateEventPlaceRequest));
    });

    it("transfers ERC20 token", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      const initialBalance = await ERC20.balanceOf(
        await eventManager.getAddress(),
      );
      assert(
        initialBalance == 0,
        `Initial balance should be zero, but it's ${initialBalance}`,
      );
      const { eventPlaceId } = await createEventPlace(eventManager, master);
      await submitEventRequest(eventManager, master, creator, { eventPlaceId });
      assert(
        (await ERC20.balanceOf(await eventManager.getAddress())) ===
          eventRequestSubmitionPrice,
      );
    });

    it("reverts on insufficient funds", async () => {
      const { eventManager, master, creator } =
        await loadFixture(deployContract);
      const { eventPlaceId } = await createEventPlace(eventManager, master, {
        ...defaultCreateEventPlaceRequest,
      });
      const eventRequest = {
        id: Math.floor(Math.random() * 10e6),
        creatorAddress: creator.address,
        eventPlaceId,
        ticketPrice: defaultCreateEventPlaceRequest.minPrice,
        startDate: 5,
        cancelDate: 3,
        daysAmount: defaultCreateEventPlaceRequest.minDays,
      };
      await expect(
        eventManager
          .connect(creator)
          .submitEventRequest(...eventRequestAsArguments(eventRequest)),
      ).to.be.revertedWith("Event request payment failed");
    });

    [
      {
        eventPlacePatch: {
          minPrice: 30,
        },
        eventRequestPatch: {
          ticketPrice: 20,
        },
        revertsWith: "Ticket price is less than allowed",
      },
      {
        eventPlacePatch: {
          minDays: 2,
        },
        eventRequestPatch: {
          daysAmount: 1,
        },
        revertsWith: "Days amount is less than allowed",
      },
      {
        eventPlacePatch: {},
        eventRequestPatch: {
          startDate: Math.floor(
            new Date(new Date().setDate(new Date().getDate() - 1)).setHours(
              0,
              0,
              0,
              0,
            ) / 1000,
          ),
        },
        revertsWith: "Requested event can't be in the past",
      },
      {
        evenPlacePatch: {},
        eventRequestPatch: {
          startDate: Math.floor(
            new Date(new Date().setDate(new Date().getDate() - 2)).setHours(
              0,
              0,
              0,
              0,
            ) / 1000,
          ),
          cancelDate: Math.floor(
            new Date(new Date().setDate(new Date().getDate() - 1)).setHours(
              0,
              0,
              0,
              0,
            ) / 1000,
          ),
        },
        revertsWith:
          "Cancel date should be at least one day before the start date",
      },
      {
        eventPlacePatch: {},
        eventRequestPatch: {
          startDate: Math.floor(
            new Date(new Date().setDate(new Date().getDate() + 300)).setHours(
              0,
              0,
              0,
              0,
            ) / 1000,
          ),
        },
        revertsWith: "Requested event is too far in the future",
      },
    ].forEach(({ eventPlacePatch, eventRequestPatch, revertsWith }, idx) =>
      it(`reverts on incompatibale data eventPlace: ${JSON.stringify(eventPlacePatch)}, eventRequest: ${JSON.stringify(eventRequestPatch)}`, async () => {
        const { eventManager, master, creator } =
          await loadFixture(deployContract);
        const { eventPlaceId } = await createEventPlace(
          eventManager,
          master,
          eventPlacePatch,
        );
        const { tx } = await submitEventRequest(eventManager, creator, {
          eventPlaceId,
            ...eventRequestPatch
        })
        await expect(
          tx
        ).to.be.revertedWith(revertsWith);
      }),
    );

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
