import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("DynamicRevenueSplitter", () => {
  async function deploySplitterFixture() {
    const [
      admin,
      cyberiaDAO,
      cvePtPma,
      provider,
      shaman,
      sales,
      signer,
      localProvider,
      master,
    ] = await ethers.getSigners();

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
    const LOCAL_PROVIDER_ROLE = await splitter.LOCAL_PROVIDER_ROLE();

    // Grant LOCAL_PROVIDER_ROLE to localProvider for testing
    await splitter
      .connect(admin)
      .grantRole(LOCAL_PROVIDER_ROLE, await localProvider.getAddress());

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
      localProvider,
      master,
      ADMIN_ROLE,
      LOCAL_PROVIDER_ROLE,
    };
  }

  describe("Profile Creation", () => {
    it("allows LocalProvider to create profile for themselves", async () => {
      const { splitter, localProvider } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(localProvider)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      const [recipients, shares, owner, isActive] =
        await splitter.getProfile(1);
      expect(owner).to.equal(await localProvider.getAddress());
      expect(isActive).to.be.true;
    });

    it("allows Admin to create profile for any owner", async () => {
      const { splitter, admin, localProvider } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(admin)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      const [recipients, shares, owner, isActive] =
        await splitter.getProfile(1);
      expect(owner).to.equal(await localProvider.getAddress());
      expect(isActive).to.be.true;
    });

    it("reverts if LocalProvider tries to specify different owner", async () => {
      const { splitter, localProvider, provider } = await loadFixture(
        deploySplitterFixture,
      );

      await expect(
        splitter
          .connect(localProvider)
          .createDistributionProfile(
            await provider.getAddress(),
            [await provider.getAddress()],
            [10000],
          ),
      ).to.be.revertedWith(
        "LocalProvider can only create profiles for themselves",
      );
    });

    it("emits DistributionProfileCreated with correct owner", async () => {
      const { splitter, localProvider } = await loadFixture(
        deploySplitterFixture,
      );
      const recipients = [await localProvider.getAddress()];
      const shares = [10000];

      await expect(
        splitter
          .connect(localProvider)
          .createDistributionProfile(
            await localProvider.getAddress(),
            recipients,
            shares,
          ),
      )
        .to.emit(splitter, "DistributionProfileCreated")
        .withArgs(1, await localProvider.getAddress(), recipients, shares);
    });
  });

  describe("Profile Updates", () => {
    it("allows owner to update their profile", async () => {
      const { splitter, localProvider, provider } = await loadFixture(
        deploySplitterFixture,
      );

      // Create profile
      await splitter
        .connect(localProvider)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      // Update as owner
      const newRecipients = [
        await localProvider.getAddress(),
        await provider.getAddress(),
      ];
      const newShares = [5000, 5000];

      await expect(
        splitter
          .connect(localProvider)
          .updateDistributionProfile(1, newRecipients, newShares),
      )
        .to.emit(splitter, "DistributionProfileUpdated")
        .withArgs(1, newRecipients, newShares);

      const [recipients, shares] = await splitter.getProfile(1);
      expect(recipients).to.deep.equal(newRecipients);
      expect(shares).to.deep.equal(newShares);
    });

    it("allows admin to update any profile", async () => {
      const { splitter, admin, localProvider, provider } = await loadFixture(
        deploySplitterFixture,
      );

      // Create profile as localProvider
      await splitter
        .connect(localProvider)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      // Update as admin
      const newRecipients = [await provider.getAddress()];
      const newShares = [10000];

      await expect(
        splitter
          .connect(admin)
          .updateDistributionProfile(1, newRecipients, newShares),
      )
        .to.emit(splitter, "DistributionProfileUpdated")
        .withArgs(1, newRecipients, newShares);
    });

    it("reverts if non-owner tries to update", async () => {
      const { splitter, localProvider, provider } = await loadFixture(
        deploySplitterFixture,
      );

      // Create profile as localProvider
      await splitter
        .connect(localProvider)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      // Try to update as provider (not owner, not admin)
      await expect(
        splitter
          .connect(provider)
          .updateDistributionProfile(1, [await provider.getAddress()], [10000]),
      ).to.be.revertedWith("Caller must be profile owner or admin");
    });
  });

  describe("Profile Ownership", () => {
    it("isProfileOwner returns true for owner", async () => {
      const { splitter, localProvider } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(localProvider)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      expect(await splitter.isProfileOwner(1, await localProvider.getAddress()))
        .to.be.true;
    });

    it("isProfileOwner returns false for non-owner", async () => {
      const { splitter, localProvider, provider } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(localProvider)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      expect(await splitter.isProfileOwner(1, await provider.getAddress())).to
        .be.false;
    });

    it("getProfilesByOwner returns all profile IDs for an owner", async () => {
      const { splitter, localProvider } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(localProvider)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      await splitter
        .connect(localProvider)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      const profileIds = await splitter.getProfilesByOwner(
        await localProvider.getAddress(),
      );
      expect(profileIds).to.deep.equal([1n, 2n]);
    });
  });

  describe("Profile Transfer", () => {
    it("allows admin to transfer single profile ownership", async () => {
      const { splitter, admin, localProvider, provider } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(localProvider)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      await expect(
        splitter
          .connect(admin)
          .transferProfileOwnership(1, await provider.getAddress()),
      )
        .to.emit(splitter, "ProfileOwnershipTransferred")
        .withArgs(
          1,
          await localProvider.getAddress(),
          await provider.getAddress(),
        );

      const [, , owner] = await splitter.getProfile(1);
      expect(owner).to.equal(await provider.getAddress());

      // Check profile IDs updated
      expect(
        await splitter.getProfilesByOwner(await localProvider.getAddress()),
      ).to.deep.equal([]);
      expect(
        await splitter.getProfilesByOwner(await provider.getAddress()),
      ).to.deep.equal([1n]);
    });

    it("allows admin to transfer all profiles from one owner to another", async () => {
      const { splitter, admin, localProvider, master } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(localProvider)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      await splitter
        .connect(localProvider)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      await expect(
        splitter
          .connect(admin)
          .transferAllProfiles(
            await localProvider.getAddress(),
            await master.getAddress(),
          ),
      )
        .to.emit(splitter, "AllProfilesTransferred")
        .withArgs(await localProvider.getAddress(), await master.getAddress());

      const [, , owner1] = await splitter.getProfile(1);
      const [, , owner2] = await splitter.getProfile(2);
      expect(owner1).to.equal(await master.getAddress());
      expect(owner2).to.equal(await master.getAddress());

      expect(
        await splitter.getProfilesByOwner(await localProvider.getAddress()),
      ).to.deep.equal([]);
      expect(
        await splitter.getProfilesByOwner(await master.getAddress()),
      ).to.deep.equal([1n, 2n]);
    });

    it("reverts transferProfileOwnership if non-admin calls", async () => {
      const { splitter, localProvider, provider } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(localProvider)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      await expect(
        splitter
          .connect(localProvider)
          .transferProfileOwnership(1, await provider.getAddress()),
      ).to.be.revertedWithCustomError(
        splitter,
        "AccessControlUnauthorizedAccount",
      );
    });
  });

  describe("Profile Deactivation", () => {
    it("allows owner to deactivate their profile", async () => {
      const { splitter, localProvider } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(localProvider)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      await expect(splitter.connect(localProvider).deactivateProfile(1))
        .to.emit(splitter, "ProfileDeactivated")
        .withArgs(1);

      const [, , , isActive] = await splitter.getProfile(1);
      expect(isActive).to.be.false;
    });

    it("allows admin to deactivate any profile", async () => {
      const { splitter, admin, localProvider } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(localProvider)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      await expect(splitter.connect(admin).deactivateProfile(1))
        .to.emit(splitter, "ProfileDeactivated")
        .withArgs(1);

      const [, , , isActive] = await splitter.getProfile(1);
      expect(isActive).to.be.false;
    });

    it("reverts if non-owner tries to deactivate", async () => {
      const { splitter, localProvider, provider } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(localProvider)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      await expect(
        splitter.connect(provider).deactivateProfile(1),
      ).to.be.revertedWith("Caller must be profile owner or admin");
    });

    it("cannot set deactivated profile as default", async () => {
      const { splitter, admin, localProvider } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(localProvider)
        .createDistributionProfile(
          await localProvider.getAddress(),
          [await localProvider.getAddress()],
          [10000],
        );

      await splitter.connect(localProvider).deactivateProfile(1);

      await expect(
        splitter.connect(admin).setDefaultProfile(1),
      ).to.be.revertedWith("Profile is not active");
    });
  });

  describe("Profile Creation & Validation", () => {
    it("should create a distribution profile successfully", async () => {
      const { splitter, provider, shaman, sales, admin } = await loadFixture(
        deploySplitterFixture,
      );

      const recipients = [
        await provider.getAddress(),
        await shaman.getAddress(),
        await sales.getAddress(),
      ];
      const shares = [5000, 3000, 2000]; // Sums to 10000

      await expect(
        splitter
          .connect(admin)
          .createDistributionProfile(
            await admin.getAddress(),
            recipients,
            shares,
          ),
      )
        .to.emit(splitter, "DistributionProfileCreated")
        .withArgs(1, await admin.getAddress(), recipients, shares);

      const [retRecipients, retShares, owner, isActive] =
        await splitter.getProfile(1);
      expect(retRecipients).to.deep.equal(recipients);
      expect(retShares).to.deep.equal(shares);
    });

    it("should fail if shares do not sum to 10000", async () => {
      const { splitter, provider, admin } = await loadFixture(
        deploySplitterFixture,
      );
      const recipients = [await provider.getAddress()];
      const shares = [9999];
      await expect(
        splitter
          .connect(admin)
          .createDistributionProfile(
            await admin.getAddress(),
            recipients,
            shares,
          ),
      ).to.be.revertedWith("Shares must sum to 10000");
    });

    it("should fail if arrays length mismatch", async () => {
      const { splitter, provider, admin } = await loadFixture(
        deploySplitterFixture,
      );
      const recipients = [await provider.getAddress()];
      const shares = [5000, 5000];
      await expect(
        splitter
          .connect(admin)
          .createDistributionProfile(
            await admin.getAddress(),
            recipients,
            shares,
          ),
      ).to.be.revertedWith("Arrays length mismatch");
    });

    it("should only be callable by admin or local provider", async () => {
      const { splitter, provider, signer } = await loadFixture(
        deploySplitterFixture,
      );
      const recipients = [await provider.getAddress()];
      const shares = [10000];
      await expect(
        splitter
          .connect(signer)
          .createDistributionProfile(
            await signer.getAddress(),
            recipients,
            shares,
          ),
      ).to.be.revertedWith(
        "Caller must have ADMIN_ROLE or LOCAL_PROVIDER_ROLE",
      );
    });
  });

  describe("Profile Updates", () => {
    it("should update a distribution profile successfully", async () => {
      const { splitter, provider, shaman, admin } = await loadFixture(
        deploySplitterFixture,
      );
      await splitter.createDistributionProfile(
        await admin.getAddress(),
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
      const { splitter, provider, admin } = await loadFixture(
        deploySplitterFixture,
      );
      await expect(
        splitter.updateDistributionProfile(
          1,
          [await provider.getAddress()],
          [10000],
        ),
      ).to.be.revertedWith("Profile does not exist");
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
      await splitter.createDistributionProfile(
        await admin.getAddress(),
        recipients,
        shares,
      );
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
      const { splitter, usdt, admin, provider, signer } = await loadFixture(
        deploySplitterFixture,
      );

      // Profile 1 (default)
      await splitter.createDistributionProfile(
        await admin.getAddress(),
        [await provider.getAddress()],
        [10000],
      );
      await splitter.setDefaultProfile(1);

      // Profile 2 (event specific)
      await splitter.createDistributionProfile(
        await admin.getAddress(),
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
      const { splitter, usdt, admin } = await loadFixture(
        deploySplitterFixture,
      );
      const amount = ethers.parseUnits("100", 6);
      await usdt.mint(amount);
      await usdt.approve(await splitter.getAddress(), amount);

      await expect(splitter.distributeRevenue(amount, 1)).to.be.revertedWith(
        "No distribution profile set",
      );
    });

    it("should correctly pull USDT from the caller", async () => {
      const { splitter, usdt, signer, provider, admin } = await loadFixture(
        deploySplitterFixture,
      );
      await splitter.createDistributionProfile(
        await admin.getAddress(),
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
      const { splitter, usdt, provider, admin } = await loadFixture(
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

      await splitter.createDistributionProfile(
        await admin.getAddress(),
        recipients,
        shares,
      );
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
