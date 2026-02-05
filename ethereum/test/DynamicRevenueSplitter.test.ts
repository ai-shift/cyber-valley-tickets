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
      profileManager,
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
    const PROFILE_MANAGER_ROLE = await splitter.PROFILE_MANAGER_ROLE();

    // Grant PROFILE_MANAGER_ROLE to profileManager for testing
    await splitter
      .connect(admin)
      .grantProfileManager(await profileManager.getAddress(), 1000); // 10% bps

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
      profileManager,
      master,
      ADMIN_ROLE,
      PROFILE_MANAGER_ROLE,
    };
  }

  describe("Profile Creation", () => {
    it("allows ProfileManager to create profile", async () => {
      const { splitter, profileManager, provider } = await loadFixture(
        deploySplitterFixture,
      );

      await expect(
        splitter
          .connect(profileManager)
          .createDistributionProfile([await provider.getAddress()], [7500]),
      )
        .to.emit(splitter, "DistributionProfileCreated")
        .withArgs(
          1,
          await profileManager.getAddress(),
          [await provider.getAddress(), await profileManager.getAddress()],
          [7500, 1000],
        );

      expect(await splitter.isProfileOwner(1, await profileManager.getAddress())).to
        .be.true;
    });

    it("allows Admin to create profile", async () => {
      const { splitter, admin, provider } = await loadFixture(
        deploySplitterFixture,
      );

      await expect(
        splitter
          .connect(admin)
          .createDistributionProfile([await provider.getAddress()], [8500]),
      )
        .to.emit(splitter, "DistributionProfileCreated")
        .withArgs(
          1,
          await admin.getAddress(),
          [await provider.getAddress()],
          [8500],
        );

      expect(await splitter.isProfileOwner(1, await admin.getAddress())).to.be.true;
    });

    it("reverts if ProfileManager tries to add themselves to recipients", async () => {
      const { splitter, profileManager } = await loadFixture(
        deploySplitterFixture,
      );

      await expect(
        splitter
          .connect(profileManager)
          .createDistributionProfile(
            [await profileManager.getAddress()],
            [7500],
          ),
      ).to.be.revertedWith(
        "Profile owner is added automatically to distribution",
      );
    });

    it("emits DistributionProfileCreated with correct owner", async () => {
      const { splitter, profileManager, provider } = await loadFixture(
        deploySplitterFixture,
      );
      const recipients = [
        await provider.getAddress(),
        await profileManager.getAddress(),
      ];
      const shares = [7500, 1000];

      await expect(
        splitter
          .connect(profileManager)
          .createDistributionProfile([await provider.getAddress()], [7500]),
      )
        .to.emit(splitter, "DistributionProfileCreated")
        .withArgs(1, await profileManager.getAddress(), recipients, shares);
    });
  });

  describe("Profile Updates", () => {
    it("allows admin to update any profile", async () => {
      const { splitter, admin, profileManager, provider, shaman } = await loadFixture(
        deploySplitterFixture,
      );

      // Create profile as profileManager
      await splitter
        .connect(profileManager)
        .createDistributionProfile([await provider.getAddress()], [7500]);

      // Update as admin
      const newRecipients = [
        await provider.getAddress(),
        await shaman.getAddress(),
        await profileManager.getAddress(),
      ];
      const newShares = [3750, 3750, 1000];

      await expect(
        splitter
          .connect(admin)
          .updateDistributionProfile(
            1,
            newRecipients.slice(0, 2),
            [3750, 3750],
          ),
      )
        .to.emit(splitter, "DistributionProfileUpdated")
        .withArgs(1, newRecipients, newShares);
    });

    it("allows admin to update any profile", async () => {
      const { splitter, admin, profileManager, provider } = await loadFixture(
        deploySplitterFixture,
      );

      // Create profile as profileManager (use provider as recipient, not self)
      await splitter
        .connect(profileManager)
        .createDistributionProfile([await provider.getAddress()], [7500]);

      // Update as admin
      const newRecipients = [
        await provider.getAddress(),
        await profileManager.getAddress(),
      ];
      const newShares = [7500, 1000];

      await expect(
        splitter
          .connect(admin)
          .updateDistributionProfile(1, [await provider.getAddress()], [7500]),
      )
        .to.emit(splitter, "DistributionProfileUpdated")
        .withArgs(1, newRecipients, newShares);
    });

    it("reverts if update tries to add owner to recipients", async () => {
      const { splitter, admin, profileManager, provider } = await loadFixture(
        deploySplitterFixture,
      );

      // Create profile as profileManager
      await splitter
        .connect(profileManager)
        .createDistributionProfile([await provider.getAddress()], [7500]);

      // Try to update adding owner (profileManager) to recipients
      await expect(
        splitter
          .connect(admin)
          .updateDistributionProfile(
            1,
            [await profileManager.getAddress()],
            [7500],
          ),
      ).to.be.revertedWith(
        "Profile owner is added automatically to distribution",
      );
    });

    it("reverts if non-admin tries to update", async () => {
      const { splitter, profileManager, provider, shaman } = await loadFixture(
        deploySplitterFixture,
      );

      // Create profile as profileManager
      await splitter
        .connect(profileManager)
        .createDistributionProfile([await shaman.getAddress()], [7500]);

      // Try to update as provider (not admin)
      await expect(
        splitter
          .connect(provider)
          .updateDistributionProfile(1, [await provider.getAddress()], [8500]),
      ).to.be.revertedWithCustomError(
        splitter,
        "AccessControlUnauthorizedAccount",
      );
    });
  });

  describe("Profile Ownership", () => {
    it("isProfileOwner returns true for owner", async () => {
      const { splitter, profileManager, provider } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(profileManager)
        .createDistributionProfile([await provider.getAddress()], [7500]);

      expect(
        await splitter.isProfileOwner(1, await profileManager.getAddress()),
      ).to.be.true;
    });

    it("isProfileOwner returns false for non-owner", async () => {
      const { splitter, profileManager, provider, shaman } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(profileManager)
        .createDistributionProfile([await shaman.getAddress()], [7500]);

      expect(await splitter.isProfileOwner(1, await provider.getAddress())).to
        .be.false;
    });

    it("isProfileOwner works correctly after creating multiple profiles", async () => {
      const { splitter, profileManager, provider, shaman } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(profileManager)
        .createDistributionProfile([await provider.getAddress()], [7500]);

      await splitter
        .connect(profileManager)
        .createDistributionProfile([await shaman.getAddress()], [7500]);

      expect(await splitter.isProfileOwner(1, await profileManager.getAddress())).to
        .be.true;
      expect(await splitter.isProfileOwner(2, await profileManager.getAddress())).to
        .be.true;
    });
  });

  describe("Profile Transfer", () => {
    it("allows admin to transfer single profile ownership", async () => {
      const { splitter, admin, profileManager, provider, shaman } =
        await loadFixture(deploySplitterFixture);

      await splitter
        .connect(profileManager)
        .createDistributionProfile([await shaman.getAddress()], [7500]);

      await expect(
        splitter
          .connect(admin)
          .transferProfileOwnership(1, await provider.getAddress()),
      )
        .to.emit(splitter, "ProfileOwnershipTransferred")
        .withArgs(
          1,
          await profileManager.getAddress(),
          await provider.getAddress(),
        );

      // Verify ownership transfer
      expect(await splitter.isProfileOwner(1, await provider.getAddress())).to.be
        .true;
      expect(await splitter.isProfileOwner(1, await profileManager.getAddress())).to
        .be.false;
    });

    it("allows admin to transfer all profiles from one owner to another", async () => {
      const { splitter, admin, profileManager, master, provider, shaman } =
        await loadFixture(deploySplitterFixture);

      await splitter
        .connect(profileManager)
        .createDistributionProfile([await provider.getAddress()], [7500]);

      await splitter
        .connect(profileManager)
        .createDistributionProfile([await shaman.getAddress()], [7500]);

      await splitter
        .connect(admin)
        .transferAllProfiles(
          await profileManager.getAddress(),
          await master.getAddress(),
        );

      // Verify ownership transfer for both profiles
      expect(await splitter.isProfileOwner(1, await master.getAddress())).to.be
        .true;
      expect(await splitter.isProfileOwner(2, await master.getAddress())).to.be
        .true;
      expect(await splitter.isProfileOwner(1, await profileManager.getAddress())).to
        .be.false;
      expect(await splitter.isProfileOwner(2, await profileManager.getAddress())).to
        .be.false;
    });

    it("reverts transferProfileOwnership if non-admin calls", async () => {
      const { splitter, profileManager, provider, shaman } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(profileManager)
        .createDistributionProfile([await shaman.getAddress()], [7500]);

      await expect(
        splitter
          .connect(profileManager)
          .transferProfileOwnership(1, await provider.getAddress()),
      ).to.be.revertedWithCustomError(
        splitter,
        "AccessControlUnauthorizedAccount",
      );
    });
  });

  describe("Profile Deactivation", () => {
    it("allows owner to deactivate their profile", async () => {
      const { splitter, profileManager, provider } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(profileManager)
        .createDistributionProfile([await provider.getAddress()], [7500]);

      await expect(splitter.connect(profileManager).deactivateProfile(1))
        .to.emit(splitter, "ProfileDeactivated")
        .withArgs(1);

      // Verify deactivation by checking setEventProfile fails
      await expect(
        splitter.setEventProfile(1, 1),
      ).to.be.revertedWith("Profile is not active");
    });

    it("allows admin to deactivate any profile", async () => {
      const { splitter, admin, profileManager, provider } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(profileManager)
        .createDistributionProfile([await provider.getAddress()], [7500]);

      await expect(splitter.connect(admin).deactivateProfile(1))
        .to.emit(splitter, "ProfileDeactivated")
        .withArgs(1);

      // Verify deactivation by checking setEventProfile fails
      await expect(
        splitter.setEventProfile(1, 1),
      ).to.be.revertedWith("Profile is not active");
    });

    it("reverts if non-owner tries to deactivate", async () => {
      const { splitter, profileManager, provider, shaman } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(profileManager)
        .createDistributionProfile([await shaman.getAddress()], [7500]);

      await expect(
        splitter.connect(provider).deactivateProfile(1),
      ).to.be.revertedWith("Caller must be profile owner or admin");
    });

    it("cannot set deactivated profile for event", async () => {
      const { splitter, admin, profileManager, provider } = await loadFixture(
        deploySplitterFixture,
      );

      await splitter
        .connect(profileManager)
        .createDistributionProfile([await provider.getAddress()], [7500]);

      await splitter.connect(profileManager).deactivateProfile(1);

      await expect(
        splitter.connect(admin).setEventProfile(1, 1),
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
      const shares = [4000, 3000, 1500]; // Sums to 8500

      await expect(
        splitter.connect(admin).createDistributionProfile(recipients, shares),
      )
        .to.emit(splitter, "DistributionProfileCreated")
        .withArgs(1, await admin.getAddress(), recipients, shares);

      // Verify profile was created via event emission (already checked above)
      // and owner verification
      expect(await splitter.isProfileOwner(1, await admin.getAddress())).to.be.true;
    });

    it("should fail if shares do not sum to 10000", async () => {
      const { splitter, provider, admin } = await loadFixture(
        deploySplitterFixture,
      );
      const recipients = [await provider.getAddress()];
      const shares = [9999];
      await expect(
        splitter.connect(admin).createDistributionProfile(recipients, shares),
      ).to.be.revertedWith("Shares must sum to remaining bps");
    });

    it("should fail if arrays length mismatch", async () => {
      const { splitter, provider, admin } = await loadFixture(
        deploySplitterFixture,
      );
      const recipients = [await provider.getAddress()];
      const shares = [5000, 5000];
      await expect(
        splitter.connect(admin).createDistributionProfile(recipients, shares),
      ).to.be.revertedWith("Arrays length mismatch");
    });

    it("should only be callable by admin or profile manager", async () => {
      const { splitter, provider, signer } = await loadFixture(
        deploySplitterFixture,
      );
      const recipients = [await provider.getAddress()];
      const shares = [10000];
      await expect(
        splitter.connect(signer).createDistributionProfile(recipients, shares),
      ).to.be.revertedWith(
        "Caller must have ADMIN_ROLE or PROFILE_MANAGER_ROLE",
      );
    });

    it("should fail for profile manager when shares do not reserve owner bps", async () => {
      const { splitter, profileManager, provider } = await loadFixture(
        deploySplitterFixture,
      );

      await expect(
        splitter
          .connect(profileManager)
          .createDistributionProfile([await provider.getAddress()], [10000]),
      ).to.be.revertedWith("Shares must sum to remaining bps");
    });

    it("should fail for duplicate recipients", async () => {
      const { splitter, admin, provider } = await loadFixture(
        deploySplitterFixture,
      );
      const recipient = await provider.getAddress();

      await expect(
        splitter
          .connect(admin)
          .createDistributionProfile([recipient, recipient], [5000, 5000]),
      ).to.be.revertedWith("Duplicate recipient");
    });
  });

  describe("Profile Updates", () => {
    it("should update a distribution profile successfully", async () => {
      const { splitter, provider, shaman, admin } = await loadFixture(
        deploySplitterFixture,
      );
      await splitter.createDistributionProfile(
        [await provider.getAddress()],
        [8500],
      );

      const newRecipients = [
        await provider.getAddress(),
        await shaman.getAddress(),
      ];
      const newShares = [5000, 3500];
      await expect(
        splitter.updateDistributionProfile(1, newRecipients, newShares),
      )
        .to.emit(splitter, "DistributionProfileUpdated")
        .withArgs(1, newRecipients, newShares);

      // Verify update via event emission (already checked above)
    });

    it("should fail if updating non-existent profile", async () => {
      const { splitter, provider, admin } = await loadFixture(
        deploySplitterFixture,
      );
      // Accessing profiles[0] when array is empty causes panic 0x32
      await expect(
        splitter
          .connect(admin)
          .updateDistributionProfile(1, [await provider.getAddress()], [8500]),
      ).to.be.revertedWithPanic(0x32);
    });

    it("should use profile owner bps when admin updates manager profile", async () => {
      const { splitter, admin, profileManager, provider, shaman } =
        await loadFixture(deploySplitterFixture);

      await splitter
        .connect(profileManager)
        .createDistributionProfile([await provider.getAddress()], [7500]);

      await expect(
        splitter
          .connect(admin)
          .updateDistributionProfile(
            1,
            [await provider.getAddress(), await shaman.getAddress()],
            [5000, 5000],
          ),
      ).to.be.revertedWith("Shares must sum to remaining bps");

      await expect(
        splitter
          .connect(admin)
          .updateDistributionProfile(
            1,
            [await provider.getAddress(), await shaman.getAddress()],
            [3750, 3750],
          ),
      )
        .to.emit(splitter, "DistributionProfileUpdated")
        .withArgs(
          1,
          [
            await provider.getAddress(),
            await shaman.getAddress(),
            await profileManager.getAddress(),
          ],
          [3750, 3750, 1000],
        );
    });
  });

  describe("Profile Manager (bps)", () => {
    it("should grant profile manager with bps", async () => {
      const { splitter, admin, provider } = await loadFixture(
        deploySplitterFixture,
      );

      await expect(
        splitter
          .connect(admin)
          .grantProfileManager(await provider.getAddress(), 2000),
      )
        .to.emit(splitter, "ProfileManagerGranted")
        .withArgs(await provider.getAddress(), 2000);

      expect(
        await splitter.profileManagerBps(await provider.getAddress()),
      ).to.equal(2000);
      expect(
        await splitter.hasRole(
          await splitter.PROFILE_MANAGER_ROLE(),
          await provider.getAddress(),
        ),
      ).to.be.true;
    });

    it("should fail if bps exceeds max", async () => {
      const { splitter, admin, provider } = await loadFixture(
        deploySplitterFixture,
      );

      await expect(
        splitter
          .connect(admin)
          .grantProfileManager(await provider.getAddress(), 9000),
      ).to.be.revertedWith("Bps must be <= 8500");
    });
  });

  describe("Revenue Distribution Logic", () => {
    it("should distribute revenue correctly with profile manager bps", async () => {
      const {
        splitter,
        usdt,
        admin,
        cyberiaDAO,
        cvePtPma,
        provider,
        shaman,
        profileManager,
      } = await loadFixture(deploySplitterFixture);

      // Setup profile with profileManager as owner (has 10% bps)
      const recipients = [
        await provider.getAddress(),
        await shaman.getAddress(),
      ];
      const shares = [5250, 2250];
      await splitter
        .connect(profileManager)
        .createDistributionProfile(recipients, shares);
      await splitter.setEventProfile(123, 1);

      const amount = ethers.parseUnits("100", 6);
      await usdt.mint(amount);
      await usdt.approve(await splitter.getAddress(), amount);

      // We call distributeRevenue from admin (simulating EventManager)
      await expect(splitter.distributeRevenue(amount, 123))
        .to.emit(splitter, "RevenueDistributed")
        .withArgs(amount, 123);

      // Check balances
      // Fixed: 10% to cyberiaDAO, 5% to cvePtPma
      // Profile shares sum to 85% (owner auto-added)
      // 100 * 0.10 = 10 (cyberiaDAO)
      // 100 * 0.05 = 5 (cvePtPma)
      // 100 * 0.525 = 52.5 (provider)
      // 100 * 0.225 = 22.5 (shaman)
      // 100 * 0.10 = 10 (profileManager)

      expect(await usdt.balanceOf(await cyberiaDAO.getAddress())).to.equal(
        ethers.parseUnits("10", 6),
      );
      expect(await usdt.balanceOf(await cvePtPma.getAddress())).to.equal(
        ethers.parseUnits("5", 6),
      );
      expect(await usdt.balanceOf(await profileManager.getAddress())).to.equal(
        ethers.parseUnits("10", 6),
      );
      expect(await usdt.balanceOf(await provider.getAddress())).to.equal(
        ethers.parseUnits("52.5", 6),
      );
      expect(await usdt.balanceOf(await shaman.getAddress())).to.equal(
        ethers.parseUnits("22.5", 6),
      );
    });

    it("should use event-specific profile", async () => {
      const { splitter, usdt, admin, provider, signer, profileManager } =
        await loadFixture(deploySplitterFixture);

      // Create profile as profileManager (has 10% bps)
      await splitter
        .connect(profileManager)
        .createDistributionProfile([await signer.getAddress()], [7500]);
      await splitter.setEventProfile(42, 1);

      const amount = ethers.parseUnits("100", 6);
      await usdt.mint(amount);
      await usdt.approve(await splitter.getAddress(), amount);

      await splitter.distributeRevenue(amount, 42);

      // Signer has 75% of profile shares, owner has 10%, fixed 15%
      expect(await usdt.balanceOf(await signer.getAddress())).to.equal(
        ethers.parseUnits("75", 6),
      );
      expect(await usdt.balanceOf(await provider.getAddress())).to.equal(0);
    });

    it("should handle many recipients", async () => {
      const { splitter, usdt, profileManager } = await loadFixture(
        deploySplitterFixture,
      );
      const recipientCount = 20;
      const recipients = [];
      const shares = [];
      for (let i = 0; i < recipientCount; i++) {
        const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
        recipients.push(wallet.address);
        shares.push(375); // 3.75% each, total 75%
      }

      await splitter
        .connect(profileManager)
        .createDistributionProfile(recipients, shares);
      await splitter.setEventProfile(1, 1);

      const amount = ethers.parseUnits("100", 6);
      await usdt.mint(amount);
      await usdt.approve(await splitter.getAddress(), amount);

      await expect(splitter.distributeRevenue(amount, 1)).to.emit(
        splitter,
        "RevenueDistributed",
      );

      // Each recipient has 3.75% share => 3.75
      expect(await usdt.balanceOf(recipients[0])).to.equal(
        ethers.parseUnits("3.75", 6),
      );
    });

    it("should correctly pull USDT from the caller", async () => {
      const { splitter, usdt, signer, provider, admin } = await loadFixture(
        deploySplitterFixture,
      );
      await splitter.createDistributionProfile(
        [await provider.getAddress()],
        [8500],
      );
      await splitter.setEventProfile(1, 1);

      const amount = ethers.parseUnits("100", 6);
      await usdt.mint(amount); // minted to 'admin' (deployer)

      // signer calls distributeRevenue without approving
      await expect(splitter.connect(signer).distributeRevenue(amount, 1)).to.be
        .reverted; // ERC20: insufficient allowance
    });

    it("should revert when event profile is not set", async () => {
      const { splitter, usdt } = await loadFixture(deploySplitterFixture);

      const amount = ethers.parseUnits("100", 6);
      await usdt.mint(amount);
      await usdt.approve(await splitter.getAddress(), amount);

      await expect(splitter.distributeRevenue(amount, 999))
        .to.be.revertedWithCustomError(splitter, "EventProfileNotSet")
        .withArgs(999);
    });
  });

  describe("setEventManager", () => {
    it("allows admin to set EventManager address", async () => {
      const { splitter, admin, profileManager } = await loadFixture(
        deploySplitterFixture,
      );

      const newEventManager = await profileManager.getAddress();
      await expect(splitter.connect(admin).setEventManager(newEventManager)).to
        .not.be.reverted;

      expect(await splitter.eventManager()).to.equal(newEventManager);
    });

    it("reverts when non-admin calls", async () => {
      const { splitter, profileManager, signer } = await loadFixture(
        deploySplitterFixture,
      );

      await expect(
        splitter
          .connect(signer)
          .setEventManager(await profileManager.getAddress()),
      ).to.be.revertedWithCustomError(
        splitter,
        "AccessControlUnauthorizedAccount",
      );
    });

    it("reverts for zero address", async () => {
      const { splitter, admin } = await loadFixture(deploySplitterFixture);

      await expect(
        splitter.connect(admin).setEventManager(ethers.ZeroAddress),
      ).to.be.revertedWith("EventManager cannot be zero address");
    });

    it("allows onlyAdminOrEventManager modifier to work correctly", async () => {
      const { splitter, admin, profileManager, signer } = await loadFixture(
        deploySplitterFixture,
      );

      // Set event manager
      const eventManagerAddress = await profileManager.getAddress();
      await splitter.connect(admin).setEventManager(eventManagerAddress);

      // Test that grantProfileManager can be called by admin
      await expect(
        splitter
          .connect(admin)
          .grantProfileManager(await signer.getAddress(), 500),
      ).to.not.be.reverted;

      // Test that grantProfileManager can be called by event manager
      await expect(
        splitter
          .connect(profileManager)
          .grantProfileManager(await signer.getAddress(), 600),
      ).to.not.be.reverted;

      // Test that non-admin/non-event-manager cannot call
      await expect(
        splitter
          .connect(signer)
          .grantProfileManager(await signer.getAddress(), 700),
      ).to.be.revertedWith("Caller must be admin or EventManager");
    });
  });
});
