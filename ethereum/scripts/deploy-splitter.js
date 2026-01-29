const EVENT_MANAGER_ADDRESS = process.env.PUBLIC_EVENT_MANAGER_ADDRESS;
const USDT_ADDRESS = process.env.PUBLIC_ERC20_ADDRESS;
const CYBERIA_DAO = "0x2789023F36933E208675889869c7d3914A422921"; // Example
const CVE_PT_PMA = "0x2789023F36933E208675889869c7d3914A422921"; // Example

async function main() {
  if (!EVENT_MANAGER_ADDRESS || !USDT_ADDRESS) {
    throw new Error(
      "PUBLIC_EVENT_MANAGER_ADDRESS and PUBLIC_ERC20_ADDRESS env vars are required",
    );
  }

  const [admin] = await hre.ethers.getSigners();
  console.log("Deploying DynamicRevenueSplitter with admin:", admin.address);

  const SplitterFactory = await hre.ethers.getContractFactory(
    "DynamicRevenueSplitter",
  );
  const splitter = await SplitterFactory.deploy(
    USDT_ADDRESS,
    CYBERIA_DAO,
    CVE_PT_PMA,
    admin.address,
  );
  await splitter.waitForDeployment();
  const splitterAddress = await splitter.getAddress();
  console.log("DynamicRevenueSplitter deployed to:", splitterAddress);

  console.log("Linking Splitter to EventManager...");
  const eventManager = await hre.ethers.getContractAt(
    "CyberValleyEventManager",
    EVENT_MANAGER_ADDRESS,
  );
  const tx = await eventManager
    .connect(admin)
    .setRevenueSplitter(splitterAddress);
  await tx.wait();
  console.log("Linked successfully. TX:", tx.hash);
}

main().catch(console.error);
