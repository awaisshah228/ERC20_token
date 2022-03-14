# Upgradeable ERC20 token (MakeWorldPeace - MWP)
## Introduction
This project contains [UUPS](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable) upgradeable smart contract of ERC20 tokens derived from [OpenZeppelin](https://openzeppelin.com/contracts/) library with best practices. Besides than that, it comes with test and deploy scripts for that contract.

The ERC20 contract consists of the following functions:
- Basic ERC20 token function including minting derived from **[ERC20Upgradeable contract](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/token/ERC20/ERC20Upgradeable.sol)** 
- Maximum mint amounts of 10,000 within 3 minutes of block time 
- Burnable ERC20 token function such as burn token derived from **[ERC20BurnableUpgradeable contract](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/token/ERC20/extensions/ERC20BurnableUpgradeable.sol)** 
- Pausable/Freezable ERC20 token function such as freeze or unfreeze token derived from **[ERC20PausableUpgradeable contract](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/token/ERC20/extensions/ERC20PausableUpgradeable.sol)** 
- Upgradable feature that utilize **[Initializable contract](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/tree/master/contracts/proxy/utils/Initializable.sol)** and **[UUPSUpgradeable contract](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/tree/master/contracts/proxy/utils/UUPSUpgradeable.sol)**
- Owned by **[Gnosis Safe which is multi-signature](https://gnosis-safe.io/app/welcome)** with more security measures due to the upgradeability of smart contract. 

## Live Deployed Contract
All contracts shown below are deployed at Rinkeby testnet and can be traced in Etherscan as followed: 
1. [UUPS Proxy Contract](https://rinkeby.etherscan.io/address/0xBcfD50536Fb3c6D1FA715F99961d4d4307cC8BF7)
2. [Implementation Contract V3](https://rinkeby.etherscan.io/address/0x514bfecff67ceedf037b4b5eda9430171d96bdc7)
3. [Implementation Contract V2](https://rinkeby.etherscan.io/address/0x09946fc53d74255550e854f3c6675dc0178d8a1d)
4. [Implementation Contract V1](https://rinkeby.etherscan.io/address/0xd562314fb88abfc67560f48afe685a107802b8c9)
5. [Gnosis Safe Contract](https://rinkeby.etherscan.io/address/0x4a776419e25784082732a771245dc2cc0df00f81)
***
## Get started
The whole project directory can be break down into few major parts such as:
 |folder        | Description                                                                              
 |:------------:|:------------------------------------------------------------------------------------------
 | [`contracts`](contracts/)  |Folder that contains all contracts [revision(s)](#revision-update) that inherited from OpenZeppelin's templates
 | [`scripts`](scripts/)    |Script files written in JavaScript that normally used for verify and deploy to blockchain based on [configuration file settings](#configuration-file)
 | [`test`](test/)       |Test files written in JavaScript to test contracts locally before deployed to blockchain based on [test setup](#test-setup)  

### Pre-requisite
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [Hardhat](https://hardhat.org/getting-started/) and OpenZeppelin where their dependencies can be installed using `npm install`
- Create a [Gnosis Safe](https://help.gnosis-safe.io/en/articles/3876461-create-a-safe) with 1 or more [Externally Owned Account(s)](https://ethereum.org/en/developers/docs/accounts/) 
- Sign up [OpenZeppelin Defender](https://openzeppelin.com/defender/) and create API token for upgrading UUPS contract after passing ownership to Gnosis Safe with multi-sig 
- Sign up [Alchemy](https://www.alchemy.com/) and create API key for Rinkeby testnet 
- Sign up [Etherscan](https://etherscan.io/register) and create API key to [verify contract](#verify-contract) after deployed.
- Create at least 1 [Metamask wallet](https://metamask.io/faqs/) and change to Rinkeby testnet

### Configuration file
[hardhat.config.js](hardhat.config.js) is the configuration file used by `hardhat` command to execute scripts stored in [scripts](scripts/) folder. Notice that `dotenv` library is used to store secret keys or API keys in configuration file and the complete sample can be retrieved at [.env file configuration](#env-file-sample).

### Test setup
After installing all dependencies using `npm install`, all tests should be able to execute using `npx hardhat test` command that will:
- Compile contracts 
- Generate artifacts 
- Run all test scripts in [test](test/) folder. 

However, test can be run partially by passing in test script file path as argument to `npx hardhat test` in such a manner:
1. `npx hardhat test test/MakeWorldPeace.js` that will only execute tests in [MakeWorldPeace.js](test/MakeWorldPeace.js)
2. `npx hardhat test test/MakeWorldPeaceV2.js` that will only execute tests in [MakeWorldPeaceV2.js](test/MakeWorldPeaceV2.js) 
3. `npx hardhat test test/MakeWorldPeaceV3.js` that will only execute tests in [MakeWorldPeaceV3.js](test/MakeWorldPeaceV3.js)

### .env file sample

Create `.env` file in current path and refer to sample template below that should be inserted with corresponding API token and secret keys based on instructions above.  
```
ALCHEMY_API_KEY=INSERT_YOUR_ALCHEMY_API_KEY_HERE
RINKEBY_PRIVATE_KEY="INSERT_YOUR_METAMASK_WALLET_RINKEBY_PRIVATE_KEY_HERE"
DEPLOYED_PROXY_ADDRESS="INSERT_PROXY_ADDRESS_THAT_SHOW_AFTER_FIRST_STEP_OF_DEPLOYMENT" 
GNOSIS_SAFE="INSERT_GNOSIS_SAFE_CONTRACT_ADDRESS_HERE"
DEFENDER_TEAM_API_KEY="INSERT_OPEN_ZEPPELIN_DEFENDER_TEAM_API_KEY_HERE"
DEFENDER_TEAM_API_SECRET_KEY="INSERT_OPEN_ZEPPELIN_DEFENDER_TEAM_SECRET_KEY_HERE"
ETHERSCAN_API_KEY="INSERT_ETHERSCAB_API_HERE"
```

### Deploy UUPS contract

In order to start deploy upgradeable ERC contract, script file is executed ascendingly as shown below. Make sure `.env` file is filled in accordingly except `DEPLOYED_PROXY_ADDRESS` as we will get the information after our first script.

1. Run `npx hardhat run scripts/1_deploy.js --network rinkeby` command in console and copy the deployed proxy address shown in output of the script into `DEPLOYED_PROXY_ADDRESS`. Check and make sure contract is already been created by searching deployed proxy address in Etherscan.
2. Run `npx hardhat run scripts/2_transfer_ownership.js --network rinkeby` command and ownership of the proxy address will be transferred from metamask wallet to Gnosis safe contract shown in output of the script.
3. Optionally, run `npx hardhat run scripts/verify_ownership.js --network rinkeby` and make sure output is same as `GNOSIS_SAFE` in .env file.
4. Since we had transferred ownership to Gnosis Safe multi-sig contract, there is no straightforward way to update the contract using hardhat command. we could however generate upgrade proposal that can be further processed in OpenZeppelin Defender.
5. Log in into OpenZeppelin Defender and add proxy address contract into it. Fill in name (for reference), network (Rinkeby), address(`DEPLOYED_PROXY_ADDRESS`). Notice that there is a space of [ABI](https://www.quicknode.com/guides/solidity/what-is-an-abi) to be filled in. 
6. In order to fill in the ABI accordingly, first the underlying implementation contract of proxy contract have to be [verified](#verify-contract) and ABI is then retrieved from implementation contract in Etherscan. First, go to EtherScan then enter the verified implementation contract address. Next, click on the `Contract` in the tab section heading and scroll down to find the `Contract ABI` then copy it.
7. Paste into the ABI field in Step 5 and press `Add` to add proxy contract into OpenZeppelin Defender.
8. Run `npx hardhat run scripts/3_propose_upgrade.js --network rinkeby` command and click on the link shown in output of the script.
9. Approve proposal in OpenZeppelin Defender and proxy contract will be updated with new implementation contract. Keep note that each newly generated implementation contract have to be [verified](#verify-contract) in order to obtain ABI and be updated in OpenZeppelin Defender proxy contract for contract interaction.
10.Similar steps are taken to update contract to V3 by running `npx hardhat run scripts/4_propose_upgrade_v3.js --network rinkeby` command and click on the link shown in output of the script. Then,repeat step 9. 


### Verify contract
Run `npx hardhat run scripts/get_implementation_contract.js --network rinkeby` to obtain the current implementation address of deployed proxy contract. 

Next, run `npx hardhat verify <impl_address> --network rinkeby` where `<impl_address>` is the implementation address shown by the command above. Click on the link at the output of the command to verify contract is verified in Etherscan. 

***
## Revision update
Below elaborated the update and different of each smart contract revision with further optimisation and new features.

### MakeWorldPeace ERC20 Token V3
Insert description here

### MakeWorldPeace ERC20 Token V2
Insert description here

### MakeWorldPeace ERC20 Token V1
Insert description here
