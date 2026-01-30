import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RevenueSplitterModule = buildModule("DynamicRevenueSplitter", (m) => {
  const usdt = m.getParameter("usdt");
  const cyberiaDAO = m.getParameter("cyberiaDAO");
  const cvePtPma = m.getParameter("cvePtPma");
  const admin = m.getParameter("admin");

  const splitter = m.contract("DynamicRevenueSplitter", [
    usdt,
    cyberiaDAO,
    cvePtPma,
    admin,
  ]);

  return { splitter };
});

export default RevenueSplitterModule;
