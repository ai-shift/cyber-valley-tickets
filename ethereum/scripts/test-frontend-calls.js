const hre = require("hardhat");

async function main() {
  console.log("Simulating frontend balance checks...\n");

  const erc20Address = "0xf6292eE7F9d03BA5844666DD4981d8b38b8d598d";
  const testAddresses = [
    "0xb402FD4dA064Ce84c92B1AA57DaB01faB5aFE82C", // User from watson investigation (0 balance)
    "0x2789023F36933E208675889869c7d3914A422921", // Ganache account 0 (should have tokens)
    "0xEd7f6CA6e91AaA3Ff2C3918B5cAF02FF449Ab3A4", // Backend account (might have tokens)
  ];

  const ERC20 = await hre.ethers.getContractAt("SimpleERC20Xylose", erc20Address);
  const decimals = await ERC20.decimals();

  console.log("ERC20 Contract:", erc20Address);
  console.log("Decimals:", decimals.toString());
  console.log("");

  for (const address of testAddresses) {
    console.log(`Address: ${address}`);

    try {
      // Simulate what thirdweb/frontend does
      const balance = await ERC20.balanceOf(address);
      console.log(`  ✓ ERC20 Balance: ${hre.ethers.formatUnits(balance, decimals)} (${balance.toString()} wei)`);

      const ethBalance = await hre.ethers.provider.getBalance(address);
      console.log(`  ✓ ETH Balance: ${hre.ethers.formatEther(ethBalance)}`);

      // Check if can create event
      const eventPrice = 100n;
      const canCreate = balance >= eventPrice;
      console.log(`  ${canCreate ? '✓' : '✗'} Can create event: ${canCreate} (needs ${eventPrice}, has ${balance})`);
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
    }
    console.log("");
  }

  // Test eth_call directly (what browsers do)
  console.log("=== Testing raw JSON-RPC call (like browser) ===");
  const balanceOfSelector = "0x70a08231"; // balanceOf(address)
  const paddedAddress = "0x000000000000000000000000b402FD4dA064Ce84c92B1AA57DaB01faB5aFE82C";
  const callData = balanceOfSelector + paddedAddress.slice(2);

  try {
    const result = await hre.ethers.provider.call({
      to: erc20Address,
      data: callData
    });
    console.log(`✓ Raw eth_call result: ${result}`);
    console.log(`  Decoded: ${BigInt(result).toString()}`);
  } catch (error) {
    console.log(`✗ Raw eth_call failed: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
