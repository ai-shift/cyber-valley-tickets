import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { assert, expect } from "chai";
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
  stringify,
  submitEventRequest,
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
  submitEventDateRangeOverlapCornerCases,
  submitEventIncompatibleEventPlaceCornerCases,
} from "./corner-cases";

describe("CyberValleyEventManager", () => {
  describe("createEventPlace", () => {
    itExpectsOnlyMaster(
      "createEventPlace",
      createEventPlaceArgsToArray(defaultCreateEventPlaceRequest),
    );

    it("should emit NewEventPlaceAvailable", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      const { tx } = await createValidEventPlace(eventManager, master);
      await expect(tx)
        .to.emit(eventManager, "NewEventPlaceAvailable")
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

    it("should emit NewEventPlaceAvailable", async () => {
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

    submitEventIncompatibleEventPlaceCornerCases.forEach(
      ({ eventPlacePatch, eventRequestPatch, revertsWith }, idx) =>
        it(`reverts on incompatibale data eventPlace: ${JSON.stringify(eventPlacePatch)}, eventRequest: ${JSON.stringify(eventRequestPatch)}`, async () => {
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
          await expect(tx).to.be.revertedWith(revertsWith);
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
      assert(false);
    });

    it("reverts on unexisting event", async () => {
      assert(false);
    });

    it("checks date ranges overlap", async () => {
      assert(false);
    });
  });

  describe("buyTicket", () => {
    it("emits TicketBought", async () => {
      assert(false);
    });

    it("reverts on sold out", async () => {
      assert(false);
    });

    it("transfers required amount of tokens", async () => {
      assert(false);
    });

    it("mints NFT with proper metadata", async () => {
      assert(false);
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
      const { eventManager, ERC20, master, creator, devTeam } =
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
        [
          await master.getAddress(),
          await creator.getAddress(),
          await devTeam.getAddress(),
          await eventManager.getAddress(),
        ],
        [
          (Number(eventRequestSubmitionPrice) * 50) / 100,
          (Number(eventRequestSubmitionPrice) * 40) / 100,
          (Number(eventRequestSubmitionPrice) * 10) / 100,
          -eventRequestSubmitionPrice,
        ],
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
      const { eventManager, ERC20, master, creator, devTeam } =
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
        [await creator.getAddress(), await eventManager.getAddress()],
        [eventRequestSubmitionPrice, -eventRequestSubmitionPrice],
      );
      assert(false, "Requires `verifyTicket` implementation");
    });
  });
});
