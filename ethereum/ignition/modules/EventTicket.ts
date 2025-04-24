import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MASTER_EOA = "0xB2e19dd996848818d972DD3a60A1B7FAfFB82330";

const EventTicketModule = buildModule("EventTicket", (m) => {

  const eventTicket = m.contract("CyberValleyEventTicket", [
    "CyberValleyEventTicket",
    "CVET",
    MASTER_EOA
  ]);
  return { eventTicket };
});

export default EventTicketModule;
