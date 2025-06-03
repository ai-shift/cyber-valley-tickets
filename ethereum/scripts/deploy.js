import EventManagerModule from "../ignition/modules/EventManager";
import EventTicketModule from "../ignition/modules/EventTicket";
import ERC20Module from "../ignition/modules/ERC20";

const MASTER_EOA = "0x2789023F36933E208675889869c7d3914A422921";
const DEV_TEAM_EOA = MASTER_EOA;

async function main() {
  const { erc20 } = await hre.ignition.deploy(ERC20Module, {});
  const { eventTicket } = await hre.ignition.deploy(EventTicketModule, {
    parameters: { EventTicket: { masterAddress: MASTER_EOA }}
  });
  const { eventManager } = await hre.ignition.deploy(EventManagerModule, {
    parameters: { EventManager: {
      masterAddress: MASTER_EOA,
      devTeamAddress: DEV_TEAM_EOA,
      eventTicket: await eventTicket.getAddress(),
      erc20: await erc20.getAddress()
    }}
  });
  await eventTicket.setEventManagerAddress(await eventManager.getAddress())
  console.log(`export PUBLIC_ERC20_ADDRESS=${await erc20.getAddress()}`)
  console.log(`export PUBLIC_EVENT_TICKET_ADDRESS=${await eventTicket.getAddress()}`)
  console.log(`export PUBLIC_EVENT_MANAGER_ADDRESS=${await eventManager.getAddress()}`)
}

main().catch(console.error)
