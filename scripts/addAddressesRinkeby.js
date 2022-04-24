const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, waffle } = require("hardhat");
const fs = require("fs").promises;
const path = require("path");
const Promise = require("bluebird");

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

(async function () {
  _Akutar = await ethers.getContractFactory("Akutar");
  Akutar = await _Akutar.attach("0x4C399ec238A846e202a9f71A25b4d9b663207BB5");

  console.log(`Got Akutar at address ${Akutar.address}`);

  const addresses = await grabAddresses();

  //Loop through each grouping
  await Promise.each(addresses, async (airdropGrouping, airdropIndex) => {
    console.log(`Airdropping group ${airdropIndex}.`);

    //Chunk the airdop into groups of 100, and use the index as the grouping ID.
    await Promise.each(
      splitArrayIntoChunksOfLen(airdropGrouping, 100),
      async (chunk, chunkIndex) => {
        try {
          console.log(`Airdropping group ${airdropIndex} chunk ${chunkIndex}`);
          await Akutar.airdrop(airdropIndex, chunk, {
            gasLimit: 5000000,
          });
          return Promise.delay(1000);
        } catch (error) {
          console.log(error);
          return Promise.delay(10000);
        }
      }
    );

    console.log(`Finished airdropping group ${airdropIndex}.\n--------------`);
  });
})();
