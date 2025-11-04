// 使用你部署的实际合约地址替换这些
export const CONTRACT_ADDRESSES = {
  betToken: "0x0F946c91ED295785c607e1835C799a8269c4Ba6D",
  betNFT: "0x9CDC7159cD3258D76f0b1Cd6671e842fd22DCd81", 
  easyBet: "0x855E9a54C3DD52286aDA268228A8548255AAA344",
  judge: "0xF187778b108aE9572448841B987cb8627B8a1Fd9"
};

// 简化的 ABI（只包含前端需要的方法）
export const BET_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)",
  "function transferFrom(address from, address to, uint amount) returns (bool)",
  "function approve(address spender, uint amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint)",
  "function mint(address to, uint256 amount) external",
  "function faucet() external",
  "function owner() view returns (address)"
];

export const BET_NFT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function ownerOf(uint256) view returns (address)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function approve(address to, uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function mint(address to, uint256 projectId, uint256 optionId, uint256 amount) external returns (uint256)",
  "function getBetInfo(uint256 tokenId) external view returns (uint256 projectId, uint256 optionId, uint256 amount)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function owner() view returns (address)"
];

export const EASY_BET_ABI = [
  // 读取函数
  "function judge() view returns (address)",
  "function betToken() view returns (address)",
  "function betNFT() view returns (address)",
  "function projectCount() view returns (uint256)",
  "function orderCount() view returns (uint256)",
  
  // 项目相关
  "function createProject(string _title, string[] _options, uint256 _endTime) external",
  "function getProjectInfo(uint256 _projectId) external view returns (uint256 id, string title, string[] options, uint256 totalPool, uint256 endTime, uint8 status, uint256 winningOption, uint256[] optionPools)",
  "function getProjectTokenIds(uint256 _projectId) external view returns (uint256[])",
  "function getUserTicketsInProject(uint256 _projectId, address _user) external view returns (uint256[])",
  
  // 下注相关
  "function placeBet(uint256 _projectId, uint256 _optionId, uint256 _amount) external",
  
  // 订单相关
  "function createOrder(uint256 _tokenId, uint256 _price) external",
  "function fillOrder(uint256 _orderId) external",
  "function cancelOrder(uint256 _orderId) external",
  "function getActiveOrders() external view returns (tuple(uint256 tokenId, address seller, uint256 price, bool active)[])",
  "function getOrdersByToken(uint256 _tokenId) external view returns (tuple(uint256 tokenId, address seller, uint256 price, bool active))",
  
  // 结算相关
  "function settleProject(uint256 _projectId, uint256 _winningOption) external",
  
  // 映射和结构体查看
  "function projects(uint256) view returns (uint256 id, string title, uint256 totalPool, uint256 endTime, uint8 status, uint256 winningOption)",
  "function orders(uint256) view returns (uint256 tokenId, address seller, uint256 price, bool active)",
  "function tokenToOrder(uint256) view returns (uint256)"
];

export const CONTRACT_ABIS = {
  betToken: BET_TOKEN_ABI,
  betNFT: BET_NFT_ABI,
  easyBet: EASY_BET_ABI
};

// 项目状态枚举（与合约中对应）
export const ProjectStatus = {
  Active: 0,
  Finished: 1,
  Settled: 2
};

// 获取状态文本
export const getStatusText = (status: number): string => {
  switch (status) {
    case ProjectStatus.Active:
      return "进行中";
    case ProjectStatus.Finished:
      return "已结束";
    case ProjectStatus.Settled:
      return "已结算";
    default:
      return "未知";
  }
};

// 网络配置
export const NETWORK_CONFIG = {
  chainId: 1337, // Ganache 默认链ID
  chainName: "Ganache Local",
  rpcUrl: "http://127.0.0.1:7545"
};