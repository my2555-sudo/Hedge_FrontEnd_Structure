export default function AICoachPanel({ lastEvent, totalPnL }) {
  const tip = !lastEvent
    ? "Stay patient. A Black Swan might appear..."
    : (lastEvent.impactPct < 0
        ? "Consider trimming high-beta names during rate shocks."
        : "Momentum tailwind — but beware over-concentration.");

  return (
    <div className="glass" style={{padding:"12px"}}>
      <div className="PanelTitle">AI COACH</div>
      <div style={{padding:"8px 12px"}}>
        <div style={{opacity:.8, fontSize:12, marginBottom:6}}>
          {lastEvent ? `${lastEvent.type} • ${(lastEvent.impactPct*100).toFixed(1)}%` : "No event yet"}
        </div>
        <div style={{marginBottom:8}}>{lastEvent ? lastEvent.title : "Waiting for first signal..."}</div>
        <div style={{fontStyle:"italic"}}>Tip: {tip}</div>
        <div style={{marginTop:8, fontSize:12, opacity:.75}}>
          Session P/L: <b style={{color: totalPnL>=0 ? "var(--good)" : "var(--bad)"}}>{totalPnL.toFixed(2)}</b>
        </div>
      </div>
    </div>
  );
}
