import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ERC20Module = buildModule("SimpleERC20Xylose", (m) => {
  const erc20 = m.contract("SimpleERC20Xylose");
  return { erc20 };
});

export default ERC20Module;
