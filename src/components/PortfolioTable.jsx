export default function PortfolioTable({ rows }) {
  return (
    <table className="PortTable">
      <thead>
        <tr>
          <th>Ticker</th><th>Shares</th><th>Avg</th><th>Price</th><th>P/L</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => {
          const pnl = (r.price - r.avgPrice) * r.shares;
          const cls = pnl >= 0 ? "PnlGood" : "PnlBad";
          return (
            <tr key={r.ticker}>
              <td>{r.ticker}</td>
              <td>{r.shares}</td>
              <td>{r.avgPrice.toFixed(2)}</td>
              <td>{r.price.toFixed(2)}</td>
              <td className={cls}>{pnl.toFixed(2)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
