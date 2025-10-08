import { assert, expect } from "chai";
import type { EventLog } from "ethers";
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
  itExpectsOnlyMaster,
  loadFixture,
  stringify,
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
  submitEventCases,
  submitEventDateRangeOverlapCornerCases,
} from "./corner-cases";

describe("CyberValleyEventManager", () => {
  describe("createEventPlace", () => {
    itExpectsOnlyMaster(
      "createEventPlace",
      createEventPlaceArgsToArray(defaultCreateEventPlaceRequest),
    );

    it("should emit EventPlaceUpdated", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      const { tx } = await createValidEventPlace(eventManager, master);
      await expect(tx)
        .to.emit(eventManager, "EventPlaceUpdated")
        .withArgs(
          0,
          ...createEventPlaceArgsToArray(defaultCreateEventPlaceRequest),
        );
    });

    createEventPlaceCornerCases.forEach(({ patch, revertedWith }, idx) =>
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
      updateEventPlaceArgsToArray(defaultUpdateEventPlaceRequest),
    );

    it("should emit EventPlaceUpdated", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      const tx = await createAndUpdateEventPlace(eventManager, master, {});
      await expect(tx)
        .to.emit(eventManager, "EventPlaceUpdated")
        .withArgs(
          ...updateEventPlaceArgsToArray(defaultUpdateEventPlaceRequest),
        );
    });

    createEventPlaceCornerCases.forEach(({ patch, revertedWith }, idx) =>
      it(`should validate invariants. Case ${idx + 1}: ${JSON.stringify(patch)}`, async () => {
        const { eventManager, master } = await loadFixture(deployContract);
        await expect(
          createAndUpdateEventPlace(eventManager, master, {
            ...defaultUpdateEventPlaceRequest,
            ...patch,
          }),
        ).to.be.revertedWith(revertedWith);
      }),
    );
  });

  describe("submitEventRequest", () => {
    it("emits NewEventRequest", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      const { eventPlaceId } = await createEventPlace(eventManager, master);
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
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await expect(
        await ERC20.balanceOf(await eventManager.getAddress()),
      ).to.equal(0);
      const { eventPlaceId, tx: createEventPlaceTx } = await createEventPlace(
        eventManager,
        master,
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
      const { eventManager, master, creator } =
        await loadFixture(deployContract);
      const { eventPlaceId } = await createEventPlace(eventManager, master, {
        ...defaultCreateEventPlaceRequest,
      });
      const { tx } = await submitEventRequest(eventManager, creator, {
        eventPlaceId,
      });
      await expect(tx).to.be.revertedWith("Not enough tokens");
    });

    submitEventCases.forEach(
      ({ eventPlacePatch, eventRequestPatch, revertsWith }, idx) =>
        it(`eventPlace: ${JSON.stringify(eventPlacePatch)}, eventRequest: ${JSON.stringify(eventRequestPatch)}`, async () => {
          const { eventManager, ERC20, master, creator } =
            await loadFixture(deployContract);
          await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
          await ERC20.connect(creator).approve(
            await eventManager.getAddress(),
            eventRequestSubmitionPrice,
          );

          const { eventPlaceId } = await createEventPlace(
            eventManager,
            master,
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
        }),
    );

    submitEventDateRangeOverlapCornerCases.forEach(
      ({ approvedEventPatch, submittedEventPatch }, idx) =>
        it(`reverts on overlap: Case ${idx} approved: ${stringify(approvedEventPatch)}, submitted: ${stringify(submittedEventPatch)}`, async () => {
          const { eventManager, ERC20, master, creator } =
            await loadFixture(deployContract);
          const { tx: createEventTx } = await createEvent(
            eventManager,
            ERC20,
            master,
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
        }),
    );
  });

  describe("approveEvent", () => {
    itExpectsOnlyMaster("approveEvent", [BigInt(0)]);

    it("emits EventStatusChanged", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      const { request, tx, eventId } = await createEvent(
        eventManager,
        ERC20,
        master,
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
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      const { tx } = await createEvent(
        eventManager,
        ERC20,
        master,
        creator,
        {},
        {},
        { eventId: BigInt(1000 + Math.floor(Math.random() * 1000)) },
      );
      await expect(tx).to.be.revertedWith("Event with given id does not exist");
    });
  });

  describe("declineEvent", () => {
    itExpectsOnlyMaster("declineEvent", [BigInt(0)]);

    it("emits EventStatusChanged", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      await createEventPlace(eventManager, master);
      const { request, tx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        {},
      );
      const eventId = await getEventId();
      await expect(await eventManager.connect(master).declineEvent(eventId))
        .to.emit(eventManager, "EventStatusChanged")
        .withArgs(eventId, 2);
    });

    it("reverts on unexisting event request", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      await expect(
        eventManager
          .connect(master)
          .declineEvent(Math.floor(Math.random() * 1000)),
      ).to.be.revertedWith("Event with given id does not exist");
    });

    it("refunds tokens to creator", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      await createEventPlace(eventManager, master);
      const { request, tx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        {},
      );
      await tx;
      await expect(
        await eventManager.connect(master).declineEvent(await getEventId()),
      ).to.changeTokenBalances(
        ERC20,
        [await eventManager.getAddress(), await creator.getAddress()],
        [-eventRequestSubmitionPrice, eventRequestSubmitionPrice],
      );
    });
  });

  describe("updateEvent", () => {
    itExpectsOnlyMaster("updateEvent", [
      BigInt(0),
      ...submitEventRequestArgsToArray(defaultSubmitEventRequest),
    ]);

    it("emits EventUpdated", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      const { eventId } = await createEvent(
        eventManager,
        ERC20,
        master,
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
        .connect(master)
        .updateEvent(eventId, ...submitEventRequestArgsToArray(updatedRequest));
      await expect(tx)
        .to.emit(eventManager, "EventUpdated")
        .withArgs(eventId, ...submitEventRequestArgsToArray(updatedRequest));
    });

    it("reverts on unexisting event", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      const nonExistentEventId = BigInt(9999);
      await expect(
        eventManager
          .connect(master)
          .updateEvent(
            nonExistentEventId,
            ...submitEventRequestArgsToArray(defaultSubmitEventRequest),
          ),
      ).to.be.revertedWith("Event with given id does not exist");
    });

    it("checks date ranges overlap", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      const { eventId: firstEventId } = await createEvent(
        eventManager,
        ERC20,
        master,
        creator,
        {},
        { startDate: timestamp(5), daysAmount: 4 },
        {},
      );
      const { eventId: secondEventId } = await createEvent(
        eventManager,
        ERC20,
        master,
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
          .connect(master)
          .updateEvent(
            secondEventId,
            ...submitEventRequestArgsToArray(updatedRequest),
          ),
      ).to.be.revertedWith("Requested event overlaps with existing");
    });
  });

  describe("mintTicket", () => {
    it("emits TicketMinted", async () => {
      const { eventManager, eventTicket, ERC20, master, creator, owner } =
        await loadFixture(deployContract);
      const { eventId } = await createEvent(
        eventManager,
        ERC20,
        master,
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
      const { eventManager, ERC20, master, creator, owner } =
        await loadFixture(deployContract);
      const { eventId } = await createEvent(
        eventManager,
        ERC20,
        master,
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
      const { eventManager, ERC20, master, creator, owner } =
        await loadFixture(deployContract);
      const { eventId } = await createEvent(
        eventManager,
        ERC20,
        master,
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
      const { eventManager, eventTicket, ERC20, master, creator, owner } =
        await loadFixture(deployContract);
      const { eventId, tx: createEventTx } = await createEvent(
        eventManager,
        ERC20,
        master,
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
    itExpectsOnlyMaster("closeEvent", [BigInt(0)]);

    it("emits EventStatusChanged", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCloseEvent(
        eventManager,
        ERC20,
        master,
        creator,
        {},
      );
      await expect(tx)
        .to.emit(eventManager, "EventStatusChanged")
        .withArgs(request.eventId, 4);
    });

    it("reverts on unexisting event", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      const { tx } = await closeEvent(eventManager, master, {
        eventId: Math.floor(Math.random() * 1000),
      });
      await expect(tx).to.be.revertedWith("Event with given id does not exist");
    });

    it("reverts to close cancelled event", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCancelEvent(
        eventManager,
        ERC20,
        master,
        creator,
        {},
      );
      await tx;
      const { tx: closeEventTx } = await closeEvent(
        eventManager,
        master,
        request,
      );
      await expect(closeEventTx).to.be.revertedWith(
        "Only event in approved state can be closed",
      );
    });

    it("reverts to close closed event", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCloseEvent(
        eventManager,
        ERC20,
        master,
        creator,
        {},
      );
      await tx;
      const { tx: closeEventTx } = await closeEvent(
        eventManager,
        master,
        request,
      );
      await expect(closeEventTx).to.be.revertedWith(
        "Only event in approved state can be closed",
      );
    });

    it("reverts to close submitted event", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      const { eventPlaceId } = await createEventPlace(eventManager, master);
      const { request, tx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        {
          eventPlaceId,
        },
      );
      await tx;
      const { tx: closeEventTx } = await closeEvent(eventManager, master, {
        eventId: await getEventId(),
      });
      await expect(closeEventTx).to.be.revertedWith(
        "Only event in approved state can be closed",
      );
    });

    it("reverts to close declined event", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      await createEventPlace(eventManager, master);
      const { request, tx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        {},
      );
      const eventId = await getEventId();
      const { tx: closeEventTx } = await closeEvent(eventManager, master, {
        eventId,
      });
      await expect(closeEventTx).to.be.revertedWith(
        "Only event in approved state can be closed",
      );
    });

    it("reverts if event was not finished", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      const { tx: createEventTx, eventId } = await createEvent(
        eventManager,
        ERC20,
        master,
        creator,
        {},
        {},
        {},
      );
      await createEventTx;
      const { tx } = await closeEvent(eventManager, master, { eventId });
      await expect(tx).to.be.revertedWith("Event has not been finished yet");
    });

    it("proportionally spreads funds", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      const { tx } = await createAndCloseEvent(
        eventManager,
        ERC20,
        master,
        creator,
        {},
      );
      await expect(tx).to.changeTokenBalances(
        ERC20,
        [await master.getAddress(), await eventManager.getAddress()],
        [Number(eventRequestSubmitionPrice), -eventRequestSubmitionPrice],
      );
    });
  });

  describe("cancelEvent", () => {
    itExpectsOnlyMaster("cancelEvent", [BigInt(0)]);

    it("emits EventStatusChanged", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCancelEvent(
        eventManager,
        ERC20,
        master,
        creator,
        {},
      );
      await expect(tx)
        .to.emit(eventManager, "EventStatusChanged")
        .withArgs(request.eventId, 3);
    });

    it("reverts to cancel cancelled event", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCancelEvent(
        eventManager,
        ERC20,
        master,
        creator,
        {},
      );
      await tx;
      const { tx: cancelEventTx } = await cancelEvent(
        eventManager,
        master,
        request,
      );
      await expect(cancelEventTx).to.be.revertedWith(
        "Only event in approved state can be cancelled",
      );
    });

    it("reverts to cancel closed event", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCancelEvent(
        eventManager,
        ERC20,
        master,
        creator,
        {},
      );
      await tx;
      const { tx: cancelEventTx } = await cancelEvent(
        eventManager,
        master,
        request,
      );
      await expect(cancelEventTx).to.be.revertedWith(
        "Only event in approved state can be cancelled",
      );
    });

    it("reverts to cancel submitted event", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      const { eventPlaceId } = await createEventPlace(eventManager, master);
      const { request, tx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        {
          eventPlaceId,
        },
      );
      await tx;
      const { tx: cancelEventTx } = await cancelEvent(eventManager, master, {
        eventId: await getEventId(),
      });
      await expect(cancelEventTx).to.be.revertedWith(
        "Only event in approved state can be cancelled",
      );
    });

    it("reverts to cancel declined event", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      await createEventPlace(eventManager, master);
      const { request, tx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        {},
      );
      const eventId = await getEventId();
      const { tx: cancelEventTx } = await cancelEvent(eventManager, master, {
        eventId,
      });
      await expect(cancelEventTx).to.be.revertedWith(
        "Only event in approved state can be cancelled",
      );
    });

    it("refunds tokens to customers and creator", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      const { tx } = await createAndCancelEvent(
        eventManager,
        ERC20,
        master,
        creator,
        {},
      );
      await expect(tx).to.changeTokenBalances(
        ERC20,
        [await master.getAddress(), await eventManager.getAddress()],
        [eventRequestSubmitionPrice, -eventRequestSubmitionPrice],
      );
      assert(false, "Requires `verifyTicket` implementation");
    });
  });
});
