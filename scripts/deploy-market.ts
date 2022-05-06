import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import * as conf from "../config";

let owner : SignerWithAddress;
let addr1 : SignerWithAddress;

async function main() {
  [owner, addr1] = await ethers.getSigners();

  const mERC721 = await ethers.getContractFactory("mERC721");
  const erc721 = await mERC721.deploy("mERC721", "mERC7", "https://gateway.pinata.cloud/ipfs/QmZiCMB1TsjNLoGY26XUkLMjHWs4Mh3R6KGv9uFaWdViPg/");
  await erc721.deployed();
  console.log("NFT deployed:", erc721.address);  

  const M63 = await ethers.getContractFactory("m63");
  const m63 = await M63.deploy('platinum', 'PL', 18, ethers.utils.parseEther('10'));
  await m63.deployed();
  console.log("Token deployed:", m63.address);  

  const mNT = await ethers.getContractFactory("marketNFT");
  const mNFT = await mNT.deploy(erc721.address, m63.address);
  await mNFT.deployed();

  await erc721.setMinter(mNFT.address);  

  console.log("Marketplace deployed to:", mNFT.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
