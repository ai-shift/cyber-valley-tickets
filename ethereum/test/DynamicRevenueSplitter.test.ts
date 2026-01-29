import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("DynamicRevenueSplitter", () => {
  async function deploySplitterFixture() {
    const [admin, cyberiaDAO, cvePtPma, provider, shaman, sales, signer] =
      await ethers.getSigners();

    const usdt = await ethers.deployContract("SimpleERC20Xylose");

    const DynamicRevenueSplitter = await ethers.getContractFactory(
      "DynamicRevenueSplitter",
    );
    const splitter = await DynamicRevenueSplitter.deploy(
      await usdt.getAddress(),
      await cyberiaDAO.getAddress(),
      await cvePtPma.getAddress(),
      await admin.getAddress(),
    );

    const ADMIN_ROLE = await splitter.ADMIN_ROLE();

    return {
      splitter,
      usdt,
      admin,
      cyberiaDAO,
      cvePtPma,
      provider,
      shaman,
      sales,
      signer,
      ADMIN_ROLE,
    };
  }

  describe("Profile Creation & Validation", () => {
    it("should create a distribution profile successfully", async () => {
      const { splitter, provider, shaman, sales } = await loadFixture(
        deploySplitterFixture,
      );

      const recipients = [
        await provider.getAddress(),
        await shaman.getAddress(),
        await sales.getAddress(),
      ];
      const shares = [5000, 3000, 2000]; // Sums to 10000

      await expect(splitter.createDistributionProfile(recipients, shares))
        .to.emit(splitter, "DistributionProfileCreated")
        .withArgs(1, recipients, shares);

      const [retRecipients, retShares] = await splitter.getProfile(1);
      expect(retRecipients).to.deep.equal(recipients);
      expect(retShares).to.deep.equal(shares);
    });

    it("should fail if shares do not sum to 10000", async () => {
      const { splitter, provider } = await loadFixture(deploySplitterFixture);
      const recipients = [await provider.getAddress()];
      const shares = [9999];
      await expect(
        splitter.createDistributionProfile(recipients, shares),
      ).to.be.revertedWith("Shares must sum to 10000");
    });

    it("should fail if arrays length mismatch", async () => {
      const { splitter, provider } = await loadFixture(deploySplitterFixture);
      const recipients = [await provider.getAddress()];
      const shares = [5000, 5000];
      await expect(
        splitter.createDistributionProfile(recipients, shares),
      ).to.be.revertedWith("Arrays length mismatch");
    });

    it("should only be callable by admin", async () => {
      const { splitter, provider, signer, ADMIN_ROLE } = await loadFixture(
        deploySplitterFixture,
      );
      const recipients = [await provider.getAddress()];
      const shares = [10000];
      await expect(
        splitter.connect(signer).createDistributionProfile(recipients, shares),
      )
        .to.be.revertedWithCustomError(
          splitter,
          "AccessControlUnauthorizedAccount",
        )
        .withArgs(await signer.getAddress(), ADMIN_ROLE);
    });
  });

  describe("Profile Updates", () => {
    it("should update a distribution profile successfully", async () => {
      const { splitter, provider, shaman } = await loadFixture(
        deploySplitterFixture,
      );
      await splitter.createDistributionProfile(
        [await provider.getAddress()],
        [10000],
      );

      const newRecipients = [
        await provider.getAddress(),
        await shaman.getAddress(),
      ];
      const newShares = [5000, 5000];
      await expect(
        splitter.updateDistributionProfile(1, newRecipients, newShares),
      )
        .to.emit(splitter, "DistributionProfileUpdated")
        .withArgs(1, newRecipients, newShares);

      const [retRecipients, retShares] = await splitter.getProfile(1);
      expect(retRecipients).to.deep.equal(newRecipients);
      expect(retShares).to.deep.equal(newShares);
    });

    it("should fail if updating non-existent profile", async () => {
      const { splitter, provider } = await loadFixture(deploySplitterFixture);
      await expect(
        splitter.updateDistributionProfile(
          1,
          [await provider.getAddress()],
          [10000],
        ),
      ).to.be.revertedWith("Profile does not exist");
    });

    it("should only be callable by admin", async () => {
      const { splitter, provider, signer, ADMIN_ROLE } = await loadFixture(
        deploySplitterFixture,
      );
      await splitter.createDistributionProfile(
        [await provider.getAddress()],
        [10000],
      );
      await expect(
        splitter
          .connect(signer)
          .updateDistributionProfile(1, [await signer.getAddress()], [10000]),
      )
        .to.be.revertedWithCustomError(
          splitter,
          "AccessControlUnauthorizedAccount",
        )
        .withArgs(await signer.getAddress(), ADMIN_ROLE);
    });
  });

  describe("Revenue Distribution Logic", () => {
    it("should distribute revenue correctly with default profile", async () => {
      const { splitter, usdt, admin, cyberiaDAO, cvePtPma, provider, shaman } =
        await loadFixture(deploySplitterFixture);

      // Setup profile
      const recipients = [
        await provider.getAddress(),
        await shaman.getAddress(),
      ];
      const shares = [7000, 3000];
      await splitter.createDistributionProfile(recipients, shares);
      await splitter.setDefaultProfile(1);

      const amount = ethers.parseUnits("100", 6);
      await usdt.mint(amount);
      await usdt.approve(await splitter.getAddress(), amount);

      // We call distributeRevenue from admin (simulating EventManager)
      // Actually in real scenario EventManager calls it.
      await expect(splitter.distributeRevenue(amount, 123))
        .to.emit(splitter, "RevenueDistributed")
        .withArgs(amount, 123);

      // Check balances
      // Fixed: 10% to cyberiaDAO, 5% to cvePtPma
      // Flexible: 85% split 70/30
      // 100 * 0.10 = 10
      // 100 * 0.05 = 5
      // 100 * 0.85 = 85
      // 85 * 0.70 = 59.5
      // 85 * 0.30 = 25.5

      expect(await usdt.balanceOf(await cyberiaDAO.getAddress())).to.equal(
        ethers.parseUnits("10", 6),
      );
      expect(await usdt.balanceOf(await cvePtPma.getAddress())).to.equal(
        ethers.parseUnits("5", 6),
      );
      expect(await usdt.balanceOf(await provider.getAddress())).to.equal(
        ethers.parseUnits("59.5", 6),
      );
      expect(await usdt.balanceOf(await shaman.getAddress())).to.equal(
        ethers.parseUnits("25.5", 6),
      );
    });

    it("should use event-specific profile", async () => {
      const { splitter, usdt, provider, signer } = await loadFixture(
        deploySplitterFixture,
      );

      // Profile 1 (default)
      await splitter.createDistributionProfile(
        [await provider.getAddress()],
        [10000],
      );
      await splitter.setDefaultProfile(1);

      // Profile 2 (event specific)
      await splitter.createDistributionProfile(
        [await signer.getAddress()],
        [10000],
      );
      await splitter.setEventProfile(42, 2);

      const amount = ethers.parseUnits("100", 6);
      await usdt.mint(amount);
      await usdt.approve(await splitter.getAddress(), amount);

      await splitter.distributeRevenue(amount, 42);

      // 85% of 100 should go to signer
      expect(await usdt.balanceOf(await signer.getAddress())).to.equal(
        ethers.parseUnits("85", 6),
      );
      expect(await usdt.balanceOf(await provider.getAddress())).to.equal(0);
    });

    it("should fail if no profile is set (neither event nor default)", async () => {
      const { splitter, usdt } = await loadFixture(deploySplitterFixture);
      const amount = ethers.parseUnits("100", 6);
      await usdt.mint(amount);
      await usdt.approve(await splitter.getAddress(), amount);

      await expect(splitter.distributeRevenue(amount, 1)).to.be.revertedWith(
        "No distribution profile set",
      );
    });

    it("should correctly pull USDT from the caller", async () => {
      const { splitter, usdt, signer, provider } = await loadFixture(
        deploySplitterFixture,
      );
      await splitter.createDistributionProfile(
        [await provider.getAddress()],
        [10000],
      );
      await splitter.setDefaultProfile(1);

      const amount = ethers.parseUnits("100", 6);
      await usdt.mint(amount); // minted to 'admin' (deployer)

      // signer calls distributeRevenue without approving
      await expect(splitter.connect(signer).distributeRevenue(amount, 1)).to.be
        .reverted; // ERC20: insufficient allowance
    });

    it("should handle many recipients", async () => {
      const { splitter, usdt, provider } = await loadFixture(
        deploySplitterFixture,
      );
      const recipientCount = 20;
      const recipients = [];
      const shares = [];
      for (let i = 0; i < recipientCount; i++) {
        const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
        recipients.push(wallet.address);
        shares.push(500); // 5% each, total 100%
      }

      await splitter.createDistributionProfile(recipients, shares);
      await splitter.setDefaultProfile(1);

      const amount = ethers.parseUnits("100", 6);
      await usdt.mint(amount);
      await usdt.approve(await splitter.getAddress(), amount);

      await expect(splitter.distributeRevenue(amount, 1)).to.emit(
        splitter,
        "RevenueDistributed",
      );

      // Each should get 85 / 20 = 4.25
      expect(await usdt.balanceOf(recipients[0])).to.equal(
        ethers.parseUnits("4.25", 6),
      );
    });
  });
});
