import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EventTicketModule = buildModule("EventTicket", (m) => {
  const IPFS_HOST = process.env.IPFS_PUBLIC_HOST;
  if (IPFS_HOST == null || IPFS_HOST === "") {
    throw new Error(`IPFS_PUBLIC_HOST env var is missing: ${IPFS_HOST}`);
  }
  const masterAddress = m.getParameter("masterAddress")
  const eventTicket = m.contract("CyberValleyEventTicket", [
    "CyberValleyEventTicket",
    "CVET",
    masterAddress,
    IPFS_HOST + "/ipfs"
  ]);
  return { eventTicket };
});

export default EventTicketModule;
