import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import bs58 from "bs58";
import { expect } from "chai";
import type { BaseContract, Signer } from "ethers";
import { ethers } from "hardhat";
import type { CyberValleyEventTicket } from "../../typechain-types";

const IPFS_HOST = "http://test.ipfs.host";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("CyberValleyEventTicket", () => {
  describe("tokenURI", () => {
    it("returns valid URI", async function () {
      this.timeout(120000);
      const { undertest, eventManager, master } =
        await loadFixture(deployContract);
      const cid = "QmTM7eS1BSMd9FfH4ihdjzVbyTPn8iCXtm3QLWkeRgEBtK";
      const mh = getBytes32FromMultiash(cid);
      await undertest
        .connect(eventManager)
        .mint(master, 1, 0, mh.digest, mh.hashFunction, mh.size, ZERO_ADDRESS, 0);
      const tx = await undertest.connect(master).tokenURI(1);
      await expect(tx).to.equal(`${IPFS_HOST}/${cid}`);
    });

    it("reverts for non-existent token", async () => {
      const { undertest } = await loadFixture(deployContract);
      await expect(undertest.tokenURI(999)).to.be.revertedWithCustomError(
        undertest,
        "ERC721NonexistentToken",
      );
    });
  });

  describe("redeemTicket", () => {
    it("marks ticket as redeemed and emits event", async () => {
      const { undertest, eventManager, master, staff } =
        await loadFixture(deployContract);
      const mh = getTestMultihash();

      await undertest
        .connect(eventManager)
        .mint(master, 1, 0, mh.digest, mh.hashFunction, mh.size, ZERO_ADDRESS, 100);

      expect(await undertest.isRedeemed(1)).to.be.false;

      await expect(undertest.connect(staff).redeemTicket(1))
        .to.emit(undertest, "TicketRedeemed")
        .withArgs(1);

      expect(await undertest.isRedeemed(1)).to.be.true;
    });

    it("reverts if ticket already redeemed", async () => {
      const { undertest, eventManager, master, staff } =
        await loadFixture(deployContract);
      const mh = getTestMultihash();

      await undertest
        .connect(eventManager)
        .mint(master, 1, 0, mh.digest, mh.hashFunction, mh.size, ZERO_ADDRESS, 100);

      await undertest.connect(staff).redeemTicket(1);

      await expect(undertest.connect(staff).redeemTicket(1)).to.be.revertedWith(
        "Token was redeemed already",
      );
    });

    it("reverts if non-staff calls", async () => {
      const { undertest, eventManager, master, owner } =
        await loadFixture(deployContract);
      const mh = getTestMultihash();

      await undertest
        .connect(eventManager)
        .mint(master, 1, 0, mh.digest, mh.hashFunction, mh.size, ZERO_ADDRESS, 100);

      await expect(undertest.connect(owner).redeemTicket(1)).to.be.revertedWith(
        "Must have staff role",
      );
    });

    it("allows redeeming non-existent ticket (no existence check)", async () => {
      const { undertest, staff } = await loadFixture(deployContract);
      // Note: The contract doesn't check if token exists before redeeming
      // It only checks the isRedeemed mapping which defaults to false
      await expect(undertest.connect(staff).redeemTicket(999))
        .to.emit(undertest, "TicketRedeemed")
        .withArgs(999);
      expect(await undertest.isRedeemed(999)).to.be.true;
    });
  });

  describe("ticketMeta", () => {
    it("returns correct metadata for valid ticket", async () => {
      const { undertest, eventManager, master } =
        await loadFixture(deployContract);
      const mh = getTestMultihash();

      await undertest
        .connect(eventManager)
        .mint(master, 1, 0, mh.digest, mh.hashFunction, mh.size, ZERO_ADDRESS, 100);

      const meta = await undertest.ticketMeta(1);
      expect(meta.digest).to.equal(mh.digest);
      expect(meta.hashFunction).to.equal(mh.hashFunction);
      expect(meta.size).to.equal(mh.size);
    });

    it("reverts for non-existent ticket", async () => {
      const { undertest } = await loadFixture(deployContract);
      await expect(undertest.ticketMeta(999)).to.be.revertedWithCustomError(
        undertest,
        "ERC721NonexistentToken",
      );
    });
  });

  describe("transferFrom", () => {
    it("reverts for non-mint transfers (transfer restriction)", async () => {
      const { undertest, eventManager, master, owner } =
        await loadFixture(deployContract);
      const mh = getTestMultihash();

      // Mint ticket to master
      await undertest
        .connect(eventManager)
        .mint(master, 1, 0, mh.digest, mh.hashFunction, mh.size, ZERO_ADDRESS, 100);

      // Attempt to transfer from master to owner should fail
      await expect(
        undertest
          .connect(master)
          .transferFrom(await master.getAddress(), await owner.getAddress(), 1),
      ).to.be.revertedWith("Token transfer is disabled");
    });

    it("allows mint (from zero address)", async () => {
      const { undertest, eventManager, master } =
        await loadFixture(deployContract);
      const mh = getTestMultihash();

      // Mint should succeed (from address(0))
      await expect(
        undertest
          .connect(eventManager)
          .mint(master, 1, 0, mh.digest, mh.hashFunction, mh.size, ZERO_ADDRESS, 100),
      ).to.not.be.reverted;

      expect(await undertest.ownerOf(1)).to.equal(await master.getAddress());
    });
  });

  describe("setIpfsHost", () => {
    it("updates IPFS host (only master)", async () => {
      const { undertest, master } = await loadFixture(deployContract);

      const newHost = "https://new.ipfs.host";
      await undertest.connect(master).setIpfsHost(newHost);

      // Verify by minting and checking tokenURI
      const mh = getTestMultihash();
      const [, , eventManager] = await ethers.getSigners();
      await undertest
        .connect(eventManager)
        .mint(master, 1, 0, mh.digest, mh.hashFunction, mh.size, ZERO_ADDRESS, 100);

      const cid = getCIDFromMultihash(mh.digest, mh.hashFunction, mh.size);
      expect(await undertest.tokenURI(1)).to.equal(`${newHost}/${cid}`);
    });

    it("reverts if non-master calls", async () => {
      const { undertest, owner } = await loadFixture(deployContract);

      await expect(
        undertest.connect(owner).setIpfsHost("https://new.host"),
      ).to.be.revertedWith("Must have master role");
    });
  });

  describe("setEventManagerAddress", () => {
    it("sets event manager address and grants role (only once)", async () => {
      const [owner, master, newEventManager] = await ethers.getSigners();
      const CyberValleyEventTicketFactory = await ethers.getContractFactory(
        "CyberValleyEventTicket",
      );
      const eventTicket = await CyberValleyEventTicketFactory.deploy(
        "CyberValleyEventTicket",
        "CVET",
        master,
        "",
      );

      const EVENT_MANAGER_ROLE = await eventTicket.EVENT_MANAGER_ROLE();

      // Before setting, newEventManager should not have role
      expect(
        await eventTicket.hasRole(
          EVENT_MANAGER_ROLE,
          await newEventManager.getAddress(),
        ),
      ).to.be.false;

      await expect(
        eventTicket
          .connect(master)
          .setEventManagerAddress(await newEventManager.getAddress()),
      )
        .to.emit(eventTicket, "RoleGranted")
        .withArgs(
          EVENT_MANAGER_ROLE,
          await newEventManager.getAddress(),
          await master.getAddress(),
        );

      expect(
        await eventTicket.hasRole(
          EVENT_MANAGER_ROLE,
          await newEventManager.getAddress(),
        ),
      ).to.be.true;
      expect(await eventTicket.eventManagerAddress()).to.equal(
        await newEventManager.getAddress(),
      );
    });

    it("reverts for zero address", async () => {
      const { undertest, master } = await loadFixture(deployContract);

      await expect(
        undertest.connect(master).setEventManagerAddress(ethers.ZeroAddress),
      ).to.be.revertedWith("Event manager address cannot be zero");
    });

    it("reverts if already set", async () => {
      const { undertest, master, eventManager } =
        await loadFixture(deployContract);

      const [, , , newManager] = await ethers.getSigners();

      await expect(
        undertest
          .connect(master)
          .setEventManagerAddress(await newManager.getAddress()),
      ).to.be.revertedWith("Event manager was already saved");
    });

    it("reverts if non-admin calls", async () => {
      const { undertest, owner } = await loadFixture(deployContract);

      await expect(
        undertest
          .connect(owner)
          .setEventManagerAddress(await owner.getAddress()),
      ).to.be.revertedWithCustomError(
        undertest,
        "AccessControlUnauthorizedAccount",
      );
    });
  });

	  describe("mint (single)", () => {
	    it("mints single ticket with correct metadata", async () => {
	      const { undertest, eventManager, master, owner } =
	        await loadFixture(deployContract);
	      const mh = getTestMultihash();
	      const referrer = await owner.getAddress();

      await expect(
        undertest
          .connect(eventManager)
	          .mint(
	            master,
	            1,
	            0,
	            mh.digest,
	            mh.hashFunction,
	            mh.size,
	            referrer,
	            100,
	          ),
	      )
        .to.emit(undertest, "TicketMinted")
	        .withArgs(
	          1,
	          1,
	          0,
	          await master.getAddress(),
	          mh.digest,
	          mh.hashFunction,
	          mh.size,
	          referrer,
	          100,
	        );

      expect(await undertest.ownerOf(1)).to.equal(await master.getAddress());
    });

	    it("reverts if non-event-manager calls", async () => {
	      const { undertest, master, owner } = await loadFixture(deployContract);
	      const mh = getTestMultihash();

	      await expect(
	        undertest
	          .connect(owner)
	          .mint(
	            master,
	            1,
	            0,
	            mh.digest,
	            mh.hashFunction,
	            mh.size,
	            ZERO_ADDRESS,
	            100,
	          ),
	      ).to.be.revertedWith("Must have event manager role");
	    });

    it("increments token ID correctly", async () => {
      const { undertest, eventManager, master, owner } =
        await loadFixture(deployContract);
      const mh = getTestMultihash();

      await undertest
        .connect(eventManager)
        .mint(master, 1, 0, mh.digest, mh.hashFunction, mh.size, ZERO_ADDRESS, 100);
	      await undertest
	        .connect(eventManager)
	        .mint(owner, 2, 1, mh.digest, mh.hashFunction, mh.size, ZERO_ADDRESS, 200);

      expect(await undertest.ownerOf(1)).to.equal(await master.getAddress());
      expect(await undertest.ownerOf(2)).to.equal(await owner.getAddress());
    });
  });

  describe("mintBatch", () => {
    it("mints multiple tickets with correct metadata", async () => {
      const { undertest, eventManager, master } =
        await loadFixture(deployContract);
      const mh = getTestMultihash();

      await undertest
        .connect(eventManager)
	        .mintBatch(
	          master,
	          1,
	          0,
	          3,
	          mh.digest,
	          mh.hashFunction,
	          mh.size,
	          ZERO_ADDRESS,
	          50,
	        );

      expect(await undertest.ownerOf(1)).to.equal(await master.getAddress());
      expect(await undertest.ownerOf(2)).to.equal(await master.getAddress());
      expect(await undertest.ownerOf(3)).to.equal(await master.getAddress());
    });

    it("emits TicketMinted for each ticket", async () => {
      const { undertest, eventManager, master } =
        await loadFixture(deployContract);
      const mh = getTestMultihash();

      const tx = await undertest
        .connect(eventManager)
	        .mintBatch(
	          master,
	          1,
	          0,
	          2,
	          mh.digest,
	          mh.hashFunction,
	          mh.size,
	          ZERO_ADDRESS,
	          50,
	        );

      const receipt = await tx.wait();
      const events = receipt?.logs.filter(
        (log) => "fragment" in log && log.fragment?.name === "TicketMinted",
      );
      expect(events?.length).to.equal(2);
    });

    it("reverts if non-event-manager calls", async () => {
      const { undertest, master, owner } = await loadFixture(deployContract);
      const mh = getTestMultihash();

      await expect(
        undertest
          .connect(owner)
	          .mintBatch(
	            master,
	            1,
	            0,
	            2,
	            mh.digest,
	            mh.hashFunction,
	            mh.size,
	            ZERO_ADDRESS,
	            100,
	          ),
      ).to.be.revertedWith("Must have event manager role");
    });
  });

  describe("supportsInterface", () => {
    it("supports ERC721 interface", async () => {
      const { undertest } = await loadFixture(deployContract);
      // ERC721 interface ID: 0x80ac58cd
      expect(await undertest.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("supports AccessControl interface", async () => {
      const { undertest } = await loadFixture(deployContract);
      // AccessControl interface ID: 0x7965db0b
      expect(await undertest.supportsInterface("0x7965db0b")).to.be.true;
    });

    it("does not support invalid interface", async () => {
      const { undertest } = await loadFixture(deployContract);
      expect(await undertest.supportsInterface("0x12345678")).to.be.false;
    });
  });
});

type ContractFixture = {
  undertest: CyberValleyEventTicket & BaseContract;
  master: Signer;
  eventManager: Signer;
  staff: Signer;
  owner: Signer;
};

async function deployContract(): Promise<ContractFixture> {
  const [owner, master, eventManager, staff] = await ethers.getSigners();
  const CyberValleyEventTicketFactory = await ethers.getContractFactory(
    "CyberValleyEventTicket",
  );
  const eventTicket = await CyberValleyEventTicketFactory.deploy(
    "CyberValleyEventTicket",
    "CVET",
    master,
    "",
  );
  await eventTicket
    .connect(master)
    .setEventManagerAddress(eventManager.address);
  await eventTicket.connect(master).setIpfsHost(IPFS_HOST);

  // Grant STAFF_ROLE to staff
  const STAFF_ROLE = await eventTicket.STAFF_ROLE();
  await eventTicket
    .connect(master)
    .grantRole(STAFF_ROLE, await staff.getAddress());

  return { master, eventManager, staff, owner, undertest: eventTicket };
}

function getBytes32FromMultiash(multihash: string) {
  const decoded = bs58.decode(multihash);
  return {
    digest: `0x${Buffer.from(decoded.slice(2)).toString("hex")}`,
    hashFunction: decoded[0],
    size: decoded[1],
  };
}

function getTestMultihash() {
  return {
    digest:
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    hashFunction: 18,
    size: 32,
  };
}

function getCIDFromMultihash(
  digest: string,
  hashFunction: number,
  size: number,
): string {
  // Reverse of getBytes32FromMultiash for testing
  const hashBytes = Buffer.from(digest.slice(2), "hex");
  const multihashBytes = Buffer.concat([
    Buffer.from([hashFunction, size]),
    hashBytes,
  ]);
  return bs58.encode(multihashBytes);
}
