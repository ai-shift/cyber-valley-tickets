import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { assert, expect } from "chai";
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

  async function contracts(): Promise<ContractsFixture> {
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

  describe("createEventPlace", () => {
    const createEventPlaceRequest = {
      maxTickets: 100,
      minTickets: 50,
      minPrice: 20,
      minDays: 1,
    };

    type CreateEventPlaceRequest = typeof createEventPlaceRequest;

    const asArguments = (
      req: CreateEventPlaceRequest,
    ): [integer, integer, integer, integer] => {
      return [req.maxTickets, req.minTickets, req.minPrice, req.minDays];
    };

    it("allowed only to master", async () => {
      const { eventManager, master } = await loadFixture(contracts);
      await expect(
        eventManager.createEventPlace(...asArguments(createEventPlaceRequest)),
      ).to.be.revertedWith("Must have master role");
    });

    it("should emit NewEventPlaceAvailable event", async () => {
      const { eventManager, master } = await loadFixture(contracts);
      await expect(
        eventManager
          .connect(master)
          .createEventPlace(...asArguments(createEventPlaceRequest)),
      )
        .to.emit(eventManager, "NewEventPlaceAvailable")
        .withArgs(0, ...asArguments(createEventPlaceRequest));
    });

    it("should validate min and max tickets", async () => {
      const { eventManager, master } = await loadFixture(contracts);
      await expect(
        eventManager
          .connect(master)
          .createEventPlace(
            ...asArguments({ ...createEventPlaceRequest, minTickets: 0 }),
          ),
      ).to.be.revertedWith("Values must be greater than zero");
      await expect(
        eventManager
          .connect(master)
          .createEventPlace(
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
      const { eventManager, master } = await loadFixture(contracts);
      await expect(
        eventManager
          .connect(master)
          .createEventPlace(
            ...asArguments({ ...createEventPlaceRequest, minPrice: 0 }),
          ),
      ).to.be.revertedWith("Values must be greater than zero");
    });

    it("should validate min days", async () => {
      const { eventManager, master } = await loadFixture(contracts);
      await expect(
        eventManager
          .connect(master)
          .createEventPlace(
            ...asArguments({ ...createEventPlaceRequest, minDays: 0 }),
          ),
      ).to.be.revertedWith("Values must be greater than zero");
    });
  });
});
