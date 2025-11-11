export default function PortfolioTable({ rows, flashTicker }) {
  return (
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

          // ✅ 新增：当 ticker === flashTicker 时，整行加高亮动画类
          const rowClass = r.ticker === flashTicker ? "flash-row" : "";

          return (
            <tr key={r.ticker} className={rowClass}>
              <td>{r.ticker}</td>
              <td>{r.shares}</td>
              <td>{r.avgPrice.toFixed(2)}</td>
              <td>{r.price.toFixed(2)}</td>
              <td className={pnlClass}>{pnl.toFixed(2)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

