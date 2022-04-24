const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, waffle } = require("hardhat");
const fs = require("fs").promises;
const path = require("path");
const Promise = require("bluebird");


(async function () {
  _Akutar = await ethers.getContractFactory("Akutar");
  Akutar = await _Akutar.deploy();

  console.log(`Deployed Akutar at address ${Akutar.address}`);

  await Akutar.commit("TESTHASH");
})();
