// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BetToken is ERC20, Ownable {
    constructor() ERC20("Bet Token", "BET") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**18); // 初始发行100万代币
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    function faucet() external {
        _mint(msg.sender, 100 * 10**18); // 每个用户可领取100代币
    }
}