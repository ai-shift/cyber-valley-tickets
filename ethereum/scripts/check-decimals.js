const hre = require("hardhat");

async function main() {
  const erc20Address = "0xf6292eE7F9d03BA5844666DD4981d8b38b8d598d";
  const eventManagerAddress = "0xadA1E7CCA885304914d1857637A67A9E611474AF";

  const ERC20 = await hre.ethers.getContractAt(
    "SimpleERC20Xylose",
    erc20Address,
  );
  const EventManager = await hre.ethers.getContractAt(
    "CyberValleyEventManager",
    eventManagerAddress,
  );

  const decimals = await ERC20.decimals();
  const eventRequestPrice = await EventManager.eventRequestPrice();

  console.log("\n=== Token Configuration ===");
  console.log("ERC20 Decimals:", decimals.toString());
  console.log("Event Request Price (raw):", eventRequestPrice.toString());
  console.log(
    "Event Request Price (formatted):",
    hre.ethers.formatUnits(eventRequestPrice, decimals),
  );

  console.log("\n=== What frontend sends ===");
  console.log("Frontend getEventSubmitionPrice():", "100");
  console.log(
    "Frontend formatted (assuming 18 decimals):",
    hre.ethers.formatUnits("100", decimals),
  );

  console.log("\n=== Issue ===");
  if (eventRequestPrice.toString() !== "100") {
    console.log(
      "❌ MISMATCH! Frontend sends 100 but contract expects",
      eventRequestPrice.toString(),
    );
    console.log("   Frontend needs to send:", eventRequestPrice.toString());
  } else {
    console.log("✓ Values match");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
