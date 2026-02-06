import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Defaults are intentionally conservative and adjustable via on-chain admin later.
// decimals is bps-like (10000).
const DECIMALS = 10_000;

// Total referral bonus (applied to purchase amount).
// Example: 300 = 3% of amount is reserved as the referral pool.
const REFERRAL_BONUS = 300;

// Active window: 30 days.
const SECONDS_UNTIL_INACTIVE = 30 * 24 * 60 * 60;

// Only active uplines earn.
const ONLY_REWARD_ACTIVE = true;

// Split of the referral pool across 3 levels, must sum <= DECIMALS.
// Example: 60% / 30% / 10% of the referral pool.
const LEVEL_RATES: [number, number, number] = [6000, 3000, 1000];

// Referee-count rate steps: the upline's direct referees count selects a multiplier.
// Rate is [0..DECIMALS].
// Example: <1 referee => 0%; >=1 => 50%; >=5 => 75%; >=25 => 100%.
const RATE_STEPS = [
  { refereeCount: 1, rate: 5000 },
  { refereeCount: 5, rate: 7500 },
  { refereeCount: 25, rate: 10_000 },
];

const ReferralRewardsModule = buildModule("ReferralRewards", (m) => {
  const rewardToken = m.getParameter("rewardToken");
  const admin = m.getParameter("admin");
  const operator = m.getParameter("operator");

  const referralRewards = m.contract("ReferralRewards", [
    rewardToken,
    admin,
    operator,
    DECIMALS,
    REFERRAL_BONUS,
    SECONDS_UNTIL_INACTIVE,
    ONLY_REWARD_ACTIVE,
    LEVEL_RATES,
    RATE_STEPS,
  ]);

  return { referralRewards };
});

export default ReferralRewardsModule;

