export default function TotalPnLDisplay({ value }) {
  const cls = value >= 0 ? "PnlGood" : "PnlBad";
  return (
    <div className="Total">
      <div>TOTAL</div>
      <div className={cls}>{value.toFixed(2)}</div>
    </div>
  );
}
