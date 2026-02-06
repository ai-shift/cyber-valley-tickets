import { expect } from "chai";
import { ethers } from "hardhat";

import {
  createEvent,
  deployContract,
  loadFixture,
} from "./cyber-valley-event-manager/helpers";

describe("ReferralRewards (ERC20) integration", () => {
  it("pays 3-level bonuses from ticket revenue and reduces event networth", async () => {
    const fx = await loadFixture(deployContract);

    const ReferralRewards = await ethers.getContractFactory("ReferralRewards");
    const referralRewards = await ReferralRewards.deploy(
      await fx.ERC20.getAddress(),
      await fx.master.getAddress(),
      await fx.eventManager.getAddress(),
      10_000, // decimals (bps-like)
      300, // referral bonus: 3% of purchase amount
      30 * 24 * 60 * 60, // active window: 30 days
      true, // only reward active uplines
      [6000, 3000, 1000], // pool split: 60/30/10 across 3 levels
      [
        { refereeCount: 1, rate: 5000 }, // >=1 direct referee => 50%
        { refereeCount: 5, rate: 7500 }, // >=5 => 75%
        { refereeCount: 25, rate: 10_000 }, // >=25 => 100%
      ],
    );

    await fx.eventManager
      .connect(fx.master)
      .setReferralRewards(await referralRewards.getAddress());

    const { eventId } = await createEvent(
      fx.eventManager,
      fx.ERC20,
      fx.verifiedShaman,
      fx.localProvider,
      fx.creator,
      {},
      {},
      {},
      fx.splitter,
    );

    const a = fx.owner; // upline L2
    const b = fx.staff; // upline L1
    const c = fx.signer; // referee/buyer

    const aAddr = await a.getAddress();
    const bAddr = await b.getAddress();
    const cAddr = await c.getAddress();

    const categoryId = 0n;
    const amount = 50n;
    const digest =
      "0x0000000000000000000000000000000000000000000000000000000000000000";

    async function buy(buyer: typeof a, ref: string): Promise<void> {
      const event = await fx.eventManager.events(eventId);
      // Default test ticket price is small; mint multiple tickets to get non-zero referral payouts.
      const ticketPrice = BigInt(event.ticketPrice);
      const totalPrice = ticketPrice * amount;
      await fx.ERC20.connect(buyer).mint(totalPrice);
      await fx.ERC20.connect(buyer).approve(
        await fx.eventManager.getAddress(),
        totalPrice,
      );

      await fx.eventManager
        .connect(buyer)
        .mintTickets(eventId, categoryId, amount, digest, 0, 0, ref);
    }

    // Make A active first (no referrer)
    await buy(a, "0x0000000000000000000000000000000000000000");

    // B binds to A and pays A (L1)
    await buy(b, aAddr);

    // C binds to B and pays B (L1) and A (L2)
    await buy(c, bAddr);

    // Expected payouts:
    // referralBase = 1000 * 3% = 30
    // rate >=1 direct referee => 50%
    // L1: 30 * 50% * 60% = 9
    // L2: 30 * 50% * 30% = 4 (floors from 4.5)
    expect(await fx.ERC20.balanceOf(aAddr)).to.equal(13n);
    expect(await fx.ERC20.balanceOf(bAddr)).to.equal(9n);
    expect(await fx.ERC20.balanceOf(cAddr)).to.equal(0n);

    // EventManager retains the remainder as event revenue (networth).
    // Total paid-in: 3 * 1000 = 3000; total referral paid: 9 + (9 + 4) = 22; remainder: 2978.
    const event = await fx.eventManager.events(eventId);
    expect(event.networth).to.equal(2978n);

    // Note: EventManager also holds the event submission fee paid during `createEvent`.
    // default eventRequestSubmitionPrice is 100.
    expect(
      await fx.ERC20.balanceOf(await fx.eventManager.getAddress()),
    ).to.equal(3078n);
  });
});
