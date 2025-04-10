import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { assert, Assertion, expect } from "chai";
import type { BaseContract } from "ethers";
import hre from "hardhat";
import {
  type CyberValleyEventManager,
  CyberValleyEventTicket,
  type SimpleERC20Xylose,
} from "../typechain-types";

type ContractsFixture = {
  sex: SimpleERC20Xylose & BaseContract;
  eventManager: CyberValleyEventManager & BaseContract;
  owner: any;
  master: any;
  devTeam: any;
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

    const asArguments = (
      req: CreateEventPlaceRequest | UpdateEventPlaceRequest,
    ): integer[] => {
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
    };


  async function deployContract(): Promise<ContractsFixture> {
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

  async function createEventPlace(request) {
    const { eventManager, master } = await loadFixture(deployContract);
    return await eventManager.connect(master).createEventPlace();
  }

  async function createValidEventPlace() {
    return await createEventPlace(...asArguments(createEventPlaceRequest));
  }

  async function updateExistingEventPlace() {
    const tx = await createValidEventPlace();
    const receipt = await tx.wait();
    const event = receipt.events.find(
      (e) => e.event === "NewEventPlaceAvailable",
    );
    return updateEventPlace(
      ...asArguments({
        ...updateEventPlaceRequest,
        eventPlaceId: event.args.eventPlaceId,
      }),
    );
  }

  async function expectOnlyMaster(tx) {
    await expect(tx).to.be.revertedWith("Must have master role");
  }

  describe("EventPlace", () => {
    it("allowed only to master", async () => {
      const { eventManager } = await loadFixture(deployContract);
      await expectOnlyMaster(
        eventManager.createEventPlace(...asArguments(createEventPlaceRequest)),
      );
    });

    it("should emit events", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      const createEventPlaceTx = await loadFixture(createValidEventPlace);

      await expect(createEventPlaceTx)
        .to.emit(eventManager, "NewEventPlaceAvailable")
        .withArgs(0, ...asArguments(createEventPlaceRequest));
    });

    it("should validate min and max tickets", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      await expect(
        eventManager
          .connect(master)
          .createEventPlace(
            ...asArguments({ ...createEventPlaceRequest, minTickets: 0 }),
          ),
      ).to.be.revertedWith("Values must be greater than zero");
      await expect(
        eventManager.connect(master).createEventPlace(
          ...asArguments({
            ...createEventPlaceRequest,
            minTickets: 0,
            maxTickets: 0,
          }),
        ),
      ).to.be.revertedWith("Values must be greater than zero");
      await expect(
        eventManager
          .connect(master)
          .createEventPlace(
            ...asArguments({ ...createEventPlaceRequest, maxTickets: 0 }),
          ),
      ).to.be.revertedWith("Max tickets must be greater or equal min tickets");
    });

    it("should validate min price", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      await expect(
        eventManager
          .connect(master)
          .createEventPlace(
            ...asArguments({ ...createEventPlaceRequest, minPrice: 0 }),
          ),
      ).to.be.revertedWith("Values must be greater than zero");
    });

    it("should validate min days", async () => {
      const { eventManager, master } = await loadFixture(deployContract);
      await expect(
        eventManager
          .connect(master)
          .createEventPlace(
            ...asArguments({ ...createEventPlaceRequest, minDays: 0 }),
          ),
      ).to.be.revertedWith("Values must be greater than zero");
    });

    it("should revert updating unexisting event place", async () => {});

    it("should update existing event place", async () => {});

    it("should revert updating event for the approved event", async () => {});
  });
});
