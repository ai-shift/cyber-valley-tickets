import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const ZERO = "0x0000000000000000000000000000000000000000";

describe("ReferralRewards (unit)", () => {
  let snapshotId: string;

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  async function deployReferralRewards(
    rateSteps?: Array<{ refereeCount: number; rate: number }>,
  ) {
    const [admin, operator, a, b, c, d] = await ethers.getSigners();
    const token = await ethers.deployContract("SimpleERC20Xylose");

    const ReferralRewards = await ethers.getContractFactory("ReferralRewards");
    const rr = await ReferralRewards.deploy(
      await token.getAddress(),
      await admin.getAddress(),
      await operator.getAddress(),
      10_000, // decimals (bps-like)
      300, // referral bonus: 3% of amount
      30 * 24 * 60 * 60, // seconds until inactive
      true, // only reward active uplines
      [6000, 3000, 1000], // 60/30/10 pool split
      rateSteps ?? [
        { refereeCount: 1, rate: 5000 },
        { refereeCount: 5, rate: 7500 },
        { refereeCount: 25, rate: 10_000 },
      ],
    );

    return { token, rr, admin, operator, a, b, c, d };
  }

  it("binds referrer once and increments directRefereeCount only once", async () => {
    const { rr, operator, a, b } = await deployReferralRewards();

    const aAddr = await a.getAddress();
    const bAddr = await b.getAddress();

    // First purchase binds b -> a.
    await rr.connect(operator).processPurchase(bAddr, aAddr, 1000);
    expect(await rr.referrerOf(bAddr)).to.equal(aAddr);
    expect(await rr.directRefereeCount(aAddr)).to.equal(1);

    // Second purchase with a different referrer hint should NOT change binding.
    await rr
      .connect(operator)
      .processPurchase(bAddr, await operator.getAddress(), 1000);
    expect(await rr.referrerOf(bAddr)).to.equal(aAddr);
    expect(await rr.directRefereeCount(aAddr)).to.equal(1);
  });

  it("does not bind self-referrals", async () => {
    const { rr, operator, a } = await deployReferralRewards();
    const aAddr = await a.getAddress();

    await rr.connect(operator).processPurchase(aAddr, aAddr, 1000);
    expect(await rr.referrerOf(aAddr)).to.equal(ZERO);
    expect(await rr.directRefereeCount(aAddr)).to.equal(0);
  });

  it("prevents short cycles within 3 levels", async () => {
    const { rr, operator, a, b, c } = await deployReferralRewards();

    const aAddr = await a.getAddress();
    const bAddr = await b.getAddress();
    const cAddr = await c.getAddress();

    // Bind a -> b, b -> c.
    await rr.connect(operator).processPurchase(aAddr, bAddr, 1000);
    await rr.connect(operator).processPurchase(bAddr, cAddr, 1000);

    // Attempt to bind c -> a would create cycle c->a->b->c (length 3), should be ignored.
    await rr.connect(operator).processPurchase(cAddr, aAddr, 1000);
    expect(await rr.referrerOf(cAddr)).to.equal(ZERO);
  });

  it("only rewards active uplines when onlyRewardActiveReferrers is enabled", async () => {
    const { rr, operator, a, b, c } = await deployReferralRewards([
      { refereeCount: 1, rate: 10_000 }, // 100% once >=1 direct referee
    ]);

    const aAddr = await a.getAddress();
    const bAddr = await b.getAddress();
    const cAddr = await c.getAddress();

    // A has not purchased yet -> inactive.
    await rr.connect(operator).processPurchase(bAddr, aAddr, 1000);

    // B is active (they purchased). A should still be inactive and thus not paid.
    const out1 = await rr
      .connect(operator)
      .processPurchase.staticCall(cAddr, bAddr, 1000);
    expect(out1.totalPaid).to.be.greaterThan(0);
    expect(out1.bonuses[1]).to.equal(0); // level-2 (A) should be 0 since inactive

    // Make A active by making them purchase.
    await rr.connect(operator).processPurchase(aAddr, ZERO, 1000);

    // Now C purchase should pay both B (L1) and A (L2).
    const out2 = await rr
      .connect(operator)
      .processPurchase.staticCall(cAddr, bAddr, 1000);
    expect(out2.bonuses[0]).to.be.greaterThan(0);
    expect(out2.bonuses[1]).to.be.greaterThan(0);
  });

  it("rateSteps gate rewards by directRefereeCount (referee count based)", async () => {
    // Require 2 direct referees to earn 100%.
    const { rr, operator, a, b, c } = await deployReferralRewards([
      { refereeCount: 2, rate: 10_000 },
    ]);

    const aAddr = await a.getAddress();
    const bAddr = await b.getAddress();
    const cAddr = await c.getAddress();

    // Make A active.
    await rr.connect(operator).processPurchase(aAddr, ZERO, 1000);

    // First direct referee: B binds to A, but A has only 1 direct referee (<2), so rate=0 => no bonus.
    const out1 = await rr
      .connect(operator)
      .processPurchase.staticCall(bAddr, aAddr, 1000);
    expect(out1.totalPaid).to.equal(0);

    await rr.connect(operator).processPurchase(bAddr, aAddr, 1000);
    expect(await rr.directRefereeCount(aAddr)).to.equal(1);

    // Second direct referee: C binds to A, now A has 2 referees => rate applies.
    await rr.connect(operator).processPurchase(cAddr, aAddr, 1000);
    expect(await rr.directRefereeCount(aAddr)).to.equal(2);

    const out2 = await rr
      .connect(operator)
      .processPurchase.staticCall(cAddr, aAddr, 1000);
    expect(out2.totalPaid).to.be.greaterThan(0);
  });

  it("stops rewarding after inactive window passes", async () => {
    const { rr, operator, a, b } = await deployReferralRewards([
      { refereeCount: 1, rate: 10_000 },
    ]);

    const aAddr = await a.getAddress();
    const bAddr = await b.getAddress();

    // Make A active and bind B -> A.
    await rr.connect(operator).processPurchase(aAddr, ZERO, 1000);
    await rr.connect(operator).processPurchase(bAddr, aAddr, 1000);

    // Advance time beyond the 30 day window; A becomes inactive.
    await time.increase(31 * 24 * 60 * 60);

    const out = await rr
      .connect(operator)
      .processPurchase.staticCall(bAddr, aAddr, 1000);
    // Still returns a recipient, but bonus should be 0 due to inactivity.
    expect(out.recipients[0]).to.equal(aAddr);
    expect(out.bonuses[0]).to.equal(0);
  });
});
