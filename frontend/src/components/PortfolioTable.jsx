export default function PortfolioTable({ rows, flashTicker, cash = 0 }) {
  // Calculate total holdings value
  const totalHoldingsValue = rows.reduce((sum, r) => sum + (r.price * r.shares), 0);
  const totalPortfolioValue = totalHoldingsValue + cash;

  return (
    <>
      <table className="PortTable">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Shares</th>
            <th>Avg</th>
            <th>Price</th>
            <th>P/L</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => {
            const pnl = (r.price - r.avgPrice) * r.shares;
            const pnlClass = pnl >= 0 ? "PnlGood" : "PnlBad";
            
            // Determine if price went up or down compared to average
            const priceChange = r.price - r.avgPrice;
            const priceClass = priceChange > 0 ? "PnlGood" : priceChange < 0 ? "PnlBad" : "";

            // Add highlight animation class when ticker === flashTicker
            const rowClass = r.ticker === flashTicker ? "flash-row" : "";

            return (
              <tr key={r.ticker} className={rowClass}>
                <td>{r.ticker}</td>
                <td>{r.shares}</td>
                <td>{r.avgPrice.toFixed(2)}</td>
                <td className={priceClass}>{r.price.toFixed(2)}</td>
                <td className={pnlClass}>{pnl.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Total Portfolio Value Row */}
      <div className="PortfolioTotal">
        <span className="PortfolioTotal-label">Total Portfolio Value:</span>
        <span className="PortfolioTotal-value">${totalPortfolioValue.toFixed(2)}</span>
      </div>
    </>
  );
}

