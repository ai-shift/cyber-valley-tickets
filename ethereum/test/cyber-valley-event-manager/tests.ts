import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  approveEventPlace,
  cancelEvent,
  closeEvent,
  createAndCancelEvent,
  createAndCloseEvent,
  createAndUpdateEventPlace,
  createEvent,
  createEventForCategories,
  createEventPlace,
  declineEventPlace,
  deployContract,
  itExpectsOnlyLocalProvider,
  itExpectsOnlyMaster,
  itExpectsOnlyVerifiedShaman,
  loadFixture,
  submitEventPlaceRequest,
  submitEventRequest,
  timestamp,
} from "./helpers";

import {
  approveEventPlaceArgsToArray,
  declineEventPlaceArgsToArray,
  submitEventPlaceRequestArgsToArray,
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
  let testStartBlock: number;
  let provider: typeof ethers.provider;

  beforeEach(async () => {
    provider = ethers.provider;
    testStartBlock = await provider.getBlockNumber();
  });

  afterEach(async function () {
    const currentBlock = await provider.getBlockNumber();
    const txHashes: string[] = [];

    console.log(`\n${"=".repeat(80)}`);
    console.log(`TEST: ${this.currentTest?.title || "unknown"}`);
    console.log(`Blocks: ${testStartBlock + 1} to ${currentBlock}`);
    console.log(`${"=".repeat(80)}`);

    for (let i = testStartBlock + 1; i <= currentBlock; i++) {
      const block = await provider.getBlock(i, true);
      if (block && block.transactions.length > 0) {
        console.log(
          `\nBlock ${i} (${block.transactions.length} transactions):`,
        );
        for (const txHash of block.transactions) {
          const tx = await provider.getTransaction(txHash as string);
          if (tx) {
            const receipt = await provider.getTransactionReceipt(tx.hash);
            const eventCount = receipt?.logs.length || 0;
            console.log(`  • TX: ${tx.hash} (${eventCount} events)`);
            txHashes.push(tx.hash);
          }
        }
      }
    }

    console.log(`\nTotal transactions in test: ${txHashes.length}`);
    console.log(`${"=".repeat(80)}\n`);
  });

  async function createSubmittedEvent() {
    const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
      await loadFixture(deployContract);
    await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
    await ERC20.connect(creator).approve(
      await eventManager.getAddress(),
      eventRequestSubmitionPrice,
    );
    const { eventPlaceId } = await createEventPlace(
      eventManager,
      verifiedShaman,
      localProvider,
      {},
    );
    const { getEventId } = await submitEventRequest(eventManager, creator, {
      eventPlaceId,
      startDate: await timestamp(10),
    });
    const eventId = await getEventId();
    return {
      eventManager,
      ERC20,
      verifiedShaman,
      localProvider,
      creator,
      eventId,
    };
  }
  describe("setRevenueSplitter", () => {
    itExpectsOnlyMaster("setRevenueSplitter", [ethers.ZeroAddress]);

    it("sets revenue splitter address", async () => {
      const { eventManager, master, splitter } =
        await loadFixture(deployContract);
      const newSplitter = await splitter.getAddress();
      await eventManager.connect(master).setRevenueSplitter(newSplitter);
      expect(await eventManager.revenueSplitter()).to.equal(newSplitter);
    });

    it("reverts when splitter is zero address", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      await expect(
        eventManager.connect(master).setRevenueSplitter(ethers.ZeroAddress),
      ).to.be.revertedWith("Splitter address cannot be zero");
    });
  });

  describe("submitEventPlaceRequest", () => {
    itExpectsOnlyVerifiedShaman(
      "submitEventPlaceRequest",
      submitEventPlaceRequestArgsToArray(defaultCreateEventPlaceRequest),
    );

    it("should emit NewEventPlaceRequest", async () => {
      const { eventManager, verifiedShaman } =
        await loadFixture(deployContract);
      const { tx } = await submitEventPlaceRequest(
        eventManager,
        verifiedShaman,
      );
      await expect(tx)
        .to.emit(eventManager, "NewEventPlaceRequest")
        .withArgs(
          0,
          await verifiedShaman.getAddress(),
          ...submitEventPlaceRequestArgsToArray(defaultCreateEventPlaceRequest),
        );
    });

    it("auto-approves when requester is a local provider", async () => {
      const { eventManager, master, localProvider } =
        await loadFixture(deployContract);

      const VERIFIED_SHAMAN_ROLE = await eventManager.VERIFIED_SHAMAN_ROLE();
      await eventManager
        .connect(master)
        .grantRole(VERIFIED_SHAMAN_ROLE, await localProvider.getAddress());

      const tx = await eventManager
        .connect(localProvider)
        .submitEventPlaceRequest(
          ...submitEventPlaceRequestArgsToArray(defaultCreateEventPlaceRequest),
        );

      const args = submitEventPlaceRequestArgsToArray(
        defaultCreateEventPlaceRequest,
      );
      await expect(tx)
        .to.emit(eventManager, "EventPlaceUpdated")
        .withArgs(
          await localProvider.getAddress(),
          0,
          args[0],
          args[1],
          args[2],
          args[3],
          args[4],
          args[5],
          1,
          args[6],
          args[7],
          args[8],
        );

      const eventPlace = await eventManager.eventPlaces(0);
      expect(eventPlace.status).to.equal(1);
      expect(eventPlace.provider).to.equal(await localProvider.getAddress());
    });

    createEventPlaceCornerCases.forEach(({ patch, revertedWith }, idx) =>
      it(`should validate invariants. Case ${idx + 1}: ${JSON.stringify(patch)}`, async () => {
        const { eventManager, verifiedShaman } =
          await loadFixture(deployContract);
        await expect(
          submitEventPlaceRequest(eventManager, verifiedShaman, {
            ...defaultCreateEventPlaceRequest,
            ...patch,
          }),
        ).to.be.revertedWith(revertedWith);
      }),
    );
  });

  describe("approveEventPlace", () => {
    itExpectsOnlyLocalProvider(
      "approveEventPlace",
      approveEventPlaceArgsToArray({ eventPlaceId: 0 }),
    );

    it("emits EventPlaceUpdated", async () => {
      const { eventManager, verifiedShaman, localProvider } =
        await loadFixture(deployContract);
      const { eventPlaceId } = await submitEventPlaceRequest(
        eventManager,
        verifiedShaman,
      );
      await expect(
        approveEventPlace(eventManager, localProvider, { eventPlaceId }),
      ).to.emit(eventManager, "EventPlaceUpdated");
    });

    it("reverts on non-existing event place", async () => {
      const { eventManager, localProvider } = await loadFixture(deployContract);
      await expect(
        approveEventPlace(eventManager, localProvider, { eventPlaceId: 999 }),
      ).to.be.revertedWith("EventPlace does not exist");
    });

    it("reverts on already approved event place", async () => {
      const { eventManager, verifiedShaman, localProvider } =
        await loadFixture(deployContract);
      const { eventPlaceId } = await submitEventPlaceRequest(
        eventManager,
        verifiedShaman,
      );
      await approveEventPlace(eventManager, localProvider, { eventPlaceId });
      await expect(
        approveEventPlace(eventManager, localProvider, { eventPlaceId }),
      ).to.be.revertedWith("EventPlace status differs from submitted");
    });
  });

  describe("declineEventPlace", () => {
    itExpectsOnlyLocalProvider(
      "declineEventPlace",
      declineEventPlaceArgsToArray({ eventPlaceId: 0 }),
    );

    it("reverts on non-existing event place", async () => {
      const { eventManager, localProvider } = await loadFixture(deployContract);
      await expect(
        declineEventPlace(eventManager, localProvider, { eventPlaceId: 999 }),
      ).to.be.revertedWith("EventPlace does not exist");
    });
  });

  describe("updateEventPlace", () => {
    itExpectsOnlyLocalProvider(
      "updateEventPlace",
      updateEventPlaceArgsToArray(defaultUpdateEventPlaceRequest),
    );

    it("should emit EventPlaceUpdated", async () => {
      const { eventManager, verifiedShaman, localProvider } =
        await loadFixture(deployContract);
      const tx = await createAndUpdateEventPlace(
        eventManager,
        verifiedShaman,
        localProvider,
        {},
      );
      const args = updateEventPlaceArgsToArray(defaultUpdateEventPlaceRequest);
      await expect(tx)
        .to.emit(eventManager, "EventPlaceUpdated")
        .withArgs(
          await localProvider.getAddress(),
          args[0], // eventPlaceId
          args[1], // maxTickets
          args[2], // minTickets
          args[3], // minPrice
          args[4], // daysBeforeCancel
          args[5], // minDays
          args[6], // available
          1, // status (Approved)
          args[7], // digest
          args[8], // hashFunction
          args[9], // size
        );
    });

    createEventPlaceCornerCases.forEach(({ patch, revertedWith }, idx) =>
      it(`should validate invariants. Case ${idx + 1}: ${JSON.stringify(patch)}`, async () => {
        const { eventManager, verifiedShaman, localProvider } =
          await loadFixture(deployContract);
        await expect(
          createAndUpdateEventPlace(
            eventManager,
            verifiedShaman,
            localProvider,
            {
              ...defaultUpdateEventPlaceRequest,
              ...patch,
            },
          ),
        ).to.be.revertedWith(revertedWith);
      }),
    );
  });

  describe("submitEventRequest", () => {
    it("emits NewEventRequest", async () => {
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      const { eventPlaceId } = await createEventPlace(
        eventManager,
        verifiedShaman,
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
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await expect(
        await ERC20.balanceOf(await eventManager.getAddress()),
      ).to.equal(0);
      const { eventPlaceId, tx: createEventPlaceTx } = await createEventPlace(
        eventManager,
        verifiedShaman,
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
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { eventPlaceId } = await createEventPlace(
        eventManager,
        verifiedShaman,
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
        const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
          await loadFixture(deployContract);
        await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
        await ERC20.connect(creator).approve(
          await eventManager.getAddress(),
          eventRequestSubmitionPrice,
        );

        const { eventPlaceId } = await createEventPlace(
          eventManager,
          verifiedShaman,
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
        const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
          await loadFixture(deployContract);
        const { tx: createEventTx } = await createEvent(
          eventManager,
          ERC20,
          verifiedShaman,
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
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { request, tx, eventId } = await createEvent(
        eventManager,
        ERC20,
        verifiedShaman,
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
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { tx } = await createEvent(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        {},
        {},
        { eventId: BigInt(1000 + Math.floor(Math.random() * 1000)) },
      );
      await expect(tx).to.be.revertedWith("Event with given id does not exist");
    });

    it("reverts when event has no categories", async () => {
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      // Use createEventForCategories to create event without auto-approval
      const { eventId } = await createEventForCategories(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        {},
        {},
      );
      // Try to approve without creating any categories
      await expect(
        eventManager.connect(localProvider).approveEvent(eventId),
      ).to.be.revertedWith("Event must have at least one category");
    });
  });

  describe("declineEvent", () => {
    itExpectsOnlyLocalProvider("declineEvent", [BigInt(0)]);

    it("emits EventStatusChanged", async () => {
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      await createEventPlace(eventManager, verifiedShaman, localProvider);
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
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      await createEventPlace(eventManager, verifiedShaman, localProvider);
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
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { eventId } = await createEvent(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        {},
        { startDate: await timestamp(5), daysAmount: 3 },
        {},
      );
      const updatedRequest = {
        ...defaultSubmitEventRequest,
        startDate: await timestamp(10),
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
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { eventId: firstEventId } = await createEvent(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        {},
        { startDate: await timestamp(5), daysAmount: 4 },
        {},
      );
      const { eventId: secondEventId } = await createEvent(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        {},
        { startDate: await timestamp(15), daysAmount: 4 },
        {},
      );
      const updatedRequest = {
        ...defaultSubmitEventRequest,
        startDate: await timestamp(5),
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
        verifiedShaman,
        localProvider,
        creator,
        owner,
      } = await loadFixture(deployContract);
      const { eventId } = await createEvent(
        eventManager,
        ERC20,
        verifiedShaman,
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
      // Use category 0 (the default category created by createEvent)
      const tx = await eventManager.connect(owner).mintTicket(
        eventId,
        0, // categoryId
        multihash.digest,
        multihash.hashFunction,
        multihash.size,
      );
      await expect(tx).to.emit(eventTicket, "TicketMinted");
    });

    it("reverts on sold out", async () => {
      const {
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        owner,
      } = await loadFixture(deployContract);
      const { eventId } = await createEventForCategories(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        { maxTickets: 2, minTickets: 1 },
        {},
      );
      // Create a category with quota of 1
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Limited", 0, 1, true);
      // Approve the event
      await eventManager.connect(localProvider).approveEvent(eventId);

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
      // Mint first ticket with category 0 (the limited category)
      await eventManager.connect(owner).mintTicket(
        eventId,
        0, // categoryId for "Limited"
        multihash.digest,
        multihash.hashFunction,
        multihash.size,
      );
      // Second mint should revert due to category quota
      await expect(
        eventManager.connect(owner).mintTicket(
          eventId,
          0, // categoryId for "Limited"
          multihash.digest,
          multihash.hashFunction,
          multihash.size,
        ),
      ).to.be.revertedWith("Category quota exceeded");
    });

    it("transfers required amount of tokens", async () => {
      const {
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        owner,
      } = await loadFixture(deployContract);
      const { eventId } = await createEvent(
        eventManager,
        ERC20,
        verifiedShaman,
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
      // Use category 0 (the default category created by createEvent)
      const tx = await eventManager.connect(owner).mintTicket(
        eventId,
        0, // categoryId
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
        verifiedShaman,
        localProvider,
        creator,
        owner,
      } = await loadFixture(deployContract);
      const { eventId, tx: createEventTx } = await createEvent(
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
      // Use category 0 (the default category created by createEvent)
      const tx = eventManager.connect(owner).mintTicket(
        eventId,
        0, // categoryId
        multihash.digest,
        multihash.hashFunction,
        multihash.size,
      );
      await expect(tx)
        .to.emit(eventTicket, "TicketMinted")
        .withArgs(
          eventId,
          1,
          0, // categoryId (default category)
          await owner.getAddress(),
          multihash.digest,
          multihash.hashFunction,
          multihash.size,
        );
    });
  });

  describe("ticket categories", () => {
    itExpectsOnlyVerifiedShaman("createCategory", [
      BigInt(0),
      "Families",
      1000,
      10,
      true,
    ]);

    it("reverts creating category after event is approved", async () => {
      const { eventManager, verifiedShaman, localProvider, eventId } =
        await createSubmittedEvent();
      // Create a category first (required for approval)
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Default", 0, 0, false);
      // Now approve the event
      await eventManager.connect(localProvider).approveEvent(eventId);
      // Try to create another category after approval
      await expect(
        eventManager
          .connect(verifiedShaman)
          .createCategory(eventId, "Families", 1000, 10, true),
      ).to.be.revertedWith("Event must be in submitted state");
    });

    it("allows one unlimited category per event", async () => {
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice * 2n);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice * 2n,
      );
      const { eventPlaceId } = await createEventPlace(
        eventManager,
        verifiedShaman,
        localProvider,
        {},
      );
      const { getEventId: getFirstEventId } = await submitEventRequest(
        eventManager,
        creator,
        {
          eventPlaceId,
          startDate: await timestamp(10),
        },
      );
      const { getEventId: getSecondEventId } = await submitEventRequest(
        eventManager,
        creator,
        {
          eventPlaceId,
          startDate: await timestamp(20),
        },
      );
      const firstEventId = await getFirstEventId();
      const secondEventId = await getSecondEventId();

      await eventManager
        .connect(verifiedShaman)
        .createCategory(firstEventId, "Regular", 0, 0, false);
      await expect(
        eventManager
          .connect(verifiedShaman)
          .createCategory(secondEventId, "Regular", 0, 0, false),
      ).to.not.be.reverted;
    });

    it("applies discount for unlimited categories", async () => {
      const {
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        owner,
      } = await loadFixture(deployContract);
      const { eventPlaceId } = await createEventPlace(
        eventManager,
        verifiedShaman,
        localProvider,
        {},
      );
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      const { getEventId } = await submitEventRequest(eventManager, creator, {
        eventPlaceId,
        startDate: await timestamp(10),
        ticketPrice: 100,
      });
      const eventId = await getEventId();
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Regular", 1000, 0, false);
      await eventManager.connect(localProvider).approveEvent(eventId);

      await ERC20.connect(owner).mint(90);
      await ERC20.connect(owner).approve(await eventManager.getAddress(), 90);
      await expect(
        eventManager
          .connect(owner)
          .mintTicket(
            eventId,
            0,
            "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            18,
            32,
          ),
      ).to.changeTokenBalances(
        ERC20,
        [await eventManager.getAddress(), await owner.getAddress()],
        [90, -90],
      );
    });

    it("enforces quota for limited categories", async () => {
      const {
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        owner,
      } = await loadFixture(deployContract);
      const { eventPlaceId } = await createEventPlace(
        eventManager,
        verifiedShaman,
        localProvider,
        {},
      );
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      const { getEventId } = await submitEventRequest(eventManager, creator, {
        eventPlaceId,
        startDate: await timestamp(10),
        ticketPrice: 100,
      });
      const eventId = await getEventId();
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Families", 0, 1, true);
      await eventManager.connect(localProvider).approveEvent(eventId);

      await ERC20.connect(owner).mint(200);
      await ERC20.connect(owner).approve(await eventManager.getAddress(), 200);
      await eventManager
        .connect(owner)
        .mintTicket(
          eventId,
          0,
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          18,
          32,
        );
      await expect(
        eventManager
          .connect(owner)
          .mintTicket(
            eventId,
            0,
            "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            18,
            32,
          ),
      ).to.be.revertedWith("Category quota exceeded");
    });

    it("should revert when creating category with quota exceeding maxTickets", async () => {
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { eventId } = await createEventForCategories(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        { maxTickets: 100 },
        {},
      );
      await expect(
        eventManager
          .connect(verifiedShaman)
          .createCategory(eventId, "BigCategory", 1000, 150, true),
      ).to.be.revertedWith("Quota exceeds event capacity");
    });

    it("should revert when total category quotas exceed maxTickets", async () => {
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { eventId } = await createEventForCategories(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        { maxTickets: 100 },
        {},
      );
      // Create first category with quota = 60
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Category1", 1000, 60, true);
      // Try to create second category with quota = 50 (total would be 110 > 100)
      await expect(
        eventManager
          .connect(verifiedShaman)
          .createCategory(eventId, "Category2", 1000, 50, true),
      ).to.be.revertedWith("Total category quotas exceed event capacity");
    });

    it("should revert when creating category with quota = 0", async () => {
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { eventId } = await createEventForCategories(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        {},
        {},
      );
      await expect(
        eventManager
          .connect(verifiedShaman)
          .createCategory(eventId, "ZeroQuota", 1000, 0, true),
      ).to.be.revertedWith("Quota must be greater than 0");
    });

    it("should allow creating categories until quotas sum to maxTickets", async () => {
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { eventId } = await createEventForCategories(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        { maxTickets: 100 },
        {},
      );
      // Create category1 with quota = 50
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Category1", 1000, 50, true);
      // Create category2 with quota = 50 (total = 100)
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Category2", 1000, 50, true);
      // Try to create category3 with quota = 1 (should fail, total would be 101)
      await expect(
        eventManager
          .connect(verifiedShaman)
          .createCategory(eventId, "Category3", 1000, 1, true),
      ).to.be.revertedWith("Total category quotas exceed event capacity");
    });

    it("should allow creating unlimited category when quotas fill maxTickets", async () => {
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { eventId } = await createEventForCategories(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        { maxTickets: 100 },
        {},
      );
      // Create category1 with quota = 100 (fills all capacity)
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "FullCapacity", 1000, 100, true);
      // Create unlimited category (should succeed)
      await expect(
        eventManager
          .connect(verifiedShaman)
          .createCategory(eventId, "Unlimited", 500, 0, false),
      ).to.not.be.reverted;
    });

    it("should revert when updating category quota below sold amount", async () => {
      const {
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        owner,
      } = await loadFixture(deployContract);
      const { eventId } = await createEventForCategories(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        {},
        {},
      );
      // Create category with quota = 50
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Category", 0, 50, true);
      await eventManager.connect(localProvider).approveEvent(eventId);

      // Buy 10 tickets from category
      await ERC20.connect(owner).mint(1000);
      await ERC20.connect(owner).approve(await eventManager.getAddress(), 1000);
      for (let i = 0; i < 10; i++) {
        await eventManager
          .connect(owner)
          .mintTicket(
            eventId,
            0,
            "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            18,
            32,
          );
      }

      // Try to update quota to 5 (less than 10 sold) - should fail because event is approved
      await expect(
        eventManager
          .connect(localProvider)
          .updateCategory(0, "Category", 0, 5, true),
      ).to.be.revertedWith("Event must be in submitted state");
    });

    it("should revert when updating increases total quotas beyond maxTickets", async () => {
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { eventId } = await createEventForCategories(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        { maxTickets: 100 },
        {},
      );
      // Create category1 with quota = 60
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Category1", 1000, 60, true);
      // Create category2 with quota = 30
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Category2", 1000, 30, true);
      // Try to update category2 quota to 50 (total would be 110 > 100)
      await expect(
        eventManager
          .connect(localProvider)
          .updateCategory(1, "Category2", 1000, 50, true),
      ).to.be.revertedWith("Total category quotas exceed event capacity");
    });

    it("should allow updating category within quota constraints", async () => {
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { eventId } = await createEventForCategories(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        { maxTickets: 100 },
        {},
      );
      // Create category1 with quota = 50
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Category1", 1000, 50, true);
      // Create category2 with quota = 30
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Category2", 1000, 30, true);
      // Update category2 quota to 40 (total = 90, should succeed)
      await expect(
        eventManager
          .connect(localProvider)
          .updateCategory(1, "Category2", 1000, 40, true),
      ).to.not.be.reverted;
    });

    it("should track totalCategoryQuota correctly after multiple operations", async () => {
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { eventId } = await createEventForCategories(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        { maxTickets: 100 },
        {},
      );
      // Create category1 with quota = 30 (totalCategoryQuota = 30)
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Category1", 1000, 30, true);
      // Create category2 with quota = 40 (totalCategoryQuota = 70)
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Category2", 1000, 40, true);

      // Verify we can only add 30 more (100 - 70 = 30)
      await expect(
        eventManager
          .connect(verifiedShaman)
          .createCategory(eventId, "Category3", 1000, 31, true),
      ).to.be.revertedWith("Total category quotas exceed event capacity");

      // Update category1 quota to 50 (totalCategoryQuota = 90)
      await eventManager
        .connect(localProvider)
        .updateCategory(0, "Category1", 1000, 50, true);

      // Now we can only add 10 more (100 - 90 = 10)
      await expect(
        eventManager
          .connect(verifiedShaman)
          .createCategory(eventId, "Category3", 1000, 11, true),
      ).to.be.revertedWith("Total category quotas exceed event capacity");

      // But 10 should work
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Category3", 1000, 10, true);
    });
  });

  describe("closeEvent", () => {
    itExpectsOnlyLocalProvider("closeEvent", [BigInt(0)]);

    it("emits EventStatusChanged", async () => {
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCloseEvent(
        eventManager,
        ERC20,
        verifiedShaman,
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
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCancelEvent(
        eventManager,
        ERC20,
        verifiedShaman,
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
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCloseEvent(
        eventManager,
        ERC20,
        verifiedShaman,
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
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      const { eventPlaceId } = await createEventPlace(
        eventManager,
        verifiedShaman,
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
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      await createEventPlace(eventManager, verifiedShaman, localProvider);
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
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
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
      const { tx } = await closeEvent(eventManager, localProvider, { eventId });
      await expect(tx).to.be.revertedWith("Event has not been finished yet");
    });

    it("proportionally spreads funds", async () => {
      const {
        eventManager,
        ERC20,
        master,
        verifiedShaman,
        localProvider,
        creator,
        staff,
      } = await loadFixture(deployContract);
      const { tx } = await createAndCloseEvent(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        {},
      );
      const totalFunds = Number(eventRequestSubmitionPrice);
      // Fixed: 10% (10) to master, 5% (5) to staff
      // Flexible: 85% (85) to localProvider
      const masterAmount = 10;
      const staffAmount = 5;
      const providerAmount = 85;
      await expect(tx).to.changeTokenBalances(
        ERC20,
        [
          await master.getAddress(),
          await staff.getAddress(),
          await localProvider.getAddress(),
          await eventManager.getAddress(),
        ],
        [masterAmount, staffAmount, providerAmount, -totalFunds],
      );
    });
  });

  describe("cancelEvent", () => {
    itExpectsOnlyLocalProvider("cancelEvent", [BigInt(0)]);

    it("emits EventStatusChanged", async () => {
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCancelEvent(
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        {},
      );
      await expect(tx)
        .to.emit(eventManager, "EventStatusChanged")
        .withArgs(request.eventId, 3);
    });

    it("refunds discounted ticket price", async () => {
      const {
        eventManager,
        ERC20,
        verifiedShaman,
        localProvider,
        creator,
        owner,
      } = await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      const { eventPlaceId } = await createEventPlace(
        eventManager,
        verifiedShaman,
        localProvider,
      );
      const { getEventId } = await submitEventRequest(eventManager, creator, {
        eventPlaceId,
        ticketPrice: 100,
        startDate: await timestamp(10),
      });
      const eventId = await getEventId();
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Families", 1000, 10, true);
      await eventManager.connect(localProvider).approveEvent(eventId);

      const discountedPrice = 90n;
      await ERC20.connect(owner).mint(discountedPrice);
      await ERC20.connect(owner).approve(
        await eventManager.getAddress(),
        discountedPrice,
      );
      await eventManager
        .connect(owner)
        .mintTicket(
          eventId,
          0,
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          18,
          32,
        );

      const tx = await eventManager.connect(localProvider).cancelEvent(eventId);
      await expect(tx).to.changeTokenBalances(
        ERC20,
        [
          await eventManager.getAddress(),
          await owner.getAddress(),
          await localProvider.getAddress(),
        ],
        [
          -(eventRequestSubmitionPrice + discountedPrice),
          discountedPrice,
          eventRequestSubmitionPrice,
        ],
      );
    });

    it("reverts to cancel cancelled event", async () => {
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCancelEvent(
        eventManager,
        ERC20,
        verifiedShaman,
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
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      const { tx, request } = await createAndCancelEvent(
        eventManager,
        ERC20,
        verifiedShaman,
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
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      const { eventPlaceId } = await createEventPlace(
        eventManager,
        verifiedShaman,
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
      const { eventManager, ERC20, verifiedShaman, localProvider, creator } =
        await loadFixture(deployContract);
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      await createEventPlace(eventManager, verifiedShaman, localProvider);
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
      const {
        eventManager,
        ERC20,
        master,
        verifiedShaman,
        localProvider,
        creator,
        staff,
      } = await loadFixture(deployContract);

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
        verifiedShaman,
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

      // Create a default category (required for approval)
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Standard", 0, 0, false);

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
          await eventManager.connect(customer).mintTicket(
            eventId,
            0, // categoryId
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
    it("distributes funds through DynamicRevenueSplitter on closeEvent", async () => {
      const {
        ERC20,
        eventManager,
        splitter,
        master,
        staff,
        verifiedShaman,
        localProvider,
        creator,
        owner,
      } = await loadFixture(deployContract);

      // Setup event and tickets
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );

      const { eventPlaceId } = await createEventPlace(
        eventManager,
        verifiedShaman,
        localProvider,
        { maxTickets: 100, minTickets: 1, minPrice: 10 },
      );

      const { tx: submitTx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        { eventPlaceId, ticketPrice: 10 },
      );
      await submitTx;
      const eventId = await getEventId();

      // Create a default category (required for approval)
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Standard", 0, 0, false);

      await eventManager.connect(localProvider).approveEvent(eventId);

      // Buy 10 tickets @ 10 USDT = 100 USDT
      const ticketPrice = 10;
      const ticketCount = 10;
      const totalTicketCost = ticketPrice * ticketCount;
      const multihash = {
        digest:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        hashFunction: 18,
        size: 32,
      };

      await ERC20.connect(owner).mint(totalTicketCost);
      await ERC20.connect(owner).approve(
        await eventManager.getAddress(),
        totalTicketCost,
      );
      for (let i = 0; i < ticketCount; i++) {
        await eventManager.connect(owner).mintTicket(
          eventId,
          0, // categoryId
          multihash.digest,
          multihash.hashFunction,
          multihash.size,
        );
      }

      // Total = 100 (tickets) + 100 (event request price from data.ts) = 200 USDT
      const totalAmount = 200;

      // Move time to allow closing
      await time.increase(100_000_000);

      // Close event and check distribution
      // Fixed: 10% (20) to master, 5% (10) to staff
      // Flexible: 85% (170) to localProvider (set in helpers.ts default profile)

      const tx = await eventManager.connect(localProvider).closeEvent(eventId);

      await expect(tx).to.changeTokenBalances(
        ERC20,
        [
          await master.getAddress(),
          await staff.getAddress(),
          await localProvider.getAddress(),
          await eventManager.getAddress(),
        ],
        [20, 10, 170, -200],
      );

      await expect(tx)
        .to.emit(splitter, "RevenueDistributed")
        .withArgs(totalAmount, eventId);
    });

    it("uses event-specific profile if set", async () => {
      const {
        ERC20,
        eventManager,
        splitter,
        master,
        staff,
        verifiedShaman,
        localProvider,
        creator,
        owner,
      } = await loadFixture(deployContract);

      const customer = owner;
      await ERC20.connect(creator).mint(eventRequestSubmitionPrice);
      await ERC20.connect(creator).approve(
        await eventManager.getAddress(),
        eventRequestSubmitionPrice,
      );
      const { eventPlaceId } = await createEventPlace(
        eventManager,
        verifiedShaman,
        localProvider,
      );
      const { tx: submitTx, getEventId } = await submitEventRequest(
        eventManager,
        creator,
        { eventPlaceId },
      );
      await submitTx;
      const eventId = await getEventId();

      // Create a default category (required for approval)
      await eventManager
        .connect(verifiedShaman)
        .createCategory(eventId, "Standard", 0, 0, false);

      await eventManager.connect(localProvider).approveEvent(eventId);

      // Create and set event-specific profile
      await splitter
        .connect(master)
        .createDistributionProfile([await customer.getAddress()], [10000]);
      await splitter.connect(master).setEventProfile(eventId, 2);

      await time.increase(100_000_000);
      const totalAmount = Number(eventRequestSubmitionPrice); // No tickets sold, just request price

      const tx = await eventManager.connect(localProvider).closeEvent(eventId);

      // 85% of 100 = 85 to customer
      await expect(tx).to.changeTokenBalance(ERC20, customer, 85);
    });
  });
});
