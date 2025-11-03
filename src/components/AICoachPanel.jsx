import { useMemo } from "react";
import { generateEventSummary } from "../data/mockFeedback.js";

export default function AICoachPanel({ 
  lastEvent, 
  totalPnL, 
  portfolio = [],
  recentTrades = [],
  tradesSinceLastEvent = 0,
  feedbackMode = "serious"
}) {
  // Analyze player reaction to the last event
  const playerReaction = useMemo(() => {
    if (!lastEvent) return null;
    
    const eventTrades = recentTrades.filter(
      t => t.eventId === lastEvent.runtimeId && 
      t.timestamp > (lastEvent.ts || 0) - 5000 // Trades within 5s of event
    );
    
    if (eventTrades.length === 0) {
      return "No action taken";
    }
    
    const sells = eventTrades.filter(t => t.action === "SELL").length;
    const buys = eventTrades.filter(t => t.action === "BUY").length;
    const totalVolume = eventTrades.reduce((sum, t) => sum + t.qty, 0);
    
    if (sells > buys && sells >= 2) {
      return "Rapid selling detected";
    } else if (buys > sells && buys >= 2) {
      return "Aggressive buying";
    } else if (sells > 0 && lastEvent.impactPct < -0.02) {
      return "Defensive selling";
    } else if (buys > 0 && lastEvent.impactPct > 0.02) {
      return "Momentum buying";
    } else {
      return `${eventTrades.length} trade(s) executed`;
    }
  }, [lastEvent, recentTrades]);

  // Generate event summary
  const eventSummary = useMemo(() => {
    return generateEventSummary(lastEvent, totalPnL);
  }, [lastEvent, totalPnL]);

  // Portfolio analysis
  const portfolioAnalysis = useMemo(() => {
    if (portfolio.length === 0) return null;
    
    const sectorCounts = {};
    portfolio.forEach(holding => {
      const sector = holding.sector || "Unknown";
      sectorCounts[sector] = (sectorCounts[sector] || 0) + (holding.shares * holding.price);
    });
    
    const totalValue = Object.values(sectorCounts).reduce((sum, val) => sum + val, 0);
    const sectors = Object.keys(sectorCounts).length;
    const dominantSector = Object.entries(sectorCounts)
      .sort((a, b) => b[1] - a[1])[0];
    const concentration = dominantSector ? (dominantSector[1] / totalValue) : 0;
    
    return {
      sectors,
      dominantSector: dominantSector ? dominantSector[0] : "N/A",
      concentration: (concentration * 100).toFixed(0)
    };
  }, [portfolio]);

  return (
    <div className="glass" style={{padding:"12px"}}>
      <div className="PanelTitle">
        AI COACH 
        <span style={{ fontSize: "10px", opacity: 0.7, marginLeft: "8px" }}>
          {feedbackMode === "serious" ? "📊" : "🎮"}
        </span>
      </div>
      <div style={{padding:"8px 12px"}}>
        {/* Event Summary */}
        {lastEvent ? (
          <>
            <div style={{opacity:.8, fontSize:11, marginBottom:4, fontWeight:"bold"}}>
              {lastEvent.type} • {(lastEvent.impactPct*100).toFixed(1)}% Impact
            </div>
            <div style={{fontSize:12, marginBottom:6, color:"#e0e0e0"}}>
              {lastEvent.title}
            </div>
            <div style={{fontSize:11, marginBottom:8, opacity:.85, fontStyle:"italic"}}>
              {eventSummary}
            </div>
          </>
        ) : (
          <div style={{fontSize:12, marginBottom:8, opacity:.7}}>
            Waiting for first signal...
          </div>
        )}

        {/* Player Reaction Analysis */}
        {lastEvent && playerReaction && (
          <div style={{
            marginTop:8,
            marginBottom:8,
            padding:"6px 8px",
            background:"rgba(255,255,255,0.05)",
            borderRadius:4,
            fontSize:11
          }}>
            <div style={{opacity:.9, marginBottom:2}}>📊 Your Reaction:</div>
            <div style={{fontWeight:"bold", color:"var(--accent)"}}>{playerReaction}</div>
            {tradesSinceLastEvent > 0 && (
              <div style={{fontSize:10, opacity:.7, marginTop:4}}>
                {tradesSinceLastEvent} trade(s) since event
              </div>
            )}
          </div>
        )}

        {/* Portfolio Summary */}
        {portfolioAnalysis && (
          <div style={{
            marginTop:8,
            fontSize:10,
            opacity:.75,
            paddingTop:8,
            borderTop:"1px solid rgba(255,255,255,0.1)"
          }}>
            Portfolio: {portfolioAnalysis.sectors} sectors • 
            Top: {portfolioAnalysis.dominantSector} ({portfolioAnalysis.concentration}%)
          </div>
        )}

        {/* P/L Display */}
        <div style={{marginTop:8, fontSize:12, opacity:.85}}>
          Session P/L: <b style={{color: totalPnL>=0 ? "var(--good)" : "var(--bad)"}}>
            {totalPnL>=0 ? "+" : ""}{totalPnL.toFixed(2)}
          </b>
        </div>
      </div>
    </div>
  );
}
