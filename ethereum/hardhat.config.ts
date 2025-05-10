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
    ser7: {
      url: "https://ce9d-109-93-188-5.ngrok-free.app"
    },
    ec2: {
      url: "http://3.8.190.75:8545"
    },
  }
};

export default config;
