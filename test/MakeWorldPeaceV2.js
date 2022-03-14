const { expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MakeWorldPeacev2 token", function () {

    let makeWorldPeace, makeWorldPeaceV2;
    let owner;
    let proxyAddr, implAddr1, implAddr2;

    beforeEach(async function () {
        const MakeWorldPeace = await hre.ethers.getContractFactory("MakeWorldPeace");
        const MakeWorldPeaceV2 = await hre.ethers.getContractFactory("MakeWorldPeaceV2");

        makeWorldPeace = await upgrades.deployProxy(MakeWorldPeace, { initializer: 'initialize', kind: 'uups' });
        await makeWorldPeace.deployed();
        proxyAddr = makeWorldPeace.address;

        implAddr1 = await upgrades.erc1967.getImplementationAddress(proxyAddr); // Implementation Address before update
        makeWorldPeaceV2 = await upgrades.upgradeProxy(proxyAddr, MakeWorldPeaceV2); // Upgrade contract with proxy address
        await makeWorldPeaceV2.deployed();
        implAddr2 = await upgrades.erc1967.getImplementationAddress(proxyAddr); // Implementation Address before update   

        await makeWorldPeaceV2.upgradeToV2();
        [owner] = await ethers.getSigners();
    })

    it("Should successfully upgrade with different implementation contract address in proxy address", async function () {
        expect(implAddr1).to.not.equal(implAddr2);
    });

    it("Should not able to call upgrade function twice with validation checking", async function () {
        expectRevert(await makeWorldPeaceV2.upgradeToV2);
    });

    it("Should have owner with roles of minter, burner and pauser", async function () {
        const mintAmount = ethers.utils.parseEther("10000");
        await makeWorldPeaceV2.mint(owner.address,mintAmount);
        expect(await makeWorldPeaceV2.hasRole(makeWorldPeaceV2.MINTER_ROLE(), owner.address)).to.equal(true);
        expect(await makeWorldPeaceV2.hasRole(makeWorldPeaceV2.PAUSER_ROLE(), owner.address)).to.equal(true);
        expect(await makeWorldPeaceV2.hasRole(makeWorldPeaceV2.BURNER_ROLE(), owner.address)).to.equal(true);
    });
});

