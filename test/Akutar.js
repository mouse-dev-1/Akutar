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
  it("Permission checking", async function () {
    await expect(
      Akutar.connect(signers[1]).airdrop(0, [signers[1].address])
    ).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(Akutar.connect(signers[1]).commit("")).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    await expect(Akutar.connect(signers[1]).reveal()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    await expect(Akutar.connect(signers[1]).setBaseURI("")).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    await expect(
      Akutar.connect(signers[1]).updateRoyalties(signers[1].address, 1000)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Commits and reveal shuffle index", async function () {
    // Cannot reveal before commit
    await expect(Akutar.reveal()).to.be.revertedWith("You have yet to commit");

    await Akutar.commit("TESTHASH");

    // Cannot commit twice
    await expect(Akutar.commit("")).to.be.revertedWith("Already committed!");

    // Cannot reveal before block advanced by 5
    await expect(Akutar.reveal()).to.be.revertedWith(
      "Not enough time has passed to reveal"
    );

    //Mine more fake blocks
    await network.provider.send("evm_mine");
    // Cannot reveal before block advanced by 5
    await expect(Akutar.reveal()).to.be.revertedWith(
      "Not enough time has passed to reveal"
    );

    await network.provider.send("evm_mine");

    await Akutar.reveal();

    // Cannot reveal twice
    await expect(Akutar.reveal()).to.be.revertedWith("Already shifted!");

    console.log(
      `Shift quantity has been set to: ${parseInt(
        await Akutar.shiftQuantity()
      )}`
    );
    expect(await Akutar.shiftQuantity()).to.gte(0);

    //Check provenance hash
    expect(await Akutar.PROVENANCE_HASH()).to.equal("TESTHASH");
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

    // Test token uri
    await expect(Akutar.tokenURI(15001)).to.be.revertedWith(
      "ERC721Metadata: URI query for nonexistent token"
    );

    expect(await Akutar.tokenURI(1)).to.equal("1.json");
    await Akutar.setBaseURI("http://test.com/");
    expect(await Akutar.tokenURI(1)).to.equal("http://test.com/1.json");
  });

  it("Royalty test", async function () {
    // Test royalties
    await Akutar.updateRoyalties(signers[1].address, 1000);
    const royaltyAmount = await Akutar.royaltyInfo(1, 1000);
    expect(royaltyAmount[0]).to.equal(signers[1].address);
    expect(royaltyAmount[1]).to.deep.equal(ethers.BigNumber.from(100));
  });
});
