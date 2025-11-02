import { useState } from "react";

export default function TradeControls({ tickers, onTrade, disabled }) {
  const [ticker, setTicker] = useState(tickers?.[0] || "");
  const [qty, setQty] = useState(1);

  return (
    <div className="Controls">
      <select value={ticker} onChange={e => setTicker(e.target.value)}>
        {tickers.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <input type="number" min="1" value={qty} onChange={e => setQty(+e.target.value)} />

      <button className="Button" disabled={!disabled ? false : true}
        onClick={() => onTrade({ ticker, action: "BUY", qty })}>
        Buy
      </button>

      <button className="Button" disabled={!disabled ? false : true}
        onClick={() => onTrade({ ticker, action: "SELL", qty })}>
        Sell
      </button>
    </div>
  );
}
