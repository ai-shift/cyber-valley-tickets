import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EVENT_REQUEST_PRICE = 100;

const EventManagerModule = buildModule("EventManager", (m) => {
  const masterAddress = m.getParameter("masterAddress");
  const eventTicket = m.getParameter("eventTicket");
  const erc20 = m.getParameter("erc20");
  const initialOffset = Math.floor(Date.now() / 1000);

  const eventManager = m.contract("CyberValleyEventManager", [
    erc20,
    eventTicket,
    masterAddress,
    EVENT_REQUEST_PRICE,
    initialOffset
  ],);

  return { eventManager }

});

export default EventManagerModule;
