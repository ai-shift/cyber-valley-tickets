const hre = require("hardhat");

async function main() {
  console.log("Testing balance checks on cyberia.my/ganache...\n");

  const provider = hre.ethers.provider;

  // Test 1: Check network connection
  console.log("1. Testing network connection:");
  try {
    const network = await provider.getNetwork();
    console.log(`   ✓ Connected to chain ID: ${network.chainId}`);

    const blockNumber = await provider.getBlockNumber();
    console.log(`   ✓ Current block number: ${blockNumber}`);
  } catch (error) {
    console.log(`   ✗ Network connection failed: ${error.message}`);
    return;
  }

  // Test 2: Check ERC20 contract
  console.log("\n2. Testing ERC20 contract:");
  const erc20Address = "0xf6292eE7F9d03BA5844666DD4981d8b38b8d598d";
  try {
    const ERC20 = await hre.ethers.getContractAt("SimpleERC20Xylose", erc20Address);

    const name = await ERC20.name();
    const symbol = await ERC20.symbol();
    const decimals = await ERC20.decimals();
    const totalSupply = await ERC20.totalSupply();

    console.log(`   ✓ Contract found at ${erc20Address}`);
    console.log(`   ✓ Name: ${name}`);
    console.log(`   ✓ Symbol: ${symbol}`);
    console.log(`   ✓ Decimals: ${decimals}`);
    console.log(`   ✓ Total Supply: ${hre.ethers.formatUnits(totalSupply, decimals)}`);
  } catch (error) {
    console.log(`   ✗ ERC20 contract check failed: ${error.message}`);
    return;
  }

  // Test 3: Check balance of random address
  console.log("\n3. Testing balance check for random address:");
  const testAddress = "0xb402FD4dA064Ce84c92B1AA57DaB01faB5aFE82C"; // From watson investigation
  try {
    const ERC20 = await hre.ethers.getContractAt("SimpleERC20Xylose", erc20Address);
    const balance = await ERC20.balanceOf(testAddress);
    const decimals = await ERC20.decimals();

    console.log(`   ✓ Address: ${testAddress}`);
    console.log(`   ✓ ERC20 Balance: ${hre.ethers.formatUnits(balance, decimals)}`);

    // Also check ETH balance
    const ethBalance = await provider.getBalance(testAddress);
    console.log(`   ✓ ETH Balance: ${hre.ethers.formatEther(ethBalance)}`);
  } catch (error) {
    console.log(`   ✗ Balance check failed: ${error.message}`);
    return;
  }

  // Test 4: Check EventManager contract
  console.log("\n4. Testing EventManager contract:");
  const eventManagerAddress = "0xadA1E7CCA885304914d1857637A67A9E611474AF";
  try {
    const EventManager = await hre.ethers.getContractAt("CyberValleyEventManager", eventManagerAddress);

    const eventRequestPrice = await EventManager.eventRequestPrice();
    const decimals = 6; // USDT decimals

    console.log(`   ✓ Contract found at ${eventManagerAddress}`);
    console.log(`   ✓ Event Request Price: ${hre.ethers.formatUnits(eventRequestPrice, decimals)}`);
  } catch (error) {
    console.log(`   ✗ EventManager contract check failed: ${error.message}`);
  }

  console.log("\n✓ All basic checks passed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
