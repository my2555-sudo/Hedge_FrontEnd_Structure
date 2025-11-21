import { useState, useMemo } from "react";

export default function TradeControls({ tickers, positions = {}, onTrade, disabled, portfolio = [], cash = 0 }) {
  const [ticker, setTicker] = useState(tickers?.[0] || "");
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState(""); // Store error message text

  // Find current price for selected ticker
  const currentStock = useMemo(() => {
    return portfolio.find(p => p.ticker === ticker);
  }, [portfolio, ticker]);

  // Calculate cost/earnings
  const tradeAmount = useMemo(() => {
    if (!currentStock || qty < 1) return null;
    return currentStock.price * qty;
  }, [currentStock, qty]);

  // Check if user has enough cash for buy
  const hasEnoughCash = useMemo(() => {
    if (!tradeAmount) return true;
    return cash >= tradeAmount;
  }, [cash, tradeAmount]);

  // Trade function with validation
  function tryTrade(kind) {
    setErr("");
    if (!ticker) return setErr("Pick a ticker first");
    if (qty < 1) return setErr("Quantity must be at least 1");

    // Sell validation
    if (kind === "SELL") {
      const pos = positions[ticker] ?? 0; // Current position
      if (qty > pos) return setErr(`You only hold ${pos} share(s) of ${ticker}`);
    }

    onTrade({ ticker, action: kind, qty });
  }

  return (
    <div className="Controls">
      {/* select stock */}
      <select value={ticker} onChange={e => setTicker(e.target.value)}>
        {tickers.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      {/* enter quantity */}
      <input
        type="number"
        min="1"
        value={qty}
        onChange={e => setQty(+e.target.value)}
      />

      {/* click Buy/Sell button */}
      <button
        className="Button Button-buy"
        disabled={disabled}
        onClick={() => tryTrade("BUY")}
      >
        Buy
      </button>

      <button
        className="Button Button-sell"
        disabled={disabled}
        onClick={() => tryTrade("SELL")}
      >
        Sell
      </button>

      {/* Trade Amount Display */}
      {currentStock && tradeAmount && (
        <div className="TradeAmountDisplay" style={{ gridColumn: "1 / -1" }}>
          <span className="TradeAmountLabel">Trade Amount:</span>
          <span className={`TradeAmountValue ${!hasEnoughCash ? 'insufficient-funds' : ''}`}>
            ${tradeAmount.toFixed(2)}
            {!hasEnoughCash && <span className="warning-text"> (Insufficient funds)</span>}
          </span>
        </div>
      )}

      {/* Error message */}
      {err && (
        <div style={{ gridColumn: "1 / -1", color: "#fb7185", fontSize: 12 }}>
          {err}
        </div>
      )}
    </div>
  );
}
