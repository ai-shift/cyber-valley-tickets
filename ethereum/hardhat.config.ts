import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-tracer";
import "@nomicfoundation/hardhat-ethers";
import '@typechain/hardhat'
import '@nomicfoundation/hardhat-chai-matchers'

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      loggingEnabled: false
    }
  }
};

export default config;
