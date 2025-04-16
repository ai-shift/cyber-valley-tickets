import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { assert, expect } from "chai";
import {
  createAndUpdateEventPlace,
  createEvent,
  createEventPlace,
  createEventPlaceRequestAsArguments,
  createValidEventPlace,
  deployContract,
  eventRequestAsArguments,
  itExpectsOnlyMaster,
  stringify,
  submitEventRequest,
  updateEventPlaceRequestAsArguments,
} from "./helpers";

import {
  defaultCreateEventPlaceRequest,
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
      createEventPlaceRequestAsArguments(defaultCreateEventPlaceRequest),
    );

    it("should emit NewEventPlaceAvailable", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      const { tx } = await createValidEventPlace(eventManager, master);
      await expect(tx)
        .to.emit(eventManager, "NewEventPlaceAvailable")
        .withArgs(
          0,
          ...createEventPlaceRequestAsArguments(defaultCreateEventPlaceRequest),
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
      updateEventPlaceRequestAsArguments(defaultUpdateEventPlaceRequest),
    );

    it("should emit NewEventPlaceAvailable", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      const tx = await createAndUpdateEventPlace(eventManager, master);
      await expect(tx)
        .to.emit(eventManager, "EventPlaceUpdated")
        .withArgs(
          ...updateEventPlaceRequestAsArguments(defaultUpdateEventPlaceRequest),
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
      const { request, tx } = await submitEventRequest(eventManager, creator, {
        eventPlaceId,
      });
      await expect(tx)
        .to.emit(eventManager, "NewEventRequest")
        .withArgs(
          await creator.getAddress(),
          ...eventRequestAsArguments(request),
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
          const { eventManager, master, creator } =
            await loadFixture(deployContract);
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

    it("emits EventApproved event", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      const { request, tx } = await createEvent(
        eventManager,
        ERC20,
        master,
        creator,
        {},
        {},
        {},
      );
      await expect(tx)
        .to.emit(eventManager, "EventApproved")
        .withArgs(request.id);
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
        { id: BigInt(1000 + Math.floor(Math.random() * 1000)) },
      );
      await expect(tx).to.be.revertedWith(
        "Event request with given id does not exist",
      );
    });
  });

  describe("declineEvent", () => {
    itExpectsOnlyMaster("declineEvent", [BigInt(0)]);

    it("emit EventDeclined event", async () => {
      const { eventManager, ERC20, master, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      await createEventPlace(eventManager, master);
      const { request, tx } = await submitEventRequest(
        eventManager,
        creator,
        {},
      );
      await expect(await eventManager.connect(master).declineEvent(request.id))
        .to.emit(eventManager, "EventDeclined")
        .withArgs(request.id);
    });

    it("reverts on unexisting event request", async () => {
      const { eventManager, master } =
        await loadFixture(deployContract);
      await expect(await eventManager.connect(master).declineEvent(Math.floor(Math.random() * 1000)))
        .to.be.revertedWith("Event request does not exist");
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
      const { request, tx } = await submitEventRequest(
        eventManager,
        creator,
        {},
      );
      await expect(await eventManager.connect(master).declineEvent(request.id)).to.changeTokenBalances(
        ERC20,
        [await eventManager.getAddress(), await creator.getAddress()],
        [-eventRequestSubmitionPrice, eventRequestSubmitionPrice],
      );
    });
  });
});
