import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

let owner : SignerWithAddress;
let addr1 : SignerWithAddress;

async function main() {
  [owner, addr1] = await ethers.getSigners();
  const mERC1155 = await ethers.getContractFactory("mERC1155");
  const erc1155 = await mERC1155.deploy("https://gateway.pinata.cloud/ipfs/QmZiCMB1TsjNLoGY26XUkLMjHWs4Mh3R6KGv9uFaWdViPg/");

  await erc1155.deployed();

  console.log("ERC-1155 deployed to:", erc1155.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