describe("MakeWorldPeacev2 token mint functionality", function () {

    let makeWorldPeace, makeWorldPeaceV2;
    let owner, dummyAddr1,dummyAddr2;
    let proxyAddr;
    const mintAmount = ethers.utils.parseEther("10000");

    beforeEach(async function () {
        const MakeWorldPeace = await hre.ethers.getContractFactory("MakeWorldPeace");
        const MakeWorldPeaceV2 = await hre.ethers.getContractFactory("MakeWorldPeaceV2");

        makeWorldPeace = await upgrades.deployProxy(MakeWorldPeace, { initializer: 'initialize', kind: 'uups' });
        await makeWorldPeace.deployed();
        proxyAddr = makeWorldPeace.address;

        makeWorldPeaceV2 = await upgrades.upgradeProxy(proxyAddr, MakeWorldPeaceV2); // Upgrade contract with proxy address
        await makeWorldPeaceV2.deployed(); 
        await makeWorldPeaceV2.upgradeToV2();

        [owner, dummyAddr1,dummyAddr2] = await ethers.getSigners();
    })

    it("Should let owner grant minter role to user and mint token", async function () {
        
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.MINTER_ROLE(),dummyAddr1.address);

        const initialAmount_user = await makeWorldPeaceV2.balanceOf(dummyAddr1.address);
        const initialAmount = await makeWorldPeaceV2.balanceOf(owner.address);

        await makeWorldPeaceV2.connect(dummyAddr1).mint(dummyAddr1.address,mintAmount);
        await makeWorldPeaceV2.connect(dummyAddr1).mint(owner.address,mintAmount);

        expect(await makeWorldPeaceV2.balanceOf(dummyAddr1.address)).to.equal(initialAmount_user.add(mintAmount));
        expect(await makeWorldPeaceV2.balanceOf(owner.address)).to.equal(initialAmount.add(mintAmount));
    });

    it("Should not let user without minter role to mint token", async function () {
        expectRevert(makeWorldPeaceV2.connect(dummyAddr2).mint(dummyAddr2.address,mintAmount));
    });

    it("Should let owner to revoke minter role of assigned user so user could not mint token", async function () {
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.MINTER_ROLE(),dummyAddr1.address);
        expect(await makeWorldPeaceV2.connect(dummyAddr1).mint(dummyAddr1.address,mintAmount));
        expect(await makeWorldPeaceV2.connect(dummyAddr1).mint(owner.address,mintAmount));

        //Revoke role from admin
        await makeWorldPeaceV2.revokeRole(makeWorldPeaceV2.MINTER_ROLE(),dummyAddr1.address);   
        expectRevert(makeWorldPeaceV2.connect(dummyAddr1).mint(dummyAddr1.address,mintAmount));
    });

    it("Should not let assigned user to revoke their own minter role as user is not admin role for minter role", async function () {
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.MINTER_ROLE(),dummyAddr1.address);
        expect(await makeWorldPeaceV2.connect(dummyAddr1).mint(dummyAddr1.address,mintAmount));
        expect(await makeWorldPeaceV2.connect(dummyAddr1).mint(owner.address,mintAmount));
        
        //Try to revoke role other than admin
        expectRevert(makeWorldPeaceV2.connect(dummyAddr1).revokeRole(makeWorldPeaceV2.MINTER_ROLE(),dummyAddr1.address)); 
        expect(makeWorldPeaceV2.connect(dummyAddr1).mint(dummyAddr1.address,mintAmount));
    });

    it("Should let assigned user with minter role to renounce their own minter role so user could not mint token", async function () {
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.MINTER_ROLE(),dummyAddr1.address);
        expect(await makeWorldPeaceV2.connect(dummyAddr1).mint(dummyAddr1.address,mintAmount));
        expect(await makeWorldPeaceV2.connect(dummyAddr1).mint(owner.address,mintAmount));

        //Renounce role from user itself
        await makeWorldPeaceV2.connect(dummyAddr1).renounceRole(makeWorldPeaceV2.MINTER_ROLE(),dummyAddr1.address); 
        expectRevert(makeWorldPeaceV2.connect(dummyAddr1).mint(dummyAddr1.address,mintAmount));
    });

    it("Should not let owner to renounce minter role from assigned user as renounce is reserved to be used on caller himself", async function () {
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.MINTER_ROLE(),dummyAddr1.address);
        expect(await makeWorldPeaceV2.connect(dummyAddr1).mint(dummyAddr1.address,mintAmount));
        expect(await makeWorldPeaceV2.connect(dummyAddr1).mint(owner.address,mintAmount));
      
         // Try to renounce role from admin/owner account
        expectRevert(makeWorldPeaceV2.renounceRole(makeWorldPeaceV2.MINTER_ROLE(),dummyAddr1.address));
        expect(makeWorldPeaceV2.connect(dummyAddr1).mint(dummyAddr1.address,mintAmount));
    });
});

