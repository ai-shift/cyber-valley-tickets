import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const EventTicketModule = buildModule("EventTicket", (m) => {
  const masterAddress = m.getParameter("masterAddress")
  const eventTicket = m.contract("CyberValleyEventTicket", [
    "CyberValleyEventTicket",
    "CVET",
    masterAddress
  ]);
  return { eventTicket };
});

export default EventTicketModule;
