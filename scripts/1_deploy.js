const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  
  // We get the contract to deploy
  const MakeWorldPeace = await hre.ethers.getContractFactory("MakeWorldPeace");
  console.log("Deploying MakeWorldPeace...");

  const makeWorldPeace = await upgrades.deployProxy(MakeWorldPeace, {initializer: 'initialize', kind:'uups'});  ;
  console.log(" MakeWorldPeace deployed to:", makeWorldPeace.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
