const { expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MakeWorldPeacev3 token burn accessibility", function () {

    let makeWorldPeace, makeWorldPeaceV2, makeWorldPeaceV3;
    let owner, dummyAddr1,dummyAddr2;
    let proxyAddr,implAddr2,implAddr3;
    const mintAmount = ethers.utils.parseEther("10000");
    const approveAmount = ethers.utils.parseEther("800");
    const burnAmount = ethers.utils.parseEther("500");

    beforeEach(async function () {
        const MakeWorldPeace = await hre.ethers.getContractFactory("MakeWorldPeace");
        const MakeWorldPeaceV2 = await hre.ethers.getContractFactory("MakeWorldPeaceV2");
        const MakeWorldPeaceV3 = await hre.ethers.getContractFactory("MakeWorldPeaceV3");

        makeWorldPeace = await upgrades.deployProxy(MakeWorldPeace, { initializer: 'initialize', kind: 'uups' });
        await makeWorldPeace.deployed();
        proxyAddr = makeWorldPeace.address;

        makeWorldPeaceV2 = await upgrades.upgradeProxy(proxyAddr, MakeWorldPeaceV2); 
        await makeWorldPeaceV2.deployed();
        await makeWorldPeaceV2.upgradeToV2();
        implAddr2 = await upgrades.erc1967.getImplementationAddress(proxyAddr); // Implementation Address after first update

        makeWorldPeaceV3 = await upgrades.upgradeProxy(proxyAddr, MakeWorldPeaceV3); 
        await makeWorldPeaceV3.deployed();
        implAddr3 = await upgrades.erc1967.getImplementationAddress(proxyAddr); // Implementation Address after second update   

        expect(implAddr2).to.not.equal(implAddr3);
        [owner,dummyAddr1,dummyAddr2] = await ethers.getSigners();
    })

    it("Should let owner grant burner role to user and burn token.", async function () {

        await makeWorldPeaceV3.grantRole(makeWorldPeaceV3.BURNER_ROLE(),dummyAddr1.address);

        await makeWorldPeaceV3.mint(dummyAddr1.address,mintAmount);
        const initialAmount_user = await makeWorldPeaceV3.balanceOf(dummyAddr1.address);
        expect(await makeWorldPeaceV3.connect(dummyAddr1).burn(burnAmount));

        expect(await makeWorldPeaceV3.balanceOf(dummyAddr1.address)).to.equal(initialAmount_user.sub(burnAmount));
    });

    it("Should not let user without burner role to burn token", async function () {

        await makeWorldPeaceV3.mint(dummyAddr2.address,mintAmount);
        expect(await makeWorldPeaceV3.balanceOf(dummyAddr2.address)).to.equal(mintAmount);
        expectRevert(makeWorldPeaceV3.connect(dummyAddr2).burn(burnAmount));
    });

    it("Should let owner to revoke burner role of assigned user so user could not burn token", async function () {
    
        await makeWorldPeaceV3.grantRole(makeWorldPeaceV3.BURNER_ROLE(),dummyAddr1.address);
        await makeWorldPeaceV3.mint(dummyAddr1.address,mintAmount);
        expect(await makeWorldPeaceV3.connect(dummyAddr1).burn(burnAmount));

        await makeWorldPeaceV3.revokeRole(makeWorldPeaceV3.BURNER_ROLE(),dummyAddr1.address);   
        expectRevert(makeWorldPeaceV3.connect(dummyAddr1).burn(burnAmount));        
    });

    it("Should not let assigned user to revoke their own burner role as user is not admin role for burner role", async function () {
    
        await makeWorldPeaceV3.grantRole(makeWorldPeaceV3.BURNER_ROLE(),dummyAddr1.address);
        await makeWorldPeaceV3.mint(dummyAddr1.address,mintAmount);
        expect(await makeWorldPeaceV3.connect(dummyAddr1).burn(burnAmount));
      
        expectRevert(makeWorldPeaceV3.connect(dummyAddr1).revokeRole(makeWorldPeaceV3.BURNER_ROLE(),dummyAddr1.address)); 
        expect(await makeWorldPeaceV3.connect(dummyAddr1).burn(burnAmount));        
    });
    
    it("Should allow assigned user with burner role to renounce their own burner role so user could not burn token", async function () {
        
        await makeWorldPeaceV3.grantRole(makeWorldPeaceV3.BURNER_ROLE(),dummyAddr1.address);
        await makeWorldPeaceV3.mint(dummyAddr1.address,mintAmount);
        expect(await makeWorldPeaceV3.connect(dummyAddr1).burn(burnAmount));

        await makeWorldPeaceV3.connect(dummyAddr1).renounceRole(makeWorldPeaceV3.BURNER_ROLE(),dummyAddr1.address); 
        expectRevert(makeWorldPeaceV3.connect(dummyAddr1).burn(burnAmount));
    });

    it("Should not let owner to renounce burner role from assigned user as renounce is reserved to be used on caller himself", async function () {
        await makeWorldPeaceV3.grantRole(makeWorldPeaceV2.BURNER_ROLE(),dummyAddr1.address);
        await makeWorldPeaceV3.mint(dummyAddr1.address,mintAmount);
        expect(await makeWorldPeaceV3.connect(dummyAddr1).burn(burnAmount));
      
        expectRevert(makeWorldPeaceV3.renounceRole(makeWorldPeaceV3.BURNER_ROLE(),dummyAddr1.address));
        expect(await makeWorldPeaceV3.connect(dummyAddr1).burn(burnAmount));
    });

    it("Should let owner grant burner role to user and let user burn token on behalf of other.", async function () {

        await makeWorldPeaceV3.grantRole(makeWorldPeaceV3.BURNER_ROLE(),dummyAddr1.address);
        const initialAmount_user = await makeWorldPeaceV3.balanceOf(owner.address);

        await makeWorldPeace.approve(dummyAddr1.address, burnAmount); 
        expect(await makeWorldPeaceV3.connect(dummyAddr1).burnFrom(owner.address,burnAmount));

        expect(await makeWorldPeaceV3.balanceOf(owner.address)).to.equal(initialAmount_user.sub(burnAmount));
    });

    it("Should not let user without burner role to burn token on behalf of other", async function () {

        expectRevert(makeWorldPeaceV3.connect(dummyAddr2).burnFrom(owner.address, burnAmount));
    });

    it("Should let owner to revoke burner role of assigned user so user could not burn token on behalf of other", async function () {
    
        await makeWorldPeaceV3.grantRole(makeWorldPeaceV3.BURNER_ROLE(),dummyAddr1.address);

        await makeWorldPeace.approve(dummyAddr1.address, burnAmount); 
        expect(await makeWorldPeaceV3.connect(dummyAddr1).burnFrom(owner.address,burnAmount));

        await makeWorldPeaceV3.revokeRole(makeWorldPeaceV3.BURNER_ROLE(),dummyAddr1.address);   
        expectRevert(makeWorldPeaceV3.connect(dummyAddr1).burnFrom(owner.address,burnAmount));        
    });

    it("Should not let assigned user to revoke their own burner role as user is not admin role for burner role", async function () {
    
        await makeWorldPeaceV3.grantRole(makeWorldPeaceV3.BURNER_ROLE(),dummyAddr1.address);
        await makeWorldPeace.approve(dummyAddr1.address, burnAmount); 
        expect(await makeWorldPeaceV3.connect(dummyAddr1).burnFrom(owner.address,burnAmount));
      
        expectRevert(makeWorldPeaceV3.connect(dummyAddr1).revokeRole(makeWorldPeaceV3.BURNER_ROLE(),dummyAddr1.address)); 
        await makeWorldPeace.approve(dummyAddr1.address, burnAmount); 
        expect(await makeWorldPeaceV3.connect(dummyAddr1).burnFrom(owner.address,burnAmount));   
    });

    it("Should allow assigned user with burner role to renounce their own burner role so user could not burn token on behalf of other", async function () {
        
        await makeWorldPeaceV3.grantRole(makeWorldPeaceV3.BURNER_ROLE(),dummyAddr1.address);
        await makeWorldPeace.approve(dummyAddr1.address, burnAmount); 
        expect(await makeWorldPeaceV3.connect(dummyAddr1).burnFrom(owner.address,burnAmount));

        await makeWorldPeaceV3.connect(dummyAddr1).renounceRole(makeWorldPeaceV3.BURNER_ROLE(),dummyAddr1.address); 
        expectRevert(makeWorldPeaceV3.connect(dummyAddr1).burnFrom(owner.address,burnAmount));
    });

    it("Should not let owner to renounce burner role from assigned user as renounce is reserved to be used on caller himself", async function () {
        await makeWorldPeaceV3.grantRole(makeWorldPeaceV2.BURNER_ROLE(),dummyAddr1.address);
        await makeWorldPeace.approve(dummyAddr1.address, burnAmount); 
        expect(await makeWorldPeaceV3.connect(dummyAddr1).burnFrom(owner.address,burnAmount));
      
        expectRevert(makeWorldPeaceV3.renounceRole(makeWorldPeaceV3.BURNER_ROLE(),dummyAddr1.address));
        await makeWorldPeace.approve(dummyAddr1.address, burnAmount); 
        expect(await makeWorldPeaceV3.connect(dummyAddr1).burnFrom(owner.address,burnAmount));
    });
});
