// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BetToken.sol";
import "./BetNFT.sol";

contract EasyBet {
    address public judge;
    BetToken public betToken;
    BetNFT public betNFT;
    
    enum ProjectStatus { Active, Finished, Settled }
    
    struct Project {
        uint256 id;
        string title;
        string[] options;
        uint256 totalPool;
        uint256 endTime;
        ProjectStatus status;
        uint256 winningOption;
        uint256[] tokenIds;
        mapping(uint256 => uint256) optionPool; // optionId => total amount
    }
    
    struct Order {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
    }
    
    struct BetInfo {
        uint256 projectId;
        uint256 optionId;
        uint256 amount;
    }
    
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Order) public orders; // orderId => Order
    mapping(uint256 => uint256) public tokenToOrder; // tokenId => orderId
    
    uint256 public projectCount;
    uint256 public orderCount;
    
    event ProjectCreated(uint256 projectId, string title, uint256 endTime);
    event BetPlaced(uint256 projectId, uint256 optionId, uint256 tokenId, address player, uint256 amount);
    event OrderCreated(uint256 orderId, uint256 tokenId, uint256 price);
    event OrderFilled(uint256 orderId, address buyer);
    event OrderCancelled(uint256 orderId);
    event ProjectSettled(uint256 projectId, uint256 winningOption);
    
    modifier onlyJudge() {
        require(msg.sender == judge, "Only judge can call this");
        _;
    }
    
    constructor(address _betToken, address _betNFT) {
        judge = msg.sender;
        betToken = BetToken(_betToken);
        betNFT = BetNFT(_betNFT);
    }
    
    function createProject(
        string memory _title, 
        string[] memory _options, 
        uint256 _endTime
    ) external onlyJudge {
        require(_options.length >= 2, "At least 2 options required");
        require(_endTime > block.timestamp, "End time must be in future");
        
        projectCount++;
        Project storage project = projects[projectCount];
        
        project.id = projectCount;
        project.title = _title;
        project.options = _options;
        project.endTime = _endTime;
        project.status = ProjectStatus.Active;
        
        // 公证人提供初始奖池
        uint256 initialPool = 1000 * 10**18;
        require(
            betToken.transferFrom(msg.sender, address(this), initialPool),
            "Initial pool transfer failed"
        );
        project.totalPool = initialPool;
        
        emit ProjectCreated(projectCount, _title, _endTime);
    }
    
    function placeBet(
        uint256 _projectId, 
        uint256 _optionId, 
        uint256 _amount
    ) external {
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.Active, "Project not active");
        require(block.timestamp < project.endTime, "Betting period ended");
        require(_optionId < project.options.length, "Invalid option");
        require(_amount >= 10**18, "Minimum bet amount is 1 token");
        
        // 转移代币
        require(
            betToken.transferFrom(msg.sender, address(this), _amount),
            "Token transfer failed"
        );
        
        // 更新奖池
        project.totalPool += _amount;
        project.optionPool[_optionId] += _amount;
        
        // 铸造NFT
        uint256 tokenId = betNFT.mint(msg.sender, _projectId, _optionId, _amount);
        project.tokenIds.push(tokenId);
        
        emit BetPlaced(_projectId, _optionId, tokenId, msg.sender, _amount);
    }
    
    function createOrder(uint256 _tokenId, uint256 _price) external {
        require(betNFT.ownerOf(_tokenId) == msg.sender, "Not token owner");
        require(tokenToOrder[_tokenId] == 0, "Order already exists");
        require(_price > 0, "Price must be greater than 0");
        
        orderCount++;
        orders[orderCount] = Order(_tokenId, msg.sender, _price, true);
        tokenToOrder[_tokenId] = orderCount;
        
        // 授权NFT转移
        betNFT.approve(address(this), _tokenId);
        
        emit OrderCreated(orderCount, _tokenId, _price);
    }
    
    function cancelOrder(uint256 _orderId) external {
        Order storage order = orders[_orderId];
        require(order.active, "Order not active");
        require(order.seller == msg.sender, "Not order owner");
        
        order.active = false;
        tokenToOrder[order.tokenId] = 0;
        
        emit OrderCancelled(_orderId);
    }
    
    function fillOrder(uint256 _orderId) external {
        Order storage order = orders[_orderId];
        require(order.active, "Order not active");
        require(order.seller != msg.sender, "Cannot buy your own order");
        
        // 转移代币给卖家
        require(
            betToken.transferFrom(msg.sender, order.seller, order.price),
            "Payment transfer failed"
        );
        
        // 转移NFT给买家
        betNFT.transferFrom(order.seller, msg.sender, order.tokenId);
        
        order.active = false;
        tokenToOrder[order.tokenId] = 0;
        
        emit OrderFilled(_orderId, msg.sender);
    }
    
    function settleProject(uint256 _projectId, uint256 _winningOption) external onlyJudge {
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.Active, "Project not active");
        require(block.timestamp >= project.endTime, "Project not ended");
        require(_winningOption < project.options.length, "Invalid winning option");
        
        project.status = ProjectStatus.Finished;
        project.winningOption = _winningOption;
        
        uint256 winningPool = project.optionPool[_winningOption];
        
        if (winningPool > 0) {
            uint256 totalWinningAmount = project.totalPool;
            
            // 计算每个彩票的奖励比例
            for (uint256 i = 0; i < project.tokenIds.length; i++) {
                uint256 tokenId = project.tokenIds[i];
                (uint256 projectId, uint256 optionId, uint256 amount) = betNFT.getBetInfo(tokenId);
                
                if (optionId == _winningOption) {
                    address owner = betNFT.ownerOf(tokenId);
                    uint256 reward = (amount * totalWinningAmount) / winningPool;
                    require(
                        betToken.transfer(owner, reward),
                        "Reward transfer failed"
                    );
                }
            }
        }
        
        project.status = ProjectStatus.Settled;
        emit ProjectSettled(_projectId, _winningOption);
    }
    
    function getProjectInfo(uint256 _projectId) external view returns (
        uint256 id,
        string memory title,
        string[] memory options,
        uint256 totalPool,
        uint256 endTime,
        ProjectStatus status,
        uint256 winningOption,
        uint256[] memory optionPools
    ) {
        Project storage project = projects[_projectId];
        optionPools = new uint256[](project.options.length);
        
        for (uint256 i = 0; i < project.options.length; i++) {
            optionPools[i] = project.optionPool[i];
        }
        
        return (
            project.id,
            project.title,
            project.options,
            project.totalPool,
            project.endTime,
            project.status,
            project.winningOption,
            optionPools
        );
    }
    
    function getActiveOrders() external view returns (Order[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= orderCount; i++) {
            if (orders[i].active) {
                activeCount++;
            }
        }
        
        Order[] memory activeOrders = new Order[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= orderCount; i++) {
            if (orders[i].active) {
                activeOrders[index] = orders[i];
                index++;
            }
        }
        
        return activeOrders;
    }
    
    function getOrdersByToken(uint256 _tokenId) external view returns (Order memory) {
        uint256 orderId = tokenToOrder[_tokenId];
        require(orderId != 0, "No order for this token");
        return orders[orderId];
    }
    
    function getProjectTokenIds(uint256 _projectId) external view returns (uint256[] memory) {
        return projects[_projectId].tokenIds;
    }
    
    // 获取用户在该项目中的彩票
    function getUserTicketsInProject(uint256 _projectId, address _user) external view returns (uint256[] memory) {
        Project storage project = projects[_projectId];
        uint256[] memory tempTokens = new uint256[](project.tokenIds.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < project.tokenIds.length; i++) {
            uint256 tokenId = project.tokenIds[i];
            if (betNFT.ownerOf(tokenId) == _user) {
                tempTokens[count] = tokenId;
                count++;
            }
        }
        
        uint256[] memory userTokens = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            userTokens[i] = tempTokens[i];
        }
        
        return userTokens;
    }
}