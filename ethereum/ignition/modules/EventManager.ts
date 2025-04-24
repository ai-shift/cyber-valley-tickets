import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const USDT_CONTRACT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const MASTER_EOA = "0xB2e19dd996848818d972DD3a60A1B7FAfFB82330";
const MASTER_PERCENTAGE = 50;
const DEV_TEAM_EOA = "0x926d61e2A3Ccb52E9BA31E7D1581416F1632c975";
const DEV_TEAM_PERCENTAGE = 10;
const EVENT_REQUEST_PRICE = 100;
const INITIAL_OFFSET = 1745522461;

const EventManagerModule = buildModule("EventManager", (m) => {
  const eventTicket = m.contractAt("CyberValleyEventTicket", "0xC03F34F0f65E7c25F6973d8345b6Fc15Cfa547Da");

  const eventManager = m.contract("CyberValleyEventManager", [
    USDT_CONTRACT,
    eventTicket,
    MASTER_EOA,
    MASTER_PERCENTAGE,
    DEV_TEAM_EOA,
    DEV_TEAM_PERCENTAGE,
    EVENT_REQUEST_PRICE,
    INITIAL_OFFSET
  ],);

  return { eventManager }

});

export default EventManagerModule;
