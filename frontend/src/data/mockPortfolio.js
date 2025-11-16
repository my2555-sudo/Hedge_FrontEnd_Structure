// src/data/mockPortfolio.js

// Note: Keep field naming consistent with existing components:
// ticker: Stock ticker symbol
// shares: Initial holdings
// avgPrice: Average cost basis
// price: Current price (modified by event impacts)
// sector: Industry sector tag (for sector-specific impacts)
export const initialPortfolio = [
  // —— Tech (Growth/High Beta) ——
  { ticker: "AAPL", shares: 20, avgPrice: 150.00, price: 151.80, sector: "Tech" },
  { ticker: "MSFT", shares: 12, avgPrice: 310.00, price: 312.40, sector: "Tech" },
  { ticker: "NVDA", shares: 6,  avgPrice: 1080.00, price: 1092.50, sector: "Tech" },

  // —— Auto / Discretionary (High volatility, rate-sensitive) ——
  { ticker: "TSLA", shares: 10, avgPrice: 220.00, price: 221.70, sector: "Auto" },

  // —— Energy (Affected by oil prices/OPEC events) ——
  { ticker: "XOM",  shares: 15, avgPrice: 115.00, price: 115.60, sector: "Energy" },

  // —— Financials (Sensitive to rate hikes/yield curve) ——
  { ticker: "JPM",  shares: 14, avgPrice: 195.00, price: 196.10, sector: "Financials" },

  // —— Consumer Staples (Defensive/Low volatility) ——
  { ticker: "WMT",  shares: 18, avgPrice: 165.00, price: 165.90, sector: "Consumer" },

  // —— Healthcare (Many events: drug approvals, clinical trials, M&A) ——
  { ticker: "JNJ",  shares: 10, avgPrice: 158.00, price: 158.70, sector: "Healthcare" },
];

// (Optional) If you want to use the full sector list elsewhere:
export const sectors = ["Tech", "Auto", "Energy", "Financials", "Consumer", "Healthcare"];
