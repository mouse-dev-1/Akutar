//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

/*
Akutar.sol

Written by: mousedev.eth

15,000 NFTs in 4 sections

ID 1-6 partner reserved NFTs

ID 7-535 Mega OG Akutars, randomly assigned to 529 Mega OG Mint Pass holders (addresses known)

ID 536-3,062 OG Akutars, randomly assigned to 2,527 OG Mint Pass holders (addresses known)

ID 3,063-15,000 Akutars, randomly assigned to 6,443 Mint Pass holders + 5495 public bids (addresses known)

*/

contract Akutar is Ownable, ERC721 {
    //Contract URI
    string public CONTRACT_URI = "";

    //Base URI
    string public BASE_URI;

    //Shift Quantity;
    uint256 public shiftQuantity;

    //Block to base randomness off of
    uint256 blockToUse;

    //Whether we have committed yet.
    bool committed;

    //Struct to define a grouping of airdrops
    struct Grouping {
        uint256 startingIndex;
        uint256 endingIndex;
        uint256 minted;
    }

    //Mapping of groupingId to grouping struct.
    mapping(uint256 => Grouping) public airdropGroupings;

    constructor() ERC721("Akutars", "AKU") {
        //Partner
        airdropGroupings[0] = Grouping(1, 6, 0);

        //Mega OG
        airdropGroupings[1] = Grouping(7, 535, 0);

        //OG
        airdropGroupings[2] = Grouping(536, 3062, 0);

        //Normal
        airdropGroupings[3] = Grouping(3063, 15000, 0);
    }

    function airdrop(uint256 airdropGrouping, address[] memory addresses)
        public
        onlyOwner
    {
        require(shiftQuantity > 0, "Not yet shifted!");

        Grouping memory thisGrouping = airdropGroupings[airdropGrouping];

        //Total tokens in this grouping;
        uint256 maxQuantityWithinThisGrouping = (thisGrouping.endingIndex -
            thisGrouping.startingIndex +
            1);

        //How much to shift within these constraints.;
        uint256 shiftQuantityWithinThisGrouping = shiftQuantity %
            maxQuantityWithinThisGrouping;

        //Index to currently start on
        uint256 startingIndexWithinThisGrouping = thisGrouping.startingIndex + thisGrouping.minted + shiftQuantityWithinThisGrouping;

        require(
            thisGrouping.minted + addresses.length <=
                maxQuantityWithinThisGrouping,
            "Would overflow grouping"
        );

        //Cast to thisId
        uint256 currentId = startingIndexWithinThisGrouping;

        for (uint256 i = 0; i < addresses.length; i++) {

            //If we are over the endingIndex because of the shuffle, adjust to current position minus max quantity;
            if (currentId > thisGrouping.endingIndex)
                currentId = currentId - maxQuantityWithinThisGrouping;

            console.log(currentId);

            //Mint thisId
            _safeMint(addresses[i], currentId);

            //Increment ID by one.
            currentId++;
        }

        airdropGroupings[airdropGrouping].minted += addresses.length;
    }

    function commit() public onlyOwner {
        //Require shift hasn't happened
        require(shiftQuantity == 0, "Already shifted!");

        //Set the block to use as 5 blocks from now
        blockToUse = block.number + 5;

        //Set committed at true
        committed = true;
    }

    function reveal() public onlyOwner {
        //Require shift hasn't happened
        require(shiftQuantity == 0, "Already shifted!");

        //Require they have committed
        require(committed, "You have yet to commit");

        //set shift quantity
        shiftQuantity = uint256(blockhash(blockToUse)) % 15000;
    }

    function setBaseURI(string memory _baseURI) public onlyOwner {
        BASE_URI = _baseURI;
    }

    function contractURI() public view returns (string memory) {
        return CONTRACT_URI;
    }

    function setContractURI(string memory _contractURI) public onlyOwner {
        CONTRACT_URI = _contractURI;
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    BASE_URI,
                    Strings.toString(_tokenId)
                )
            );
    }
}
