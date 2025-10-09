import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  cancelEvent,
  closeEvent,
  createAndCancelEvent,
  createAndCloseEvent,
  createAndUpdateEventPlace,
  createEvent,
  createEventPlace,
  createValidEventPlace,
  deployContract,
  itExpectsOnlyLocalProvider,
  itExpectsOnlyMaster,
  loadFixture,
  submitEventRequest,
  timestamp,
} from "./helpers";

import {
  createEventPlaceArgsToArray,
  submitEventRequestArgsToArray,
  updateEventPlaceArgsToArray,
} from "./types";

import {
  defaultCreateEventPlaceRequest,
  defaultSubmitEventRequest,
  defaultUpdateEventPlaceRequest,
  eventRequestSubmitionPrice,
} from "./data";

import {
  createEventPlaceCornerCases,
  getSubmitEventCases,
  getSubmitEventDateRangeOverlapCornerCases,
} from "./corner-cases";

describe("CyberValleyEventManager", () => {
  describe("setMasterShare", () => {
    itExpectsOnlyMaster("setMasterShare", [50]);

    it("sets master share value", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      await eventManager.connect(master).setMasterShare(75);
      expect(await eventManager.masterShare()).to.equal(75);
    });

    it("reverts when share is 0", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      await expect(
        eventManager.connect(master).setMasterShare(0),
      ).to.be.revertedWith("share should be greater than 0");
    });

    it("reverts when share is greater than 100", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      await expect(
        eventManager.connect(master).setMasterShare(101),
      ).to.be.revertedWith("share should be less or equal to 100");
    });
  });

  describe("createEventPlace", () => {
    itExpectsOnlyLocalProvider(
      "createEventPlace",
      createEventPlaceArgsToArray(defaultCreateEventPlaceRequest),
    );

    it("should emit EventPlaceUpdated", async () => {
      const { eventManager, localProvider } = await loadFixture(deployContract);
      const { tx } = await createValidEventPlace(eventManager, localProvider);
      await expect(tx)
        .to.emit(eventManager, "EventPlaceUpdated")
        .withArgs(
          await localProvider.getAddress(),
          0,
          ...createEventPlaceArgsToArray(defaultCreateEventPlaceRequest),
        );
    });

    createEventPlaceCornerCases.forEach(({ patch, revertedWith }, idx) =>
      it(`should validate invariants. Case ${idx + 1}: ${JSON.stringify(patch)}`, async () => {
        const { eventManager, localProvider } =
          await loadFixture(deployContract);
        await expect(
          createEventPlace(eventManager, localProvider, {
            ...defaultCreateEventPlaceRequest,
            ...patch,
          }),
        ).to.be.revertedWith(revertedWith);
      }),
    );
  });

  describe("updateEventPlace", () => {
    itExpectsOnlyLocalProvider(
      "updateEventPlace",
      updateEventPlaceArgsToArray(defaultUpdateEventPlaceRequest),
    );

    it("should emit EventPlaceUpdated", async () => {
      const { eventManager, localProvider } = await loadFixture(deployContract);
      const tx = await createAndUpdateEventPlace(
        eventManager,
        localProvider,
        {},
      );
      await expect(tx)
        .to.emit(eventManager, "EventPlaceUpdated")
        .withArgs(
          await localProvider.getAddress(),
          ...updateEventPlaceArgsToArray(defaultUpdateEventPlaceRequest),
        );
    });

    createEventPlaceCornerCases.forEach(({ patch, revertedWith }, idx) =>
      it(`should validate invariants. Case ${idx + 1}: ${JSON.stringify(patch)}`, async () => {
        const { eventManager, localProvider } =
          await loadFixture(deployContract);
        await expect(
          createAndUpdateEventPlace(eventManager, localProvider, {
            ...defaultUpdateEventPlaceRequest,
            ...patch,
          }),
        ).to.be.revertedWith(revertedWith);
      }),
    );
  });

  describe("submitEventRequest", () => {
    it("emits NewEventRequest", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      const { eventPlaceId } = await createEventPlace(
        eventManager,
        localProvider,
      );
      const { request, tx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        {
          eventPlaceId,
        },
      );
      await expect(tx)
        .to.emit(eventManager, "NewEventRequest")
        .withArgs(
          await getEventId(),
          await creator.getAddress(),
          ...submitEventRequestArgsToArray(request),
        );
    });

    it("transfers ERC20 token", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await expect(
        await ERC20.balanceOf(await eventManager.getAddress()),
      ).to.equal(0);
      const { eventPlaceId, tx: createEventPlaceTx } = await createEventPlace(
        eventManager,
        localProvider,
      );
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      const { tx } = await submitEventRequest(eventManager, creator, {
        eventPlaceId,
      });
      await expect(tx).to.changeTokenBalances(
        ERC20,
        [await eventManager.getAddress(), await creator.getAddress()],
        [eventRequestSubmitionPrice, -eventRequestSubmitionPrice],
      );
    });

    it("reverts on insufficient funds", async () => {
      const { eventManager, localProvider, creator } =
        await loadFixture(deployContract);
      const { eventPlaceId } = await createEventPlace(
        eventManager,
        localProvider,
        {
          ...defaultCreateEventPlaceRequest,
        },
      );
      const { tx } = await submitEventRequest(eventManager, creator, {
        eventPlaceId,
      });
      await expect(tx).to.be.revertedWith("Not enough tokens");
    });

    for (const idx of [0, 1, 2, 3, 4]) {
      it(`validation case ${idx + 1}`, async () => {
        const cases = await getSubmitEventCases(timestamp);
        const testCase = cases[idx];
        if (!testCase) return;
        const { eventPlacePatch, eventRequestPatch, revertsWith } = testCase;
        const { eventManager, ERC20, localProvider, creator } =
          await loadFixture(deployContract);
        await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
        await ERC20.connect(creator).approve(
          await eventManager.getAddress(),
          eventRequestSubmitionPrice,
        );

        const { eventPlaceId } = await createEventPlace(
          eventManager,
          localProvider,
          eventPlacePatch,
        );
        const { tx } = await submitEventRequest(eventManager, creator, {
          eventPlaceId,
          ...eventRequestPatch,
        });
        if (revertsWith == null) {
          await expect(tx).to.not.be.reverted;
        } else {
          await expect(tx).to.be.revertedWith(revertsWith);
        }
      });
    }

    for (const idx of [0, 1, 2]) {
      it(`reverts on overlap: Case ${idx}`, async () => {
        const cases =
          await getSubmitEventDateRangeOverlapCornerCases(timestamp);
        const { approvedEventPatch, submittedEventPatch } = cases[idx];
        const { eventManager, ERC20, localProvider, creator } =
          await loadFixture(deployContract);
        const { tx: createEventTx } = await createEvent(
          eventManager,
          ERC20,
          localProvider,
          creator,
          {},
          approvedEventPatch,
          {},
        );
        await createEventTx;
        await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
        await ERC20.connect(creator).approve(
          await eventManager.getAddress(),
          eventRequestSubmitionPrice,
        );
        const { tx } = await submitEventRequest(
          eventManager,
          creator,
          submittedEventPatch,
        );
        await expect(tx).to.be.revertedWith(
          "Requested event overlaps with existing",
        );
      });
    }
  });

  describe("approveEvent", () => {
    itExpectsOnlyLocalProvider("approveEvent", [BigInt(0)]);

    it("emits EventStatusChanged", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      const { request, tx, eventId } = await createEvent(
        eventManager,
        ERC20,
        localProvider,
        creator,
        {},
        {},
        {},
      );
      await expect(tx)
        .to.emit(eventManager, "EventStatusChanged")
        .withArgs(eventId, 1);
    });

    it("reverts on unexisting event request", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      const { tx } = await createEvent(
        eventManager,
        ERC20,
        localProvider,
        creator,
        {},
        {},
        { eventId: BigInt(1000 + Math.floor(Math.random() * 1000)) },
      );
      await expect(tx).to.be.revertedWith("Event with given id does not exist");
    });
  });

  describe("declineEvent", () => {
    itExpectsOnlyLocalProvider("declineEvent", [BigInt(0)]);

    it("emits EventStatusChanged", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      await createEventPlace(eventManager, localProvider);
      const { request, tx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        {},
      );
      const eventId = await getEventId();
      await expect(
        await eventManager.connect(localProvider).declineEvent(eventId),
      )
        .to.emit(eventManager, "EventStatusChanged")
        .withArgs(eventId, 2);
    });

    it("reverts on unexisting event request", async () => {
      const { eventManager, localProvider } = await loadFixture(deployContract);
      await expect(
        eventManager
          .connect(localProvider)
          .declineEvent(Math.floor(Math.random() * 1000)),
      ).to.be.revertedWith("Event with given id does not exist");
    });

    it("refunds tokens to creator", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      await createEventPlace(eventManager, localProvider);
      const { request, tx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        {},
      );
      await tx;
      await expect(
        await eventManager
          .connect(localProvider)
          .declineEvent(await getEventId()),
      ).to.changeTokenBalances(
        ERC20,
        [await eventManager.getAddress(), await creator.getAddress()],
        [-eventRequestSubmitionPrice, eventRequestSubmitionPrice],
      );
    });
  });

  describe("updateEvent", () => {
    itExpectsOnlyLocalProvider("updateEvent", [
      BigInt(0),
      ...submitEventRequestArgsToArray(defaultSubmitEventRequest),
    ]);

    it("emits EventUpdated", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      const { eventId } = await createEvent(
        eventManager,
        ERC20,
        localProvider,
        creator,
        {},
        { startDate: timestamp(5), daysAmount: 3 },
        {},
      );
      const updatedRequest = {
        ...defaultSubmitEventRequest,
        startDate: timestamp(10),
        daysAmount: 2,
        ticketPrice: 50,
      };
      const tx = await eventManager
        .connect(localProvider)
        .updateEvent(eventId, ...submitEventRequestArgsToArray(updatedRequest));
      await expect(tx)
        .to.emit(eventManager, "EventUpdated")
        .withArgs(eventId, ...submitEventRequestArgsToArray(updatedRequest));
    });

    it("reverts on unexisting event", async () => {
      const { eventManager, localProvider } = await loadFixture(deployContract);
      const nonExistentEventId = BigInt(9999);
      await expect(
        eventManager
          .connect(localProvider)
          .updateEvent(
            nonExistentEventId,
            ...submitEventRequestArgsToArray(defaultSubmitEventRequest),
          ),
      ).to.be.revertedWith("Event with given id does not exist");
    });

    it("checks date ranges overlap", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      const { eventId: firstEventId } = await createEvent(
        eventManager,
        ERC20,
        localProvider,
        creator,
        {},
        { startDate: timestamp(5), daysAmount: 4 },
        {},
      );
      const { eventId: secondEventId } = await createEvent(
        eventManager,
        ERC20,
        localProvider,
        creator,
        {},
        { startDate: timestamp(15), daysAmount: 4 },
        {},
      );
      const updatedRequest = {
        ...defaultSubmitEventRequest,
        startDate: timestamp(5),
        daysAmount: 4,
      };
      await expect(
        eventManager
          .connect(localProvider)
          .updateEvent(
            secondEventId,
            ...submitEventRequestArgsToArray(updatedRequest),
          ),
      ).to.be.revertedWith("Requested event overlaps with existing");
    });
  });

  describe("mintTicket", () => {
    it("emits TicketMinted", async () => {
      const {
        eventManager,
        eventTicket,
        ERC20,
        localProvider,
        creator,
        owner,
      } = await loadFixture(deployContract);
      const { eventId } = await createEvent(
        eventManager,
        ERC20,
        localProvider,
        creator,
        {},
        {},
        {},
      );
      const ticketPrice = 20;
      const multihash = {
        digest:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        hashFunction: 18,
        size: 32,
      };
      await ERC20.connect(owner).mint(ticketPrice);
      await ERC20.connect(owner).approve(
        await eventManager.getAddress(),
        ticketPrice,
      );
      const tx = await eventManager
        .connect(owner)
        .mintTicket(
          eventId,
          multihash.digest,
          multihash.hashFunction,
          multihash.size,
        );
      await expect(tx).to.emit(eventTicket, "TicketMinted");
    });

    it("reverts on sold out", async () => {
      const { eventManager, ERC20, localProvider, creator, owner } =
        await loadFixture(deployContract);
      const { eventId } = await createEvent(
        eventManager,
        ERC20,
        localProvider,
        creator,
        { maxTickets: 1, minTickets: 1 },
        {},
        {},
      );
      const ticketPrice = 20;
      const multihash = {
        digest:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        hashFunction: 18,
        size: 32,
      };
      await ERC20.connect(owner).mint(ticketPrice * 2);
      await ERC20.connect(owner).approve(
        await eventManager.getAddress(),
        ticketPrice * 2,
      );
      await eventManager
        .connect(owner)
        .mintTicket(
          eventId,
          multihash.digest,
          multihash.hashFunction,
          multihash.size,
        );
      await expect(
        eventManager
          .connect(owner)
          .mintTicket(
            eventId,
            multihash.digest,
            multihash.hashFunction,
            multihash.size,
          ),
      ).to.be.revertedWith("Sold out");
    });

    it("transfers required amount of tokens", async () => {
      const { eventManager, ERC20, localProvider, creator, owner } =
        await loadFixture(deployContract);
      const { eventId } = await createEvent(
        eventManager,
        ERC20,
        localProvider,
        creator,
        {},
        {},
        {},
      );
      const ticketPrice = 20;
      const multihash = {
        digest:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        hashFunction: 18,
        size: 32,
      };
      await ERC20.connect(owner).mint(ticketPrice);
      await ERC20.connect(owner).approve(
        await eventManager.getAddress(),
        ticketPrice,
      );
      const tx = await eventManager
        .connect(owner)
        .mintTicket(
          eventId,
          multihash.digest,
          multihash.hashFunction,
          multihash.size,
        );
      await expect(tx).to.changeTokenBalances(
        ERC20,
        [await eventManager.getAddress(), await owner.getAddress()],
        [ticketPrice, -ticketPrice],
      );
    });

    it("mints NFT with proper metadata", async () => {
      const {
        eventManager,
        eventTicket,
        ERC20,
        localProvider,
        creator,
        owner,
      } = await loadFixture(deployContract);
      const { eventId, tx: createEventTx } = await createEvent(
        eventManager,
        ERC20,
        localProvider,
        creator,
        {},
        {},
        {},
      );
      await createEventTx;
      const ticketPrice = 20;
      const multihash = {
        digest:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        hashFunction: 18,
        size: 32,
      };
      await ERC20.connect(owner).mint(ticketPrice);
      await ERC20.connect(owner).approve(
        await eventManager.getAddress(),
        ticketPrice,
      );
      const tx = eventManager
        .connect(owner)
        .mintTicket(
          eventId,
          multihash.digest,
          multihash.hashFunction,
          multihash.size,
        );
      await expect(tx)
        .to.emit(eventTicket, "TicketMinted")
        .withArgs(
          eventId,
          1,
          await owner.getAddress(),
          multihash.digest,
          multihash.hashFunction,
          multihash.size,
        );
    });
  });

  describe("closeEvent", () => {
    itExpectsOnlyLocalProvider("closeEvent", [BigInt(0)]);

    it("emits EventStatusChanged", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCloseEvent(
        eventManager,
        ERC20,
        localProvider,
        creator,
        {},
      );
      await expect(tx)
        .to.emit(eventManager, "EventStatusChanged")
        .withArgs(request.eventId, 4);
    });

    it("reverts on unexisting event", async () => {
      const { eventManager, localProvider } = await loadFixture(deployContract);
      const { tx } = await closeEvent(eventManager, localProvider, {
        eventId: Math.floor(Math.random() * 1000),
      });
      await expect(tx).to.be.revertedWith("Event with given id does not exist");
    });

    it("reverts to close cancelled event", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCancelEvent(
        eventManager,
        ERC20,
        localProvider,
        creator,
        {},
      );
      await tx;
      const { tx: closeEventTx } = await closeEvent(
        eventManager,
        localProvider,
        request,
      );
      await expect(closeEventTx).to.be.revertedWith(
        "Only event in approved state can be closed",
      );
    });

    it("reverts to close closed event", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCloseEvent(
        eventManager,
        ERC20,
        localProvider,
        creator,
        {},
      );
      await tx;
      const { tx: closeEventTx } = await closeEvent(
        eventManager,
        localProvider,
        request,
      );
      await expect(closeEventTx).to.be.revertedWith(
        "Only event in approved state can be closed",
      );
    });

    it("reverts to close submitted event", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      const { eventPlaceId } = await createEventPlace(
        eventManager,
        localProvider,
      );
      const { request, tx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        {
          eventPlaceId,
        },
      );
      await tx;
      const { tx: closeEventTx } = await closeEvent(
        eventManager,
        localProvider,
        {
          eventId: await getEventId(),
        },
      );
      await expect(closeEventTx).to.be.revertedWith(
        "Only event in approved state can be closed",
      );
    });

    it("reverts to close declined event", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      await createEventPlace(eventManager, localProvider);
      const { request, tx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        {},
      );
      const eventId = await getEventId();
      const { tx: closeEventTx } = await closeEvent(
        eventManager,
        localProvider,
        {
          eventId,
        },
      );
      await expect(closeEventTx).to.be.revertedWith(
        "Only event in approved state can be closed",
      );
    });

    it("reverts if event was not finished", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
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
      const { tx } = await closeEvent(eventManager, localProvider, { eventId });
      await expect(tx).to.be.revertedWith("Event has not been finished yet");
    });

    it("proportionally spreads funds", async () => {
      const { eventManager, ERC20, master, localProvider, creator } =
        await loadFixture(deployContract);
      const { tx } = await createAndCloseEvent(
        eventManager,
        ERC20,
        localProvider,
        creator,
        {},
      );
      const totalFunds = Number(eventRequestSubmitionPrice);
      const masterAmount = Math.floor((totalFunds * 50) / 100);
      const remainder = totalFunds - masterAmount;
      const providerAmount = Math.floor((remainder * 100) / 100);
      await expect(tx).to.changeTokenBalances(
        ERC20,
        [
          await master.getAddress(),
          await localProvider.getAddress(),
          await eventManager.getAddress(),
        ],
        [masterAmount, providerAmount, -(masterAmount + providerAmount)],
      );
    });
  });

  describe("cancelEvent", () => {
    itExpectsOnlyLocalProvider("cancelEvent", [BigInt(0)]);

    it("emits EventStatusChanged", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCancelEvent(
        eventManager,
        ERC20,
        localProvider,
        creator,
        {},
      );
      await expect(tx)
        .to.emit(eventManager, "EventStatusChanged")
        .withArgs(request.eventId, 3);
    });

    it("reverts to cancel cancelled event", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCancelEvent(
        eventManager,
        ERC20,
        localProvider,
        creator,
        {},
      );
      await tx;
      const { tx: cancelEventTx } = await cancelEvent(
        eventManager,
        localProvider,
        request,
      );
      await expect(cancelEventTx).to.be.revertedWith(
        "Only event in approved state can be cancelled",
      );
    });

    it("reverts to cancel closed event", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCancelEvent(
        eventManager,
        ERC20,
        localProvider,
        creator,
        {},
      );
      await tx;
      const { tx: cancelEventTx } = await cancelEvent(
        eventManager,
        localProvider,
        request,
      );
      await expect(cancelEventTx).to.be.revertedWith(
        "Only event in approved state can be cancelled",
      );
    });

    it("reverts to cancel submitted event", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      const { eventPlaceId } = await createEventPlace(
        eventManager,
        localProvider,
      );
      const { request, tx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        {
          eventPlaceId,
        },
      );
      await tx;
      const { tx: cancelEventTx } = await cancelEvent(
        eventManager,
        localProvider,
        {
          eventId: await getEventId(),
        },
      );
      await expect(cancelEventTx).to.be.revertedWith(
        "Only event in approved state can be cancelled",
      );
    });

    it("reverts to cancel declined event", async () => {
      const { eventManager, ERC20, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      await createEventPlace(eventManager, localProvider);
      const { request, tx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        {},
      );
      const eventId = await getEventId();
      const { tx: cancelEventTx } = await cancelEvent(
        eventManager,
        localProvider,
        {
          eventId,
        },
      );
      await expect(cancelEventTx).to.be.revertedWith(
        "Only event in approved state can be cancelled",
      );
    });

    it("refunds tokens to owners and local provider", async () => {
      const { eventManager, ERC20, master, localProvider, creator, staff } =
        await loadFixture(deployContract);

      const allSigners = await ethers.getSigners();
      const customer1 = allSigners[5];
      const customer2 = allSigners[6];
      const customer3 = allSigners[7];

      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );

      const { eventPlaceId } = await createEventPlace(
        eventManager,
        localProvider,
        {
          maxTickets: 100,
          minTickets: 1,
          minPrice: 10,
        },
      );

      const { tx: submitEventRequestTx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        {
          eventPlaceId,
          ticketPrice: 10,
        },
      );
      await submitEventRequestTx;
      const eventId = await getEventId();

      await eventManager.connect(localProvider).approveEvent(eventId);

      const customers = [customer1, customer2, customer3];
      const ticketsPerCustomer = [2, 3, 1];
      const totalTickets = ticketsPerCustomer.reduce((a, b) => a + b, 0);

      const multihash = {
        digest:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        hashFunction: 18,
        size: 32,
      };

      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        const ticketCount = ticketsPerCustomer[i];
        const totalCost = ticketCount * 10;

        await ERC20.connect(customer).mint(totalCost);
        await ERC20.connect(customer).approve(
          await eventManager.getAddress(),
          totalCost,
        );

        for (let j = 0; j < ticketCount; j++) {
          await eventManager
            .connect(customer)
            .mintTicket(
              eventId,
              multihash.digest,
              multihash.hashFunction,
              multihash.size,
            );
        }
      }

      const { tx: cancelTx } = await cancelEvent(eventManager, localProvider, {
        eventId,
      });

      const eventRequestPrice = Number(eventRequestSubmitionPrice);

      await expect(cancelTx).to.changeTokenBalances(
        ERC20,
        [
          await master.getAddress(),
          await localProvider.getAddress(),
          await creator.getAddress(),
          await customer1.getAddress(),
          await customer2.getAddress(),
          await customer3.getAddress(),
          await eventManager.getAddress(),
        ],
        [
          0,
          eventRequestPrice,
          0,
          ticketsPerCustomer[0] * 10,
          ticketsPerCustomer[1] * 10,
          ticketsPerCustomer[2] * 10,
          -(eventRequestPrice + totalTickets * 10),
        ],
      );
    });
  });

  describe("Fund Distribution", () => {
    const testDistribution = async (
      totalAmount: number,
      masterSharePercent: number,
      providerSharePercent: number,
    ) => {
      const {
        ERC20,
        eventManager,
        eventTicket,
        master,
        localProvider,
        creator,
        staff,
      } = await loadFixture(deployContract);

      await eventManager.connect(master).setMasterShare(masterSharePercent);
      await eventManager
        .connect(master)
        .grantLocalProvider(
          await localProvider.getAddress(),
          providerSharePercent,
        );

      // Mint tokens for event submission (100 tokens)
      await ERC20.connect(creator).mint(100);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        100,
      );

      const { eventPlaceId } = await createEventPlace(
        eventManager,
        localProvider,
        {
          maxTickets: 1000,
          minTickets: 1,
          minPrice: 1,
        },
      );

      // Submit event with ticket price = 1 token
      const { tx: submitEventRequestTx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        {
          eventPlaceId,
          ticketPrice: 1,
        },
      );
      await submitEventRequestTx;
      const eventId = await getEventId();

      await eventManager.connect(localProvider).approveEvent(eventId);

      // Buy exactly totalAmount tickets to reach the desired amount
      await ERC20.connect(staff).mint(totalAmount);
      await ERC20.connect(staff).approve(
        await eventManager.getAddress(),
        totalAmount,
      );

      const multihash = {
        digest:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        hashFunction: 18,
        size: 32,
      };

      for (let i = 0; i < totalAmount; i++) {
        await eventManager
          .connect(staff)
          .mintTicket(
            eventId,
            multihash.digest,
            multihash.hashFunction,
            multihash.size,
          );
      }

      await time.increase(100_000_000);

      const tx = await eventManager.connect(localProvider).closeEvent(eventId);

      // Total funds = submission price (100) + ticket sales (totalAmount)
      const actualTotalAmount = 100 + totalAmount;

      const masterAmount = Math.floor(
        (actualTotalAmount * masterSharePercent) / 100,
      );
      const remainder = actualTotalAmount - masterAmount;
      const providerAmount = Math.floor(
        (remainder * providerSharePercent) / 100,
      );
      const dust = actualTotalAmount - masterAmount - providerAmount;
      const finalMasterAmount = masterAmount + dust;

      await expect(tx).to.changeTokenBalances(
        ERC20,
        [
          await master.getAddress(),
          await localProvider.getAddress(),
          await eventManager.getAddress(),
        ],
        [finalMasterAmount, providerAmount, -actualTotalAmount],
      );

      expect(finalMasterAmount + providerAmount).to.equal(actualTotalAmount);
    };

    it("distributes 100 tokens correctly (50/50 split)", async () => {
      await testDistribution(100, 50, 100);
    });

    it("distributes 1 token correctly (rounds to master)", async () => {
      await testDistribution(1, 50, 100);
    });

    it("distributes 3 tokens correctly (odd number)", async () => {
      await testDistribution(3, 50, 100);
    });

    it("distributes 99 tokens correctly (large odd)", async () => {
      await testDistribution(99, 50, 100);
    });

    it("distributes with 30/70 master/provider split", async () => {
      await testDistribution(100, 30, 100);
    });

    it("distributes with 70/30 master/provider split", async () => {
      await testDistribution(100, 70, 100);
    });

    it("distributes with 33/50 master/provider split", async () => {
      await testDistribution(100, 33, 50);
    });

    it("distributes random amount: 137 tokens", async () => {
      await testDistribution(137, 50, 100);
    });

    it("distributes random amount: 271 tokens", async () => {
      await testDistribution(271, 50, 100);
    });

    it("distributes with provider getting 25% of remainder", async () => {
      await testDistribution(100, 50, 25);
    });
  });
});
