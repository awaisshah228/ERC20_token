const hre = require("hardhat");
require('dotenv');

const {DEPLOYED_PROXY_ADDRESS} = process.env;


async function main() {
    const MakeWorldPeace = await hre.ethers.getContractFactory("MakeWorldPeace");
    const makeWorldPeace = MakeWorldPeace.attach(DEPLOYED_PROXY_ADDRESS);
    
    console.log("Current owner:", await makeWorldPeace.owner());
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });