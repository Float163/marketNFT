import * as conf from "../config";
import { task } from "hardhat/config";

task("mint", "Mint token to recipient")
    .addParam("recipient", "The recipient address")
    .addParam("uri", "The URL address")    
    .setAction(async (taskArgs, { ethers }) => {
    let hardhatToken = await ethers.getContractAt(conf.CONTRACT_NAME, conf.CONTRACT_ADDR);
    const result = await hardhatToken.createItem(taskArgs.uri, taskArgs.recipient);
    console.log(result);
  });

  
export default {
  solidity: "0.8.4"
};
