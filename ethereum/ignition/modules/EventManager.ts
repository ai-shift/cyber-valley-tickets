import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MASTER_PERCENTAGE = 50;
const DEV_TEAM_PERCENTAGE = 10;
const EVENT_REQUEST_PRICE = 100;

const EventManagerModule = buildModule("EventManager", (m) => {
  const masterAddress = m.getParameter("masterAddress");
  const eventTicket = m.getParameter("eventTicket");
  const erc20 = m.getParameter("erc20");
  const devTeamAddress = m.getParameter("devTeamAddress");
  const initialOffset = Math.floor(Date.now() / 1000);

  const eventManager = m.contract("CyberValleyEventManager", [
    erc20,
    eventTicket,
    masterAddress,
    MASTER_PERCENTAGE,
    devTeamAddress,
    DEV_TEAM_PERCENTAGE,
    EVENT_REQUEST_PRICE,
    initialOffset
  ],);

  return { eventManager }

});

export default EventManagerModule;
