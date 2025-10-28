import ERC20Module from "../ignition/modules/ERC20";
import EventManagerModule from "../ignition/modules/EventManager";
import EventTicketModule from "../ignition/modules/EventTicket";

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

  const [master, localProvider] = await hre.ethers.getSigners();
  await eventManager.connect(master).setMasterShare(50);
  await eventManager
    .connect(master)
    .grantLocalProvider(localProvider.address, 100);

  // Grant BACKEND_ROLE to backend EOA
  const BACKEND_ROLE = await eventManager.BACKEND_ROLE();
  await eventManager
    .connect(master)
    .grantRole(BACKEND_ROLE, BACKEND_EOA);

  console.log(`export PUBLIC_ERC20_ADDRESS=${await erc20.getAddress()}`);
  console.log(
    `export PUBLIC_EVENT_TICKET_ADDRESS=${await eventTicket.getAddress()}`,
  );
  console.log(
    `export PUBLIC_EVENT_MANAGER_ADDRESS=${await eventManager.getAddress()}`,
  );
}

main().catch(console.error);
