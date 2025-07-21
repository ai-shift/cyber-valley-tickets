import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import bs58 from "bs58";
import { expect } from "chai";
import type { BaseContract, Signer } from "ethers";

describe("CyberValleyEventTicket", () => {
  describe("tokenURI", () => {
    it("returns valid URI", async () => {
      const { undertest, eventManager, master } =
        await loadFixture(deployContract);
      const cid = "QmTM7eS1BSMd9FfH4ihdjzVbyTPn8iCXtm3QLWkeRgEBtK";
      const mh = getBytes32FromMultiash(cid);
      await undertest
        .connect(eventManager)
        .mint(master, 1, mh.digest, mh.hashFunction, mh.size);
      const tx = await undertest.connect(master).tokenURI(1);
      await expect(tx).to.equal(`http://localhost:8080/${cid}`);
    });
  });
});

type ContractFixture = {
  undertest: CyberValleyEventTicket & BaseContract;
  master: Signer;
  eventManager: Signer;
};

async function deployContract(): Promise<ContractFixture> {
  const [owner, master, eventManager] = await ethers.getSigners();
  const CyberValleyEventTicketFactory = await ethers.getContractFactory(
    "CyberValleyEventTicket",
  );
  const eventTicket = await CyberValleyEventTicketFactory.deploy(
    "CyberValleyEventTicket",
    "CVET",
    eventManager,
  );
  eventTicket.connect(master).setEventManagerAddress(eventManager.address);
  return { master, eventManager, undertest: eventTicket };
}

function getBytes32FromMultiash(multihash) {
  const decoded = bs58.decode(multihash);
  return {
    digest: `0x${Buffer.from(decoded.slice(2)).toString("hex")}`,
    hashFunction: decoded[0],
    size: decoded[1],
  };
}
