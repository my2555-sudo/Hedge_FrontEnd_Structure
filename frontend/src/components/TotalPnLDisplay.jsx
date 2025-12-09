export default function TotalPnLDisplay({ value }) {
  const cls = value >= 0 ? "PnlGood" : "PnlBad";
  const sign = value >= 0 ? "+" : "";
  const emoji = value >= 0 ? "📈" : "📉";
  return (
    <div className="Total">
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span>{emoji}</span>
        <span>Total P/L:</span>
      </div>
      <div className={cls} style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "4px",
        fontSize: "18px"
      }}>
        {sign}${Math.abs(value).toFixed(2)}
      </div>
    </div>
  );
}
