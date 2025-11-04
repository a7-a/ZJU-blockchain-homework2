import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS, ProjectStatus, getStatusText } from './config/contracts';
import './App.css';

declare global {
  interface Window {
    ethereum: any;
  }
}

function App() {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string>("");
  const [contracts, setContracts] = useState<any>({});
  const [balance, setBalance] = useState<string>("0");
  const [projects, setProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("projects");
  const [isJudge, setIsJudge] = useState<boolean>(false);
  const [newProjectTitle, setNewProjectTitle] = useState<string>("");
  const [newProjectOptions, setNewProjectOptions] = useState<string>("");
  const [newProjectDuration, setNewProjectDuration] = useState<number>(24);
  const [allowance, setAllowance] = useState<string>("0");
  const [isApproved, setIsApproved] = useState<boolean>(false);

  useEffect(() => {
    initWeb3();
  }, []);

  const initWeb3 = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const signer = provider.getSigner();
        setSigner(signer);
        
        const account = await signer.getAddress();
        setAccount(account);
        
        // 检查是否是公证人
        const isJudgeAccount = account.toLowerCase() === CONTRACT_ADDRESSES.judge.toLowerCase();
        setIsJudge(isJudgeAccount);
        
        // 初始化合约实例
        const betToken = new ethers.Contract(
          CONTRACT_ADDRESSES.betToken, 
          CONTRACT_ABIS.betToken, 
          signer
        );
        
        const betNFT = new ethers.Contract(
          CONTRACT_ADDRESSES.betNFT,
          CONTRACT_ABIS.betNFT,
          signer
        );
        
        const easyBet = new ethers.Contract(
          CONTRACT_ADDRESSES.easyBet,
          CONTRACT_ABIS.easyBet,
          signer
        );
        
        setContracts({ betToken, betNFT, easyBet });
        
        // 获取余额
        const tokenBalance = await betToken.balanceOf(account);
        setBalance(ethers.utils.formatEther(tokenBalance));
        
        // 检查授权额度（如果是公证人）
        if (isJudgeAccount) {
          const currentAllowance = await betToken.allowance(account, CONTRACT_ADDRESSES.easyBet);
          setAllowance(ethers.utils.formatEther(currentAllowance));
          setIsApproved(parseFloat(ethers.utils.formatEther(currentAllowance)) >= 1000);
        }
        
        // 加载项目
        await loadProjects(easyBet);
        
      } catch (error) {
        console.error("Error initializing Web3:", error);
        alert("连接钱包失败");
      }
    } else {
      alert("请安装 MetaMask!");
    }
  };

  const loadProjects = async (easyBet: any) => {
    try {
      const count = await easyBet.projectCount();
      const projectsList = [];
      
      for (let i = 1; i <= count; i++) {
        const project = await easyBet.getProjectInfo(i);
        projectsList.push({
          id: project.id.toString(),
          title: project.title,
          options: project.options,
          totalPool: ethers.utils.formatEther(project.totalPool),
          endTime: new Date(project.endTime * 1000).toLocaleString(),
          status: getStatusText(project.status),
          winningOption: project.winningOption.toString(),
          optionPools: project.optionPools.map((pool: any) => ethers.utils.formatEther(pool))
        });
      }
      
      setProjects(projectsList);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const faucet = async () => {
    if (contracts.betToken) {
      try {
        const tx = await contracts.betToken.faucet();
        await tx.wait();
        alert("成功领取100 BET代币!");
        
        // 刷新余额
        const tokenBalance = await contracts.betToken.balanceOf(account);
        setBalance(ethers.utils.formatEther(tokenBalance));
      } catch (error: any) {
        console.error("Faucet error:", error);
        alert("领取代币失败: " + (error.message || "未知错误"));
      }
    }
  };

  // 授权代币给合约
  const approveTokens = async () => {
    if (contracts.betToken && contracts.easyBet) {
      try {
        const requiredAmount = ethers.utils.parseEther("10000"); // 授权 10000 BET
        const tx = await contracts.betToken.approve(CONTRACT_ADDRESSES.easyBet, requiredAmount);
        await tx.wait();
        
        // 更新授权状态
        const currentAllowance = await contracts.betToken.allowance(account, CONTRACT_ADDRESSES.easyBet);
        setAllowance(ethers.utils.formatEther(currentAllowance));
        setIsApproved(true);
        
        alert("授权成功！现在可以创建项目了");
      } catch (error: any) {
        console.error("授权失败:", error);
        alert("授权失败: " + (error.message || "未知错误"));
      }
    }
  };

  // 检查授权状态
  const checkAllowance = async () => {
    if (contracts.betToken && isJudge) {
      try {
        const currentAllowance = await contracts.betToken.allowance(account, CONTRACT_ADDRESSES.easyBet);
        setAllowance(ethers.utils.formatEther(currentAllowance));
        setIsApproved(parseFloat(ethers.utils.formatEther(currentAllowance)) >= 1000);
        alert(`当前授权额度: ${ethers.utils.formatEther(currentAllowance)} BET`);
      } catch (error: any) {
        console.error("检查授权失败:", error);
      }
    }
  };

  // 简单测试项目函数
  const testSimpleProject = async () => {
    if (contracts.easyBet && isJudge && isApproved) {
      try {
        console.log("开始创建简单测试项目...");
        
        // 使用最简单的参数，并指定 Gas Limit
        const tx = await contracts.easyBet.createProject(
          "简单测试项目",
          ["选项A", "选项B"],
          Math.floor(Date.now() / 1000) + 3600,
          {
            gasLimit: 500000
          }
        );
        
        console.log("交易已发送，等待确认...");
        await tx.wait();
        console.log("项目创建成功!");
        alert("测试项目创建成功!");
        
        // 刷新项目列表
        await loadProjects(contracts.easyBet);
      } catch (error: any) {
        console.error("详细错误信息:", error);
        alert("❌ 创建失败: " + (error.reason || error.message || "未知错误"));
      }
    } else if (!isApproved) {
      alert("❌ 请先授权 BET 代币给合约！");
    }
  };

  const createProject = async () => {
    if (contracts.easyBet && isJudge) {
      if (!isApproved) {
        alert("❌ 请先授权 BET 代币给合约！");
        return;
      }

      try {
        const options = newProjectOptions.split(',').map(opt => opt.trim()).filter(opt => opt);
        if (options.length < 2) {
          alert("请至少提供2个选项，用逗号分隔");
          return;
        }

        console.log("创建项目参数:", {
          title: newProjectTitle || "新竞猜项目",
          options: options,
          duration: newProjectDuration
        });

        const endTime = Math.floor(Date.now() / 1000) + (newProjectDuration * 3600);
        
        console.log("调用 createProject...");
        const tx = await contracts.easyBet.createProject(
          newProjectTitle || "新竞猜项目",
          options,
          endTime,
          {
            gasLimit: 500000
          }
        );
        console.log("交易已发送:", tx.hash);
        
        await tx.wait();
        alert("项目创建成功!");
        
        // 重置表单
        setNewProjectTitle("");
        setNewProjectOptions("");
        setNewProjectDuration(24);
        
        // 重新加载项目列表
        await loadProjects(contracts.easyBet);
      } catch (error: any) {
        console.error("Create project error details:", error);
        alert("创建项目失败: " + (error.reason || error.message || "未知错误"));
      }
    } else {
      alert("只有公证人可以创建项目");
    }
  };

  const placeBet = async (projectId: number, optionId: number, amount: string) => {
    if (contracts.easyBet) {
      try {
        const betAmount = ethers.utils.parseEther(amount);
        
        // 先授权
        const approveTx = await contracts.betToken.approve(CONTRACT_ADDRESSES.easyBet, betAmount);
        await approveTx.wait();
        
        // 下注
        const tx = await contracts.easyBet.placeBet(projectId, optionId, betAmount);
        await tx.wait();
        alert("下注成功!");
        
        // 刷新余额和项目信息
        const tokenBalance = await contracts.betToken.balanceOf(account);
        setBalance(ethers.utils.formatEther(tokenBalance));
        await loadProjects(contracts.easyBet);
        
      } catch (error: any) {
        console.error("Place bet error:", error);
        alert("下注失败: " + (error.message || "未知错误"));
      }
    }
  };

  const settleProject = async (projectId: number, winningOption: number) => {
    if (contracts.easyBet && isJudge) {
      try {
        const tx = await contracts.easyBet.settleProject(projectId, winningOption);
        await tx.wait();
        alert("项目结算成功!");
        
        // 重新加载项目列表
        await loadProjects(contracts.easyBet);
      } catch (error: any) {
        console.error("Settle project error:", error);
        alert("结算失败: " + (error.message || "未知错误"));
      }
    } else {
      alert("只有公证人可以结算项目");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎯 EasyBet - 去中心化彩票系统</h1>
        {account ? (
          <div className="account-info">
            <p>👤 账户: {account.slice(0, 6)}...{account.slice(-4)}</p>
            <p>💰 BET余额: {balance}</p>
            <p>{isJudge ? "🔑 公证人" : "👤 玩家"}</p>
            {isJudge && (
              <p>🔐 授权状态: {isApproved ? "✅ 已授权" : "❌ 未授权"}</p>
            )}
          </div>
        ) : (
          <button onClick={initWeb3} className="connect-btn">连接钱包</button>
        )}
      </header>

      <nav className="nav-tabs">
        <button 
          className={activeTab === "projects" ? "active" : ""} 
          onClick={() => setActiveTab("projects")}
        >
          竞猜项目
        </button>
        {isJudge && (
          <button 
            className={activeTab === "create" ? "active" : ""} 
            onClick={() => setActiveTab("create")}
          >
            创建项目
          </button>
        )}
        <button 
          className={activeTab === "wallet" ? "active" : ""} 
          onClick={() => setActiveTab("wallet")}
        >
          我的钱包
        </button>
      </nav>

      <div className="container">
        {activeTab === "projects" && (
          <section className="section">
            <h2>竞猜项目列表</h2>
            <button onClick={faucet} className="action-btn">领取测试代币</button>
            
            {projects.length === 0 ? (
              <p>暂无竞猜项目</p>
            ) : (
              projects.map(project => (
                <div key={project.id} className="project-card">
                  <h3>{project.title}</h3>
                  <p>状态: <span className={`status-${project.status}`}>{project.status}</span></p>
                  <p>总奖池: {project.totalPool} BET</p>
                  <p>结束时间: {project.endTime}</p>
                  <div className="options-section">
                    <strong>投注选项:</strong>
                    {project.options.map((option: string, index: number) => (
                      <div key={index} className="option-item">
                        <span>{option}: {project.optionPools[index]} BET</span>
                        {project.status === "进行中" && (
                          <button 
                            onClick={() => placeBet(parseInt(project.id), index, "10")}
                            className="bet-btn"
                          >
                            下注10 BET
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {isJudge && project.status === "已结束" && (
                    <div className="judge-actions">
                      <strong>公证人操作:</strong>
                      <div>
                        {project.options.map((option: string, index: number) => (
                          <button 
                            key={index}
                            onClick={() => settleProject(parseInt(project.id), index)}
                            className="settle-btn"
                          >
                            宣布 {option} 获胜
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        )}

        {activeTab === "create" && isJudge && (
          <section className="section">
            <h2>创建新竞猜项目</h2>
            
            {/* 授权步骤 */}
            {!isApproved ? (
              <div style={{marginBottom: '20px', padding: '15px', background: '#fff3cd', borderRadius: '5px', border: '1px solid #ffeaa7'}}>
                <h3>🔐 第一步：授权代币</h3>
                <p>创建项目需要授权 BET 代币给合约作为初始奖池</p>
                <button onClick={approveTokens} className="action-btn" style={{backgroundColor: '#ffc107', color: 'black'}}>
                  授权 BET 代币给合约
                </button>
                <button onClick={checkAllowance} className="action-btn" style={{backgroundColor: '#17a2b8', marginLeft: '10px'}}>
                  检查授权状态
                </button>
                <p style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                  当前授权额度: {allowance} BET | 状态: {isApproved ? '✅ 已授权' : '❌ 未授权'}
                </p>
              </div>
            ) : (
              <div style={{marginBottom: '20px', padding: '15px', background: '#d4edda', borderRadius: '5px', border: '1px solid #c3e6cb'}}>
                <h3>✅ 授权完成</h3>
                <p>当前授权额度: <strong>{allowance} BET</strong></p>
                <p style={{fontSize: '12px', color: '#666'}}>现在可以创建项目了！</p>
              </div>
            )}
            
            {/* 快速测试区域 */}
            {isApproved && (
              <div style={{marginBottom: '20px', padding: '15px', background: '#f0f8ff', borderRadius: '5px'}}>
                <h3>🚀 快速测试</h3>
                <button onClick={testSimpleProject} className="action-btn">
                  创建简单测试项目
                </button>
                <p style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                  使用预设参数测试创建功能（选项A vs 选项B，1小时后结束）
                </p>
              </div>
            )}
            
            {/* 创建项目表单 */}
            <div className="create-form">
              <div className="form-group">
                <label>项目标题:</label>
                <input 
                  type="text" 
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="例如: NBA总冠军预测"
                />
              </div>
              
              <div className="form-group">
                <label>竞猜选项 (用逗号分隔):</label>
                <input 
                  type="text" 
                  value={newProjectOptions}
                  onChange={(e) => setNewProjectOptions(e.target.value)}
                  placeholder="例如: 湖人队, 勇士队, 凯尔特人队"
                />
              </div>
              
              <div className="form-group">
                <label>竞猜时长 (小时):</label>
                <input 
                  type="number" 
                  value={newProjectDuration}
                  onChange={(e) => setNewProjectDuration(parseInt(e.target.value))}
                  min="1"
                  max="720"
                />
              </div>
              
              <button 
                onClick={createProject} 
                className="create-btn"
                disabled={!isApproved}
                style={{opacity: isApproved ? 1 : 0.5}}
              >
                {isApproved ? "创建项目" : "请先授权"}
              </button>
            </div>
          </section>
        )}

        {activeTab === "wallet" && (
          <section className="section">
            <h2>我的钱包</h2>
            <div className="wallet-info">
              <p>账户地址: {account}</p>
              <p>BET余额: {balance}</p>
              <button onClick={faucet} className="action-btn">领取测试代币</button>
              
              {isJudge && (
                <div style={{marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '5px'}}>
                  <p>授权状态: {isApproved ? '✅ 已授权' : '❌ 未授权'}</p>
                  <p>授权额度: {allowance} BET</p>
                  <button onClick={approveTokens} className="action-btn" style={{backgroundColor: '#28a745'}}>
                    授权 BET 代币
                  </button>
                </div>
              )}
              
              <div className="contract-addresses">
                <h3>合约地址:</h3>
                <p>BetToken: {CONTRACT_ADDRESSES.betToken}</p>
                <p>EasyBet主合约: {CONTRACT_ADDRESSES.easyBet}</p>
                <p>公证人地址: {CONTRACT_ADDRESSES.judge}</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;