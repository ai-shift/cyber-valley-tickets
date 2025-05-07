import EventManagerModule from "../ignition/modules/EventManager";
import EventTicketModule from "../ignition/modules/EventTicket";
import ERC20Module from "../ignition/modules/ERC20";

const MASTER_EOA = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
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
  console.log("SEX deployed to", await erc20.getAddress())
  console.log("Event ticket deployed to", await eventTicket.getAddress())
  console.log("Event manager deployed to", await eventManager.getAddress())

}

main().catch(console.error)
