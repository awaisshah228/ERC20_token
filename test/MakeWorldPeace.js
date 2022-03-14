const { expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("MakeWorldPeace token basic functionality", function () {

  let makeWorldPeace;
  let owner, dummyAddr1, dummyAddr2;
  const initSupply = "20220311.0";

  beforeEach(async function () {
    const MakeWorldPeace = await hre.ethers.getContractFactory("MakeWorldPeace");
    makeWorldPeace = await upgrades.deployProxy(MakeWorldPeace, { initializer: 'initialize', kind: 'uups' });
    await makeWorldPeace.deployed();
    [owner, dummyAddr1, dummyAddr2] = await ethers.getSigners();
  })

  it("Should successfully deployed", async function () { });

  it("Should deploy with 20,220,311 of supply for the owner of the contract", async function () {
    const balance = await makeWorldPeace.balanceOf(owner.address);
    expect(ethers.utils.formatEther(balance)).to.equal(initSupply);

  });

  it("Should have same initial total supply as supply minted by owner of the contract", async function () {
    const totalSupply = await makeWorldPeace.totalSupply();
    expect(ethers.utils.formatEther(totalSupply)).to.equal(initSupply);

  });

  it("Should let owner send tokens to other address", async function () {
    const testAmount = ethers.utils.parseEther("188");
    await makeWorldPeace.transfer(dummyAddr1.address, testAmount);
    expect(await makeWorldPeace.balanceOf(dummyAddr1.address)).to.equal(testAmount);
  });

  it("Should let user 1 approve another user to send certain amount of MWP tokens to user 2 on user 1's behalf (Amounts deducted from user 1 account)", async function () {
    const addr1Amount = ethers.utils.parseEther("188");
    const testAmount = ethers.utils.parseEther("88");
 
    await makeWorldPeace.connect(dummyAddr1).approve(owner.address, addr1Amount);          // dummyAddr1 user approve owner to make transaction up to addr1Amount
    await makeWorldPeace.transfer(dummyAddr1.address, addr1Amount);                        // owner transfer to dummyAddr1 with addr1Amount for next test case
    await makeWorldPeace.transferFrom(dummyAddr1.address, dummyAddr2.address, testAmount);  // owner will transfer testAmount ot dummyAddr1 on behalf of dummyAddr1 
    expect(await makeWorldPeace.balanceOf(dummyAddr1.address)).to.equal(addr1Amount.sub(testAmount));  //dummyAddr1 should have testAmount deduct from his account
    expect(await makeWorldPeace.balanceOf(dummyAddr2.address)).to.equal(testAmount);      // dummyAddr2 have receive testAmount
  });

});

describe("MakeWorldPeace token mint functionality", function () {

  let makeWorldPeace;
  let owner, dummyAddr1;

  beforeEach(async function () {
    const MakeWorldPeace = await hre.ethers.getContractFactory("MakeWorldPeace");
    makeWorldPeace = await upgrades.deployProxy(MakeWorldPeace, { initializer: 'initialize', kind: 'uups' });
    [owner, dummyAddr1] = await ethers.getSigners();
  })

  it("Should let owner mint tokens supply less than or equal to 10,000 within 30 seconds of last minting time", async function () {
    const mintAmount1 = ethers.utils.parseEther("10000");
    const mintAmount2 = ethers.utils.parseEther("8888");

    const initialAmount = await makeWorldPeace.balanceOf(owner.address);
    const initialAmount_user = await makeWorldPeace.balanceOf(dummyAddr1.address);

    await makeWorldPeace.mint(owner.address, mintAmount1);
    await makeWorldPeace.mint(dummyAddr1.address, mintAmount2);

    expect(await makeWorldPeace.balanceOf(owner.address)).to.equal(initialAmount.add(mintAmount1));
    expect(await makeWorldPeace.balanceOf(dummyAddr1.address)).to.equal(initialAmount_user.add(mintAmount2));
  });

  it("Should let owner mint tokens supply more than 10,000 after 180 seconds [3 minutes] of last minting time", async function () {
    const mintAmount = ethers.utils.parseEther("12000");
    const initialAmount = await makeWorldPeace.balanceOf(owner.address);
    await network.provider.send("evm_increaseTime", [3*60]); //Receives a number of seconds that will be added to the timestamp of the latest block.
    await makeWorldPeace.mint(owner.address, mintAmount);
    expect(await makeWorldPeace.balanceOf(owner.address)).to.equal(mintAmount.add(initialAmount));
  });

  it("Should not let owner mint tokens supply more than 10,000 within 180 seconds [3 minutes] of last minting time", async function () {
    const mintAmount = ethers.utils.parseEther("12000");
    expectRevert(makeWorldPeace.mint(owner.address, mintAmount));
  });

  it("Should not let user other than owner mint tokens supply regardless more than 10,000 within 30 seconds or not", async function () {
    const mintAmount1 = ethers.utils.parseEther("10000");
    const mintAmount2 = ethers.utils.parseEther("12000");
    expectRevert(makeWorldPeace.connect(dummyAddr1).mint(owner.address, mintAmount1));
    expectRevert(makeWorldPeace.connect(dummyAddr1).mint(owner.address, mintAmount2));
  });

});

describe("MakeWorldPeace token burn functionality", function () {

  let makeWorldPeace;
  let owner, dummyAddr1;
  const initSupply = "20220311";

  beforeEach(async function () {
    const MakeWorldPeace = await hre.ethers.getContractFactory("MakeWorldPeace");
    makeWorldPeace = await upgrades.deployProxy(MakeWorldPeace, { initializer: 'initialize', kind: 'uups' });
    [owner, dummyAddr1] = await ethers.getSigners();
  })

  it("Should let owner burn tokens supply less than or equal value of owner token balance", async function () {
    const burnAmount = ethers.utils.parseEther(initSupply);
    const initialAmount = await makeWorldPeace.balanceOf(owner.address);
    await makeWorldPeace.burn_supply(burnAmount);
    expect(await makeWorldPeace.balanceOf(owner.address)).to.equal(burnAmount.sub(initialAmount)); // Should be 0 as we burn all
  });

  it("Should not let owner burn tokens supply more than what he owned", async function () {
    const burnAmount = ethers.utils.parseEther("20220312");
    expectRevert(makeWorldPeace.burn_supply(burnAmount), "Failed attempt to burn tokens where requested burn tokens is more than owned tokens");
  });

  it("Should not let user other than owner burn tokens supply", async function () {
    const burnAmount1 = ethers.utils.parseEther("1000");
    const burnAmount2 = ethers.utils.parseEther("1001");

    await makeWorldPeace.transfer(dummyAddr1.address, burnAmount1);  // Send some token to dummyAddr1 for testing purpose
    expect(await makeWorldPeace.balanceOf(dummyAddr1.address)).to.equal(burnAmount1);

    expectRevert(makeWorldPeace.connect(dummyAddr1).burn_supply(burnAmount1));
    expectRevert(makeWorldPeace.connect(dummyAddr1).burn_supply(burnAmount2));
  });

});

describe("MakeWorldPeace token freeze/pause and unfreeze/unpause functionality", function () {

  let makeWorldPeace;
  let owner, dummyAddr1, dummyAddr2;

  beforeEach(async function () {
    const MakeWorldPeace = await hre.ethers.getContractFactory("MakeWorldPeace");
    makeWorldPeace = await upgrades.deployProxy(MakeWorldPeace, { initializer: 'initialize', kind: 'uups' });
    [owner, dummyAddr1, dummyAddr2] = await ethers.getSigners();
  })

  it("Should let owner freeze tokens supply and verify with token transaction", async function () {
    const dummyAmount = ethers.utils.parseEther("1000");

    await makeWorldPeace.pause();
    // Expect mint function fail
    expectRevert(makeWorldPeace.mint(owner.address, 88));
    expectRevert(makeWorldPeace.mint(dummyAddr1, 100));

    // Expect transfer function fail
    expectRevert(makeWorldPeace.transfer(dummyAddr1.address, dummyAmount));


    // Expect burn function fail
    expectRevert(makeWorldPeace.burn_supply(dummyAmount));
  });

  it("Should let owner unfreeze tokens supply after freeze and verify with token transaction", async function () {
    const dummyAmount = ethers.utils.parseEther("1000");

    await makeWorldPeace.pause();
    await makeWorldPeace.unpause();

    // Expect mint function success
    const mintAmount = ethers.utils.parseEther("88");

    let initialAmount = await makeWorldPeace.balanceOf(owner.address);
    let initialAmount_user = await makeWorldPeace.balanceOf(dummyAddr1.address);


    await makeWorldPeace.mint(owner.address, mintAmount);
    await makeWorldPeace.mint(dummyAddr1.address, mintAmount);

    expect(await makeWorldPeace.balanceOf(owner.address)).to.equal(initialAmount.add(mintAmount));
    expect(await makeWorldPeace.balanceOf(dummyAddr1.address)).to.equal(initialAmount_user.add(mintAmount));

    // Expect transfer function success
    await makeWorldPeace.transfer(dummyAddr2.address, dummyAmount);
    expect(await makeWorldPeace.balanceOf(dummyAddr2.address)).to.equal(dummyAmount);


    // Expect burn function success
    initialAmount = await makeWorldPeace.balanceOf(owner.address);
    await makeWorldPeace.burn_supply(dummyAmount);
    expect(await makeWorldPeace.balanceOf(owner.address)).to.equal(initialAmount.sub(dummyAmount));

  });

  it("Should not let owner freeze if it is already freezed", async function () {
    await makeWorldPeace.pause();
    expectRevert(makeWorldPeace.pause());
  });

  it("Should not let owner unfreeze if it is already unfreezed", async function () {
    expectRevert(makeWorldPeace.unpause());
  });

  it("Should not let user other than owner freeze/unfreeze tokens supply", async function () {
    expectRevert(makeWorldPeace.connect(dummyAddr1).pause());
    expectRevert(makeWorldPeace.connect(dummyAddr1).unpause());
  });

});
