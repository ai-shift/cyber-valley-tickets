import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect, assert } from "chai";
import type { BaseContract } from "ethers";
import hre from "hardhat";
import { type CyberValleyEventManager, CyberValleyEventTicket, type SimpleERC20Xylose } from "../typechain-types";

type ContractsFixture = {
  sex: SimpleERC20Xylose & BaseContract;
  eventManager: CyberValleyEventManager & BaseContract;
  owner: any,
  master: any,
  devTeam: any
}

describe("CyberValleyEventManager", () => {
  const devTeamPercentage = 10;
  const masterPercentage = 50;

  async function contracts(): Promise<ContractsFixture> {
    const [owner, master, devTeam] = await hre.ethers.getSigners();
    const sex = await hre.ethers.deployContract("SimpleERC20Xylose");
    const CyberValleyEventManagerFactory = await hre.ethers.getContractFactory(
      "CyberValleyEventManager",
    );
    const eventManager = await CyberValleyEventManagerFactory.deploy(await sex.getAddress(), master, 50, devTeam, 10);
    return { sex, eventManager, owner, master, devTeam }
  }

  describe("createEventPlace", () => {
    const createEventPlaceRequest = [2, 1, 1, 1]
    it("allowed only to master", async () => {
      const { eventManager, master } = await loadFixture(contracts);
      await expect(eventManager.createEventPlace(...createEventPlaceRequest))
        .to.be.revertedWith("Must have master role")
    })

    it("should emit NewEventPlaceAvailable event", async () => {
      const { eventManager, master } = await loadFixture(contracts);
      await expect(eventManager.connect(master).createEventPlace(...createEventPlaceRequest))
        .to.emit(eventManager, "NewEventPlaceAvailable")
        .withArgs(0, ...createEventPlaceRequest);
    });
  })

});
