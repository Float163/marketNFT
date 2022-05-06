// We import Chai to use its asserting functions here.
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.

// `describe` receives the name of a section of your test suite, and a callback.
// The callback must define the tests of that section. This callback can't be
// an async function.
describe("Marketplace contract & NFT 1155", function () {
  // Mocha has four functions that let you hook into the test runner's
  // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.

  // They're very useful to setup the environment for tests, and to clean it
  // up after they run.

  // A common pattern is to declare some variables, and assign them in the
  // `before` and `beforeEach` callbacks.

  let Token : ContractFactory;
  let Mp : ContractFactory;
  let TokenERC20 : ContractFactory;
 
  let market : Contract;
  let mERC1155 : Contract;
  let mERC20: Contract;
  let owner : SignerWithAddress;
  let addr1 : SignerWithAddress;
  let addr2 : SignerWithAddress;
  let addr3 : SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3 ] = await ethers.getSigners();    
    Token = await ethers.getContractFactory("mERC1155");
    mERC1155 = await Token.deploy("https://gateway.pinata.cloud/ipfs/QmZiCMB1TsjNLoGY26XUkLMjHWs4Mh3R6KGv9uFaWdViPg/");    
    TokenERC20 = await ethers.getContractFactory("m63");    
    mERC20 = await TokenERC20.deploy('platinum', 'PL', 18, ethers.utils.parseEther('500'));    
    Mp = await ethers.getContractFactory("marketNFT");
    market = await Mp.deploy(mERC1155.address, mERC20.address);    
    await mERC1155.setMinter(market.address);
    await mERC20.mint(addr1.address, ethers.utils.parseEther('100'));
    await mERC20.mint(addr2.address, ethers.utils.parseEther('100'));
    await mERC20.mint(addr3.address, ethers.utils.parseEther('100'));    
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await market.owner()).to.equal(owner.address);
    });
  });

  describe("Transactions - mint item", function () {
    it("Should mint tokens to accounts", async function () {
        await market.createItem("", addr1.address);
        const addr1Balance = await mERC1155.balanceOf(addr1.address, 0);
        const addr1URI = await mERC1155.tokenURI(1);
        expect(addr1Balance).to.equal(1);
        expect(addr1URI).to.equal('https://gateway.pinata.cloud/ipfs/QmZiCMB1TsjNLoGY26XUkLMjHWs4Mh3R6KGv9uFaWdViPg/1');
      });

    it("Should fail if mint sender not minter", async function () {
      await expect(
        mERC1155.connect(addr1).mint(addr2.address, 0, 1, 0)
      ).to.be.revertedWith("Caller is not a minter");
    });
  });

  describe("Transactions - list & buy item", function () {
    it("Should list item", async function () {
      await market.createItem("", addr1.address);
      await mERC1155.connect(addr1).setApprovalForAll(market.address, true);
      await market.connect(addr1).listItem(0, 1);
      const mBalance = await mERC1155.balanceOf(market.address, 0);      
      expect(mBalance).to.equal(1);      
    });

    it("Should fail list item if price is zero", async function () {
      await market.createItem("", addr1.address);
      await expect(
        market.connect(addr1).listItem(0, 0)
      ).to.be.revertedWith("Price is 0");
    });

    it("Should fail list item if sender is not owner", async function () {
      await market.createItem("", addr1.address);
      await expect(
        market.connect(addr1).listItem(1, 1)
      ).to.be.revertedWith("Not owner");
    });

    it("Should buy item", async function () {
      await market.createItem("", addr1.address);
      await mERC1155.connect(addr1).setApprovalForAll(market.address, true);
      await mERC20.connect(addr2).approve(addr1.address, ethers.utils.parseEther('10'));      
      await market.connect(addr1).listItem(0, ethers.utils.parseEther('5'));
      await market.connect(addr2).buyItem(0);
      const addr1Balance = await mERC1155.balanceOf(addr1.address, 0);
      const addr2Balance = await mERC1155.balanceOf(addr2.address, 0);
      const addr1BalanceE = await mERC20.balanceOf(addr1.address);
      const addr2BalanceE = await mERC20.balanceOf(addr2.address);
      expect(addr1Balance).to.equal(0);
      expect(addr2Balance).to.equal(1);      
      expect(addr1BalanceE).to.equal(ethers.utils.parseEther('105'));
      expect(addr2BalanceE).to.equal(ethers.utils.parseEther('95'));      
    });

    it("Should fail buy item if not listed", async function () {
      await expect(
        market.connect(addr1).buyItem(1)
      ).to.be.revertedWith("Not listed");
    });

    it("Should fail buy item if not enough token", async function () {
      await market.createItem("", addr1.address);
      await mERC1155.connect(addr1).setApprovalForAll(market.address, true);
      await mERC20.connect(addr2).approve(addr1.address, ethers.utils.parseEther('200'));      
      await market.connect(addr1).listItem(0, ethers.utils.parseEther('200'));
      await expect(
        market.connect(addr1).buyItem(0)
      ).to.be.revertedWith("No enough token");
    });

    it("Should cancel list item", async function () {
      await market.createItem("", addr1.address);
      await mERC1155.connect(addr1).setApprovalForAll(market.address, true);
      await market.connect(addr1).listItem(0, 1);
      await market.connect(addr1).cancelItem(0);      
      await expect(
        market.connect(addr2).buyItem(0)
      ).to.be.revertedWith("Not listed");
    });
  });

  describe("Transactions - auction", function () {

    it("Should auction item", async function () {
      await market.createItem("", addr1.address);
      await mERC1155.connect(addr1).setApprovalForAll(market.address, true);
      await market.connect(addr1).listItemOnAuction(0, 1);
      const mBalance = await mERC1155.balanceOf(market.address, 0);      
      expect(mBalance).to.equal(1);      
    });

    it("Should fail list item at auction if sender is not owner", async function () {
      await market.createItem("", addr1.address);
      await expect(
        market.connect(addr1).listItemOnAuction(1, 1)
      ).to.be.revertedWith("Not owner");
    });

    it("Should fail list item at auction if auction already exist", async function () {
      await market.createItem("", addr1.address);
      await mERC1155.connect(addr1).setApprovalForAll(market.address, true);
      await market.connect(addr1).listItemOnAuction(0, 1);
      await expect(
        market.connect(addr1).listItemOnAuction(0, 1)
      ).to.be.revertedWith("Already exist");
    });


    it("Should make bid", async function () {
      await market.createItem("", addr1.address);
      await mERC1155.connect(addr1).setApprovalForAll(market.address, true);
      await mERC20.connect(addr2).approve(market.address, ethers.utils.parseEther('200'));            
      await market.connect(addr1).listItemOnAuction(0, ethers.utils.parseEther('10'));
      await market.connect(addr2).makeBid(0, ethers.utils.parseEther('15'));
      const addr2BalanceE = await mERC20.balanceOf(addr2.address);
      expect(addr2BalanceE).to.equal(ethers.utils.parseEther('85'));      
    });

    it("Should make second bid", async function () {
      await market.createItem("", addr1.address);
      await mERC1155.connect(addr1).setApprovalForAll(market.address, true);
      await mERC20.connect(addr2).approve(market.address, ethers.utils.parseEther('200'));            
      await mERC20.connect(addr3).approve(market.address, ethers.utils.parseEther('200'));                  
      await market.connect(addr1).listItemOnAuction(0, ethers.utils.parseEther('10'));
      await market.connect(addr2).makeBid(0, ethers.utils.parseEther('15'));
      await market.connect(addr3).makeBid(0, ethers.utils.parseEther('20'));      
      const addr2BalanceE = await mERC20.balanceOf(addr2.address);
      expect(addr2BalanceE).to.equal(ethers.utils.parseEther('100'));      
      const addr3BalanceE = await mERC20.balanceOf(addr3.address);
      expect(addr3BalanceE).to.equal(ethers.utils.parseEther('80'));      
    });


    it("Should fail bid if price less current price", async function () {
      await market.createItem("", addr1.address);
      await mERC1155.connect(addr1).setApprovalForAll(market.address, true);
      await mERC20.connect(addr2).approve(market.address, ethers.utils.parseEther('200'));            
      await market.connect(addr1).listItemOnAuction(0, ethers.utils.parseEther('10'));
      await expect(
        market.connect(addr2).makeBid(0, ethers.utils.parseEther('5'))
      ).to.be.revertedWith("Price too small");
    });


    it("Should fail bid if not enough token", async function () {
      await market.createItem("", addr1.address);
      await mERC1155.connect(addr1).setApprovalForAll(market.address, true);
      await mERC20.connect(addr2).approve(market.address, ethers.utils.parseEther('200'));            
      await market.connect(addr1).listItemOnAuction(0, ethers.utils.parseEther('120'));
      await expect(
        market.connect(addr2).makeBid(0, ethers.utils.parseEther('130'))
      ).to.be.revertedWith("No enough token");
    });

    it("Should finish auction", async function () {
      await market.createItem("", addr1.address);
      await mERC1155.connect(addr1).setApprovalForAll(market.address, true);
      await mERC20.connect(addr2).approve(market.address, ethers.utils.parseEther('200'));            
      await mERC20.connect(addr3).approve(market.address, ethers.utils.parseEther('200'));                  
      await market.connect(addr1).listItemOnAuction(0, ethers.utils.parseEther('10'));
      await market.connect(addr2).makeBid(0, ethers.utils.parseEther('15'));
      await market.connect(addr3).makeBid(0, ethers.utils.parseEther('20'));   
      await ethers.provider.send('evm_increaseTime', [60*60*24*5 + 10]);   
      await market.connect(addr1).finishAuction(0);
      const addr1BalanceE = await mERC20.balanceOf(addr1.address);
      expect(addr1BalanceE).to.equal(ethers.utils.parseEther('120'));      
      const addr3BalanceE = await mERC20.balanceOf(addr3.address);
      expect(addr3BalanceE).to.equal(ethers.utils.parseEther('80'));   
      const mBalance = await mERC1155.balanceOf(addr3.address, 0);      
      expect(mBalance).to.equal(1);      
    });

    it("Should finish auction with less 2 bids", async function () {
      await market.createItem("", addr1.address);
      await mERC1155.connect(addr1).setApprovalForAll(market.address, true);
      await mERC20.connect(addr2).approve(market.address, ethers.utils.parseEther('200'));            
      await mERC20.connect(addr3).approve(market.address, ethers.utils.parseEther('200'));                  
      await market.connect(addr1).listItemOnAuction(0, ethers.utils.parseEther('10'));
      await market.connect(addr2).makeBid(0, ethers.utils.parseEther('15'));
      await ethers.provider.send('evm_increaseTime', [60*60*24*5 + 10]);   
      await market.connect(addr1).finishAuction(0);
      const addr2BalanceE = await mERC20.balanceOf(addr2.address);
      expect(addr2BalanceE).to.equal(ethers.utils.parseEther('100'));      
      const mBalance = await mERC1155.balanceOf(addr1.address, 0);      
      expect(mBalance).to.equal(1);      
    });

    it("Should fail finish auction (less 3 days)", async function () {
      await market.createItem("", addr1.address);
      await mERC1155.connect(addr1).setApprovalForAll(market.address, true);
      await mERC20.connect(addr2).approve(market.address, ethers.utils.parseEther('200'));            
      await mERC20.connect(addr3).approve(market.address, ethers.utils.parseEther('200'));                  
      await market.connect(addr1).listItemOnAuction(0, ethers.utils.parseEther('10'));
      await expect(
        market.connect(addr1).finishAuction(0)
      ).to.be.revertedWith("Minimum 3 days");
    });

    it("Should cancel auction", async function () {
      await market.createItem("", addr1.address);
      await mERC1155.connect(addr1).setApprovalForAll(market.address, true);
      await market.connect(addr1).listItemOnAuction(0, ethers.utils.parseEther('10'));
      await market.connect(addr1).cancelAuction(0);
      const mBalance = await mERC1155.balanceOf(addr1.address, 0);      
      expect(mBalance).to.equal(1);      
    });

    it("Should fail cancel auction with bid", async function () {
      await market.createItem("", addr1.address);
      await mERC1155.connect(addr1).setApprovalForAll(market.address, true);
      await market.connect(addr1).listItemOnAuction(0, ethers.utils.parseEther('10'));
      await mERC20.connect(addr2).approve(market.address, ethers.utils.parseEther('200'));                  
      await market.connect(addr2).makeBid(0, ethers.utils.parseEther('15'));      
      await expect(
        market.connect(addr1).cancelAuction(0)
      ).to.be.revertedWith("Already bid");
    });


  });

});