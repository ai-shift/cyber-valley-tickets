import { vars, HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-tracer";
import "@nomicfoundation/hardhat-ethers";
import '@typechain/hardhat'
import '@nomicfoundation/hardhat-chai-matchers'

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      loggingEnabled: false,
      initialDate: process.env.HARDHAT_INITIAL_DATE || undefined,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      timeout: 60000,
    },
    cvlandTest: {
      url: "https://cvland-tickets.aishift.co/ganache"
    },
    cvlandDev: {
      url: `http://127.0.0.1:${process.env.GANACHE_PORT || 8545}`
    },
  }
};

export default config;