describe("MakeWorldPeacev2 token burn functionality", function () {

    let makeWorldPeace, makeWorldPeaceV2;
    let dummyAddr1,dummyAddr2;
    let proxyAddr;
    const mintAmount = ethers.utils.parseEther("10000");
    const burnAmount = ethers.utils.parseEther("500");

    beforeEach(async function () {
        const MakeWorldPeace = await hre.ethers.getContractFactory("MakeWorldPeace");
        const MakeWorldPeaceV2 = await hre.ethers.getContractFactory("MakeWorldPeaceV2");

        makeWorldPeace = await upgrades.deployProxy(MakeWorldPeace, { initializer: 'initialize', kind: 'uups' });
        await makeWorldPeace.deployed();
        proxyAddr = makeWorldPeace.address;

        makeWorldPeaceV2 = await upgrades.upgradeProxy(proxyAddr, MakeWorldPeaceV2); // Upgrade contract with proxy address
        await makeWorldPeaceV2.deployed(); 
        await makeWorldPeaceV2.upgradeToV2();

        [owner, dummyAddr1,dummyAddr2] = await ethers.getSigners();
    })

    it("Should let owner grant burner role to user and burn token", async function () {

        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.BURNER_ROLE(),dummyAddr1.address);

        await makeWorldPeaceV2.mint(dummyAddr1.address,mintAmount);
        const initialAmount_user = await makeWorldPeaceV2.balanceOf(dummyAddr1.address);
        await makeWorldPeaceV2.connect(dummyAddr1).burn_supply(burnAmount);

        expect(await makeWorldPeaceV2.balanceOf(dummyAddr1.address)).to.equal(initialAmount_user.sub(burnAmount));
    });

    it("Should not let user without burner role to burn token", async function () {

        await makeWorldPeaceV2.mint(dummyAddr2.address,mintAmount);
        expect(await makeWorldPeaceV2.balanceOf(dummyAddr2.address)).to.equal(mintAmount);
        expectRevert(makeWorldPeaceV2.connect(dummyAddr2).burn_supply(burnAmount));
    });

    it("Should let owner to revoke burner role of assigned user so user could not burn token", async function () {
    
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.BURNER_ROLE(),dummyAddr1.address);
        await makeWorldPeaceV2.mint(dummyAddr1.address,mintAmount);
        expect(await makeWorldPeaceV2.connect(dummyAddr1).burn_supply(burnAmount));

        await makeWorldPeaceV2.revokeRole(makeWorldPeaceV2.BURNER_ROLE(),dummyAddr1.address);   
        expectRevert(makeWorldPeaceV2.connect(dummyAddr1).burn_supply(burnAmount));        
    });

    it("Should not let assigned user to revoke their own burner role as user is not admin role for burner role", async function () {
    
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.BURNER_ROLE(),dummyAddr1.address);
        await makeWorldPeaceV2.mint(dummyAddr1.address,mintAmount);
        expect(await makeWorldPeaceV2.connect(dummyAddr1).burn_supply(burnAmount));
      
        expectRevert(makeWorldPeaceV2.connect(dummyAddr1).revokeRole(makeWorldPeaceV2.BURNER_ROLE(),dummyAddr1.address)); 
        expect(await makeWorldPeaceV2.connect(dummyAddr1).burn_supply(burnAmount));        
    });
    
    it("Should allow assigned user with burner role to renounce their own burner role so user could not burn token", async function () {
        
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.BURNER_ROLE(),dummyAddr1.address);
        await makeWorldPeaceV2.mint(dummyAddr1.address,mintAmount);
        expect(await makeWorldPeaceV2.connect(dummyAddr1).burn_supply(burnAmount));

        await makeWorldPeaceV2.connect(dummyAddr1).renounceRole(makeWorldPeaceV2.BURNER_ROLE(),dummyAddr1.address); 
        expectRevert(makeWorldPeaceV2.connect(dummyAddr1).burn_supply(burnAmount));
    });

    it("Should not let owner to renounce burner role from assigned user as renounce is reserved to be used on caller himself", async function () {
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.BURNER_ROLE(),dummyAddr1.address);
        await makeWorldPeaceV2.mint(dummyAddr1.address,mintAmount);
        expect(await makeWorldPeaceV2.connect(dummyAddr1).burn_supply(burnAmount));
      
        expectRevert(makeWorldPeaceV2.renounceRole(makeWorldPeaceV2.BURNER_ROLE(),dummyAddr1.address));
        expect(await makeWorldPeaceV2.connect(dummyAddr1).burn_supply(burnAmount));
    });
});

