const EVENT_MANAGER_ADDRESS = process.env.PUBLIC_EVENT_MANAGER_ADDRESS;
const LOCAL_PROVIDER_EOA = "0x9772d9a6A104c162b97767e6a654Be54370A042F";
const SHARE = 50; // Default share percentage

async function main() {
  if (!EVENT_MANAGER_ADDRESS) {
    throw new Error("PUBLIC_EVENT_MANAGER_ADDRESS env var is required");
  }

  const [master] = await hre.ethers.getSigners();
  const eventManager = await hre.ethers.getContractAt(
    "CyberValleyEventManager",
    EVENT_MANAGER_ADDRESS,
  );

  const LOCAL_PROVIDER_ROLE = await eventManager.LOCAL_PROVIDER_ROLE();
  const hasRole = await eventManager.hasRole(
    LOCAL_PROVIDER_ROLE,
    LOCAL_PROVIDER_EOA,
  );

  if (hasRole) {
    console.log(`EOA ${LOCAL_PROVIDER_EOA} already has LOCAL_PROVIDER_ROLE`);
    return;
  }

  console.log(`Granting LOCAL_PROVIDER_ROLE to ${LOCAL_PROVIDER_EOA}...`);
  const tx = await eventManager
    .connect(master)
    .grantLocalProvider(LOCAL_PROVIDER_EOA);
  await tx.wait();
  console.log(`LOCAL_PROVIDER_ROLE granted successfully. TX: ${tx.hash}`);
}

main().catch(console.error);
