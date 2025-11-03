import { useState } from "react";

export default function TradeControls({ tickers, positions = {}, onTrade, disabled }) {
  const [ticker, setTicker] = useState(tickers?.[0] || "");
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState(""); // 新增：存储错误提示文本

  // ✅ 新增：带校验的交易函数
  function tryTrade(kind) {
    setErr("");
    if (!ticker) return setErr("Pick a ticker first");
    if (qty < 1) return setErr("Quantity must be at least 1");

    // 卖出校验
    if (kind === "SELL") {
      const pos = positions[ticker] ?? 0; // 当前持仓
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
        className="Button"
        disabled={disabled}
        onClick={() => tryTrade("BUY")}
      >
        Buy
      </button>

      <button
        className="Button"
        disabled={disabled}
        onClick={() => tryTrade("SELL")}
      >
        Sell
      </button>

      {/* 错误提示信息 */}
      {err && (
        <div style={{ gridColumn: "1 / -1", color: "#fb7185", fontSize: 12 }}>
          {err}
        </div>
      )}
    </div>
  );
}
