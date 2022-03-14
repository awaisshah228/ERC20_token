const hre = require("hardhat");
require('dotenv');

const {GNOSIS_SAFE, DEPLOYED_PROXY_ADDRESS} = process.env;

async function main() {
    const MakeWorldPeaceV2 = await hre.ethers.getContractFactory("MakeWorldPeaceV2");
    
    console.log("Preparing proposal...");
    const proposal = await defender.proposeUpgrade(DEPLOYED_PROXY_ADDRESS, MakeWorldPeaceV2,
        {title:"Upgrade UUPS contract",
         description:"Proposal generated using open-zeppelin defender SDK in hardhat",
         multisig:GNOSIS_SAFE,
         multisigType: "Gnosis Safe",
        });  
    console.log("Upgrade proposal created at:", proposal.url);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
