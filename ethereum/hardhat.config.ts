import { vars, HardhatUserConfig } from "hardhat/config";
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
    },
    cvlandTest: {
      url: "https://cvland-tickets.aishift.co/ganache"
    },
    cvlandDev: {
      url: "http://127.0.0.1:8545"
    },
  }
};

export default config;