describe("MakeWorldPeacev2 token freeze/pause and unfreeze/unpause functionality", function () {

    let makeWorldPeace, makeWorldPeaceV2;
    let owner, dummyAddr1;
    let proxyAddr;
    const mintAmount = ethers.utils.parseEther("10000");

    beforeEach(async function () {
        const MakeWorldPeace = await hre.ethers.getContractFactory("MakeWorldPeace");
        const MakeWorldPeaceV2 = await hre.ethers.getContractFactory("MakeWorldPeaceV2");

        makeWorldPeace = await upgrades.deployProxy(MakeWorldPeace, { initializer: 'initialize', kind: 'uups' });
        await makeWorldPeace.deployed();
        proxyAddr = makeWorldPeace.address;

        makeWorldPeaceV2 = await upgrades.upgradeProxy(proxyAddr, MakeWorldPeaceV2); // Upgrade contract with proxy address
        await makeWorldPeaceV2.deployed(); 
        await makeWorldPeaceV2.upgradeToV2();

        [owner, dummyAddr1,dummyAddr2] = await ethers.getSigners();
    })

    it("Should let owner grant pauser role to user and pause tokens supply and verify with token transaction", async function () {

        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.BURNER_ROLE(),dummyAddr1.address);
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.MINTER_ROLE(),dummyAddr1.address);
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.PAUSER_ROLE(),dummyAddr1.address);

        await makeWorldPeaceV2.connect(dummyAddr1).pause();
        expectRevert(makeWorldPeaceV2.connect(dummyAddr1).mint(dummyAddr1.address,mintAmount));
        expectRevert(makeWorldPeaceV2.connect(dummyAddr1).burn_supply(dummyAddr1.address,mintAmount));
    });

    it("Should not let user without pauser role to pause token supply", async function () {

        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.BURNER_ROLE(),dummyAddr1.address);
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.MINTER_ROLE(),dummyAddr1.address);

        expectRevert(makeWorldPeaceV2.connect(dummyAddr1).pause());
    });

    it("Should let user with pauser role to unpause tokens supply after pause and verify with token transaction", async function () {
       
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.BURNER_ROLE(),dummyAddr1.address);
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.MINTER_ROLE(),dummyAddr1.address);
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.PAUSER_ROLE(),dummyAddr1.address);

        await makeWorldPeaceV2.connect(dummyAddr1).pause();
        await makeWorldPeaceV2.connect(dummyAddr1).unpause();
        expect(makeWorldPeaceV2.connect(dummyAddr1).mint(dummyAddr1.address,mintAmount));
        expect(makeWorldPeaceV2.connect(dummyAddr1).burn_supply(dummyAddr1.address,mintAmount));
    });

    it("Should not let user with pauser role pause if it is already paused", async function () {
    
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.PAUSER_ROLE(),dummyAddr1.address);

        await makeWorldPeaceV2.connect(dummyAddr1).pause();
        expectRevert(makeWorldPeaceV2.connect(dummyAddr1).pause());       
    });

    it("Should not let user with pauser role unpause if it is already unpaused", async function () {
    
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.PAUSER_ROLE(),dummyAddr1.address);
        expectRevert(makeWorldPeaceV2.connect(dummyAddr1).unpause());
    });
    
    it("Should let owner to revoke pauser role of assigned user so user could not pause token", async function () {
    
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.PAUSER_ROLE(),dummyAddr1.address);
        expect(await makeWorldPeaceV2.connect(dummyAddr1).pause());
        
        await makeWorldPeaceV2.connect(dummyAddr1).unpause();   // Unpause so can be pause again 

        await makeWorldPeaceV2.revokeRole(makeWorldPeaceV2.PAUSER_ROLE(),dummyAddr1.address);   
        expectRevert(makeWorldPeaceV2.connect(dummyAddr1).pause());        
    });

    it("Should not let assigned user to revoke their own pauser role as user is not admin role for pauser role", async function () {
    
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.PAUSER_ROLE(),dummyAddr1.address);
        expect(await makeWorldPeaceV2.connect(dummyAddr1).pause());
        await makeWorldPeaceV2.connect(dummyAddr1).unpause();
      
        expectRevert(makeWorldPeaceV2.connect(dummyAddr1).revokeRole(makeWorldPeaceV2.PAUSER_ROLE(),dummyAddr1.address)); 
        expect(await makeWorldPeaceV2.connect(dummyAddr1).pause());      
    });
    
    it("Should allow assigned user with pauser role to renounce their own pauser role so user could not pause token", async function () {
        
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.PAUSER_ROLE(),dummyAddr1.address);
        expect(await makeWorldPeaceV2.connect(dummyAddr1).pause());
        await makeWorldPeaceV2.connect(dummyAddr1).unpause();

        await makeWorldPeaceV2.connect(dummyAddr1).renounceRole(makeWorldPeaceV2.PAUSER_ROLE(),dummyAddr1.address); 
        expectRevert(makeWorldPeaceV2.connect(dummyAddr1).pause());
    });

    it("Should not let owner to renounce pauser role from assigned user as renounce is reserved to be used on caller himself", async function () {
        
        await makeWorldPeaceV2.grantRole(makeWorldPeaceV2.PAUSER_ROLE(),dummyAddr1.address);
        expect(await makeWorldPeaceV2.connect(dummyAddr1).pause());
        await makeWorldPeaceV2.connect(dummyAddr1).unpause();
      
        expectRevert(makeWorldPeaceV2.renounceRole(makeWorldPeaceV2.PAUSER_ROLE(),dummyAddr1.address));
        expect(await makeWorldPeaceV2.connect(dummyAddr1).pause());
    });
});
