require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");
require("@openzeppelin/hardhat-defender");
require('dotenv').config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const { RINKEBY_PRIVATE_KEY, ALCHEMY_API_KEY, ETHERSCAN_API_KEY,DEFENDER_TEAM_API_SECRET_KEY, DEFENDER_TEAM_API_KEY} = process.env;
module.exports = {
  solidity: "0.8.4",
  defender: {
    apiKey: DEFENDER_TEAM_API_KEY,
    apiSecret: DEFENDER_TEAM_API_SECRET_KEY,
  },
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${RINKEBY_PRIVATE_KEY}`]
    }
  },
  etherscan: {
    // API key for Etherscan
    apiKey: ETHERSCAN_API_KEY
  }
};
