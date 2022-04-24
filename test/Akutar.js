const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, waffle } = require("hardhat");
const fs = require("fs").promises;
const path = require("path");
const Promise = require("bluebird");

before(async function () {
  _Akutar = await ethers.getContractFactory("Akutar");
  Akutar = await _Akutar.deploy();

  signers = await ethers.getSigners();
});

function splitArrayIntoChunksOfLen(arr, len) {
  var chunks = [],
    i = 0,
    n = arr.length;
  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }
  return chunks;
}

const grabAddresses = async () => {
  const addresses = await Promise.all([
    (await fs.readFile(path.join(__dirname, "../airdropAddresses/partner.txt")))
      .toString()
      .split("\r\n"),
    (await fs.readFile(path.join(__dirname, "../airdropAddresses/MegaOG.txt")))
      .toString()
      .split("\r\n"),
    (await fs.readFile(path.join(__dirname, "../airdropAddresses/OG.txt")))
      .toString()
      .split("\r\n"),
    (await fs.readFile(path.join(__dirname, "../airdropAddresses/Normal.txt")))
      .toString()
      .split("\r\n"),
  ]);

  return addresses;
};

describe("Tests", function () {
  it("Commits and reveal shuffle index", async function () {
    await Akutar.commit("HASH");

    //Mine 4 more fake blocks
    await network.provider.send("evm_mine");
    await network.provider.send("evm_mine");
    await network.provider.send("evm_mine");
    await network.provider.send("evm_mine");

    await Akutar.reveal();

    console.log(
      `Shift quantity has been set to: ${parseInt(
        await Akutar.shiftQuantity()
      )}`
    );
    expect(await Akutar.shiftQuantity()).to.gt(0);
  });

  it("Should airdop akutars", async function () {
    const addresses = await grabAddresses();

    //Loop through each grouping
    await Promise.each(addresses, (airdropGrouping, index) => {
      return Promise.each(
        //Chunk the airdop into groups of 100, and use the index as the grouping ID.
        splitArrayIntoChunksOfLen(airdropGrouping, 100),
        (chunk) => Akutar.airdrop(index, chunk)
      );
    });

    const totalMinted =
      parseInt((await Akutar.airdropGroupings(0)).minted) +
      parseInt((await Akutar.airdropGroupings(1)).minted) +
      parseInt((await Akutar.airdropGroupings(2)).minted) +
      parseInt((await Akutar.airdropGroupings(3)).minted);

    const totalSupply = await Akutar.totalSupply();

    console.log(
      `${totalMinted} have been minted. Total supply equals ${totalSupply}.`
    );

    expect(totalSupply).to.equal(15000);
    expect(totalMinted).to.equal(15000);
  });
});
