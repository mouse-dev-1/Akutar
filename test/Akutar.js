const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, waffle } = require("hardhat");

before(async function () {
  _Akutar = await ethers.getContractFactory("Akutar");
  Akutar = await _Akutar.deploy();

  signers = await ethers.getSigners();
});

describe("Tests", function () {
  it("Permission checking", async function () {
    await expect(Akutar.connect(signers[1]).airdrop(0, [signers[1].address])).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(Akutar.connect(signers[1]).commit('')).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(Akutar.connect(signers[1]).reveal()).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(Akutar.connect(signers[1]).setBaseURI('')).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(Akutar.connect(signers[1]).updateRoyalties(signers[1].address, 1000)).to.be.revertedWith('Ownable: caller is not the owner');
  })

  it("Commits and reveal shuffle index", async function () {
    // Cannot reveal before commit
    await expect(Akutar.reveal()).to.be.revertedWith('You have yet to commit');

    await Akutar.commit('TESTHASH');

    // Cannot commit twice
    await expect(Akutar.commit('')).to.be.revertedWith('Already committed!');

    // Cannot reveal before block advanced by 5
    await expect(Akutar.reveal()).to.be.revertedWith('Not enough time has passed to reveal');

    //Mine more fake blocks
    await network.provider.send("evm_mine");
    // Cannot reveal before block advanced by 5
    await expect(Akutar.reveal()).to.be.revertedWith('Not enough time has passed to reveal');

    await network.provider.send("evm_mine");
    
    await Akutar.reveal();

    // Cannot reveal twice
    await expect(Akutar.reveal()).to.be.revertedWith('Already shifted!');

    console.log(`Shift quantity has been set to: ${parseInt(await Akutar.shiftQuantity())}`);
    expect(await Akutar.shiftQuantity()).to.gte(0);

    //Check provenance hash
    expect(await Akutar.PROVENANCE_HASH()).to.equal('TESTHASH');
  });

  it("Should airdop akutars", async function () {
    //DROP 0
    await Akutar.airdrop(0, signers.map((a) => a.address).slice(0, 6));

    //DROP 1
    for (var i = 0; i < 5; i++) {
      await Akutar.airdrop(
        1,
        signers.map((a) => a.address)
      );
    }
    await Akutar.airdrop(1, signers.map((a) => a.address).slice(0, 29));

    //DROP 2
    for (var i = 0; i < 25; i++) {
      await Akutar.airdrop(
        2,
        signers.map((a) => a.address)
      );
    }
    await Akutar.airdrop(2, signers.map((a) => a.address).slice(0, 27));

    //DROP 3
    for (var i = 0; i < 119; i++) {
      await Akutar.airdrop(
        3,
        signers.map((a) => a.address)
      );
    }

    await Akutar.airdrop(3, signers.map((a) => a.address).slice(0, 38));

    const totalMinted =
      parseInt((await Akutar.airdropGroupings(0)).minted) +
      parseInt((await Akutar.airdropGroupings(1)).minted) +
      parseInt((await Akutar.airdropGroupings(2)).minted) +
      parseInt((await Akutar.airdropGroupings(3)).minted);

    const totalSupply = await Akutar.totalSupply();

    console.log(`${totalMinted} have been minted. Total supply equals ${totalSupply}.`);

    expect(totalSupply).to.equal(15000);
    expect(totalMinted).to.equal(15000);

    // Test token uri
    await expect(Akutar.tokenURI(15001)).to.be.revertedWith('ERC721Metadata: URI query for nonexistent token');

    expect(await Akutar.tokenURI(1)).to.equal('1.json');
    await Akutar.setBaseURI('http://test.com/');
    expect(await Akutar.tokenURI(1)).to.equal('http://test.com/1.json');
  });

  it("Royalty test", async function () {
    // Test royalties
    await Akutar.updateRoyalties(signers[1].address, 1000);
    const royaltyAmount = await Akutar.royaltyInfo(1, 1000);
    expect(royaltyAmount[0]).to.equal(signers[1].address);
    expect(royaltyAmount[1]).to.deep.equal(ethers.BigNumber.from(100));
  })

});