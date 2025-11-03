// src/data/mockPortfolio.js

// 说明：保持与你现有组件一致的字段命名：
// ticker: 股票代码
// shares: 初始持仓
// avgPrice: 持仓成本
// price: 当前价格（会被事件冲击修改）
// sector: 行业标签（方便做“分行业冲击”）
export const initialPortfolio = [
  // —— Tech（成长/高贝塔）——
  { ticker: "AAPL", shares: 20, avgPrice: 150.00, price: 151.80, sector: "Tech" },
  { ticker: "MSFT", shares: 12, avgPrice: 310.00, price: 312.40, sector: "Tech" },
  { ticker: "NVDA", shares: 6,  avgPrice: 1080.00, price: 1092.50, sector: "Tech" },

  // —— Auto / Discretionary（高波动、对利率敏感）——
  { ticker: "TSLA", shares: 10, avgPrice: 220.00, price: 221.70, sector: "Auto" },

  // —— Energy（受油价/OPEC 事件影响）——
  { ticker: "XOM",  shares: 15, avgPrice: 115.00, price: 115.60, sector: "Energy" },

  // —— Financials（对加息/收益率曲线敏感）——
  { ticker: "JPM",  shares: 14, avgPrice: 195.00, price: 196.10, sector: "Financials" },

  // —— Consumer Staples（防御性/抗波动）——
  { ticker: "WMT",  shares: 18, avgPrice: 165.00, price: 165.90, sector: "Consumer" },

  // —— Healthcare（事件多：药审/临床/并购）——
  { ticker: "JNJ",  shares: 10, avgPrice: 158.00, price: 158.70, sector: "Healthcare" },
];

// （可选）如果你想在别处用到所有行业列表：
export const sectors = ["Tech", "Auto", "Energy", "Financials", "Consumer", "Healthcare"];
