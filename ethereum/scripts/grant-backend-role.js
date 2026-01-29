const EVENT_MANAGER_ADDRESS = process.env.PUBLIC_EVENT_MANAGER_ADDRESS;
const BACKEND_EOA = "0xEd7f6CA6e91AaA3Ff2C3918B5cAF02FF449Ab3A4";

async function main() {
  if (!EVENT_MANAGER_ADDRESS) {
    throw new Error("PUBLIC_EVENT_MANAGER_ADDRESS env var is required");
  }

  const [master] = await hre.ethers.getSigners();
  const eventManager = await hre.ethers.getContractAt(
    "CyberValleyEventManager",
    EVENT_MANAGER_ADDRESS,
  );

  const BACKEND_ROLE = await eventManager.BACKEND_ROLE();
  const hasRole = await eventManager.hasRole(BACKEND_ROLE, BACKEND_EOA);

  if (hasRole) {
    console.log(`Backend EOA ${BACKEND_EOA} already has BACKEND_ROLE`);
    return;
  }

  console.log(`Granting BACKEND_ROLE to ${BACKEND_EOA}...`);
  const tx = await eventManager
    .connect(master)
    .grantRole(BACKEND_ROLE, BACKEND_EOA);
  await tx.wait();
  console.log(`BACKEND_ROLE granted successfully. TX: ${tx.hash}`);
}

main().catch(console.error);
