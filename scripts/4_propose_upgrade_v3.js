const hre = require("hardhat");
require('dotenv');

const {GNOSIS_SAFE, DEPLOYED_PROXY_ADDRESS} = process.env;

async function main() {
    const MakeWorldPeaceV3 = await hre.ethers.getContractFactory("MakeWorldPeaceV3");
    
    console.log("Preparing proposal...");
    const proposal = await defender.proposeUpgrade(DEPLOYED_PROXY_ADDRESS, MakeWorldPeaceV3,
        {title:"Upgrade UUPS contract",
         description:"Fix bug for access modifier of burn and burnFrom",
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
