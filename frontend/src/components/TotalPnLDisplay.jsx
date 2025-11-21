export default function TotalPnLDisplay({ value }) {
  const cls = value >= 0 ? "PnlGood" : "PnlBad";
  const sign = value >= 0 ? "+" : "";
  return (
    <div className="Total">
      <div>Total P/L:</div>
      <div className={cls}>{sign}${value.toFixed(2)}</div>
    </div>
  );
}
