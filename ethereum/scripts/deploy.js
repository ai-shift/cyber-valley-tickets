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

  // Set EventManager on splitter
  await splitter
    .connect(master)
    .setEventManager(await eventManager.getAddress());

  // Grant profile manager role with 5% bps to localProvider
  // This allows them to create distribution profiles and receive bps share
  await splitter
    .connect(master)
    .grantProfileManager(localProvider.address, 500);

  // Create initial distribution profile for localProvider
  // (using master as recipient since profile manager can't add themselves)
  await splitter
    .connect(localProvider)
    .createDistributionProfile([master.address], [10000]);

  // Grant LOCAL_PROVIDER_ROLE on EventManager and set bps
  await eventManager
    .connect(master)
    .grantLocalProvider(localProvider.address, 500);

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
