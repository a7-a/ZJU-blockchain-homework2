// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BetNFT is ERC721, ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;
    
    struct BetInfo {
        uint256 projectId;
        uint256 optionId;
        uint256 amount;
    }
    
    mapping(uint256 => BetInfo) public betInfos;
    
    constructor() ERC721("EasyBet Ticket", "EBT") Ownable(msg.sender) {}
    
    function mint(address to, uint256 projectId, uint256 optionId, uint256 amount) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        betInfos[tokenId] = BetInfo(projectId, optionId, amount);
        return tokenId;
    }
    
    // 修改这个函数，返回多个值而不是结构体
    function getBetInfo(uint256 tokenId) external view returns (uint256 projectId, uint256 optionId, uint256 amount) {
        BetInfo memory info = betInfos[tokenId];
        return (info.projectId, info.optionId, info.amount);
    }
    
    // 保留获取结构体的函数
    function getBetInfoStruct(uint256 tokenId) external view returns (BetInfo memory) {
        return betInfos[tokenId];
    }
    
    // Override required functions for multiple inheritance
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }
    
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}