const hre = require("hardhat");

async function main() {
  const erc20Address = "0xf6292eE7F9d03BA5844666DD4981d8b38b8d598d";
  const eventManagerAddress = "0xadA1E7CCA885304914d1857637A67A9E611474AF";

  const ERC20 = await hre.ethers.getContractAt(
    "MockUSDT",
    erc20Address,
  );
  const EventManager = await hre.ethers.getContractAt(
    "CyberValleyEventManager",
    eventManagerAddress,
  );

  const decimals = await ERC20.decimals();

  console.log("\n=== Token Configuration ===");
  console.log("ERC20 Decimals:", decimals.toString());
  console.log(
    "Note: event request fee is per-place deposit (eventDepositSize), not a global value.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
