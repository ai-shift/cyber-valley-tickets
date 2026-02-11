import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// NOTE: Module + contract name are intentionally "MockUSDT" to force a redeploy
// in Ignition when token metadata/decimals change.
const ERC20Module = buildModule("MockUSDT", (m) => {
  const erc20 = m.contract("MockUSDT");
  return { erc20 };
});

export default ERC20Module;
