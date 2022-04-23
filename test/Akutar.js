const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, waffle } = require("hardhat");

before(async function () {
  _Akutar = await ethers.getContractFactory("Akutar");
  Akutar = await _Akutar.deploy();

  signers = await ethers.getSigners();
});

describe("Tests", function () {
  it("Commits and reveal shuffle index", async function () {
    await Akutar.commit();

    //Mine 5 fake blocks
    await network.provider.send("evm_mine");
    await network.provider.send("evm_mine");
    await network.provider.send("evm_mine");
    await network.provider.send("evm_mine");
    await network.provider.send("evm_mine");

    await Akutar.reveal();

    console.log(await Akutar.shiftQuantity());
    expect(await Akutar.shiftQuantity()).to.gte(0);
  });

  it("Should airdop akutars", async function () {
    for (var i = 0; i < 5; i++) {
      await Akutar.airdrop(
        1,
        signers.map((a) => a.address)
      );
    }
    for (var i = 0; i < 25; i++) {
      await Akutar.airdrop(
        2,
        signers.map((a) => a.address)
      );
    }
    for (var i = 0; i < 110; i++) {
      await Akutar.airdrop(
        3,
        signers.map((a) => a.address)
      );
    }

    const totalMinted =
      parseInt((await Akutar.airdropGroupings(0)).minted) +
      parseInt((await Akutar.airdropGroupings(1)).minted) +
      parseInt((await Akutar.airdropGroupings(2)).minted) +
      parseInt((await Akutar.airdropGroupings(3)).minted);

    expect(totalMinted).to.equal(14000);
  });
});
