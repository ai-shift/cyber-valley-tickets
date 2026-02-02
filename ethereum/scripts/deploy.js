import ERC20Module from "../ignition/modules/ERC20";
import EventManagerModule from "../ignition/modules/EventManager";
import EventTicketModule from "../ignition/modules/EventTicket";
import RevenueSplitterModule from "../ignition/modules/RevenueSplitter";

const MASTER_EOA = "0x2789023F36933E208675889869c7d3914A422921";
const BACKEND_EOA = "0xEd7f6CA6e91AaA3Ff2C3918B5cAF02FF449Ab3A4";
const DEV_TEAM_EOA = MASTER_EOA;

async function main() {
  const { erc20 } = await hre.ignition.deploy(ERC20Module, {});
  const { eventTicket } = await hre.ignition.deploy(EventTicketModule, {
    parameters: { EventTicket: { masterAddress: MASTER_EOA } },
  });
  const { eventManager } = await hre.ignition.deploy(EventManagerModule, {
    parameters: {
      EventManager: {
        masterAddress: MASTER_EOA,
        eventTicket: await eventTicket.getAddress(),
        erc20: await erc20.getAddress(),
      },
    },
  });
  await eventTicket.setEventManagerAddress(await eventManager.getAddress());

  const { splitter } = await hre.ignition.deploy(RevenueSplitterModule, {
    parameters: {
      DynamicRevenueSplitter: {
        usdt: await erc20.getAddress(),
        cyberiaDAO: MASTER_EOA, // Placeholder
        cvePtPma: DEV_TEAM_EOA, // Placeholder
        admin: MASTER_EOA,
      },
    },
  });

  const [master, localProvider] = await hre.ethers.getSigners();
  await eventManager
    .connect(master)
    .setRevenueSplitter(await splitter.getAddress());

  // Set EventManager on splitter and grant LOCAL_PROVIDER_ROLE
  await splitter
    .connect(master)
    .setEventManager(await eventManager.getAddress());
  const LOCAL_PROVIDER_ROLE = await splitter.LOCAL_PROVIDER_ROLE();
  await splitter
    .connect(master)
    .grantRole(LOCAL_PROVIDER_ROLE, localProvider.address);

  // Setup default profile
  await splitter
    .connect(master)
    .createDistributionProfile(
      localProvider.address,
      [localProvider.address],
      [10000],
    );
  await splitter.connect(master).setDefaultProfile(1);

  await eventManager.connect(master).grantLocalProvider(localProvider.address);

  // Grant BACKEND_ROLE to backend EOA
  const BACKEND_ROLE = await eventManager.BACKEND_ROLE();
  await eventManager.connect(master).grantRole(BACKEND_ROLE, BACKEND_EOA);

  console.log(`export PUBLIC_ERC20_ADDRESS=${await erc20.getAddress()}`);
  console.log(
    `export PUBLIC_EVENT_TICKET_ADDRESS=${await eventTicket.getAddress()}`,
  );
  console.log(
    `export PUBLIC_EVENT_MANAGER_ADDRESS=${await eventManager.getAddress()}`,
  );
  console.log(
    `export PUBLIC_REVENUE_SPLITTER_ADDRESS=${await splitter.getAddress()}`,
  );
}

main().catch(console.error);
