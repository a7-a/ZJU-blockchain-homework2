import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // 部署ERC20代币
  console.log("\n1. Deploying BetToken...");
  const BetToken = await ethers.getContractFactory("BetToken");
  const betToken = await BetToken.deploy();
  await betToken.deployed();
  console.log("BetToken deployed to:", betToken.address);

  // 部署ERC721 NFT
  console.log("\n2. Deploying BetNFT...");
  const BetNFT = await ethers.getContractFactory("BetNFT");
  const betNFT = await BetNFT.deploy();
  await betNFT.deployed();
  console.log("BetNFT deployed to:", betNFT.address);

  // 部署主合约
  console.log("\n3. Deploying EasyBet...");
  const EasyBet = await ethers.getContractFactory("EasyBet");
  const easyBet = await EasyBet.deploy(betToken.address, betNFT.address);
  await easyBet.deployed();
  console.log("EasyBet deployed to:", easyBet.address);

  // 设置NFT的owner为主合约
  console.log("\n4. Transferring NFT ownership to EasyBet...");
  const transferTx = await betNFT.transferOwnership(easyBet.address);
  await transferTx.wait();
  console.log("NFT ownership transferred to EasyBet contract");

  // 给部署者一些初始代币用于测试（使用更小的数字避免溢出）
  console.log("\n5. Minting initial tokens to deployer...");
  const mintAmount = ethers.utils.parseEther("10000"); // 10000 BET tokens
  const mintTx = await betToken.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log("Minted 10000 BET tokens to deployer");

  console.log("\n=== Deployment Completed ===");
  console.log("BetToken:", betToken.address);
  console.log("BetNFT:", betNFT.address);
  console.log("EasyBet:", easyBet.address);
  console.log("Judge:", deployer.address);

  // 保存合约地址到文件，供前端使用
  const addresses = {
    betToken: betToken.address,
    betNFT: betNFT.address,
    easyBet: easyBet.address,
    judge: deployer.address
  };
  
  console.log("\nContract addresses for frontend:", JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});