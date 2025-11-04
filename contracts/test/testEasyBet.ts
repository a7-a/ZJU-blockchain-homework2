import { expect } from "chai";
import { ethers } from "hardhat";

describe("EasyBet", function () {
  it("Should create project, place bets, trade tickets and settle", async function () {
    const [judge, player1, player2] = await ethers.getSigners();

    // 部署合约
    const BetToken = await ethers.getContractFactory("BetToken");
    const betToken = await BetToken.deploy();
    
    const BetNFT = await ethers.getContractFactory("BetNFT");
    const betNFT = await BetNFT.deploy();
    
    const EasyBet = await ethers.getContractFactory("EasyBet");
    const easyBet = await EasyBet.deploy(await betToken.getAddress(), await betNFT.getAddress());

    // 测试流程...
  });
});