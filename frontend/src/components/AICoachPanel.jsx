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
    <div className="glass" style={{padding:"10px"}}>
      <div className="PanelTitle">
        AI COACH 
        <span style={{ fontSize: "9px", opacity: 0.7, marginLeft: "6px" }}>
          {feedbackMode === "serious" ? "📊" : "🎮"}
        </span>
      </div>
      <div style={{padding:"6px 10px"}}>
        {/* Event Summary */}
        {lastEvent ? (
          <>
            <div style={{opacity:.8, fontSize:10, marginBottom:3, fontWeight:"600"}}>
              {lastEvent.type} • {(lastEvent.impactPct*100).toFixed(1)}% Impact
            </div>
            <div style={{fontSize:10, marginBottom:6, opacity:.85, fontStyle:"italic"}}>
              {eventSummary}
            </div>
          </>
        ) : (
          <div style={{fontSize:11, marginBottom:6, opacity:.7}}>
            Waiting for first signal...
          </div>
        )}

        {/* Player Reaction Analysis */}
        {lastEvent && playerReaction && (
          <div style={{
            marginTop:6,
            marginBottom:6,
            padding:"5px 6px",
            background:"rgba(255,255,255,0.04)",
            borderRadius:4,
            fontSize:10,
            border:"1px solid var(--border)"
          }}>
            <div style={{opacity:.9, marginBottom:2, fontSize:9}}>📊 Your Reaction:</div>
            <div style={{fontWeight:"600", color:"var(--accent)", fontSize:10}}>{playerReaction}</div>
            {tradesSinceLastEvent > 0 && (
              <div style={{fontSize:9, opacity:.7, marginTop:3}}>
                {tradesSinceLastEvent} trade(s) since event
              </div>
            )}
          </div>
        )}

        {/* Portfolio Summary */}
        {portfolioAnalysis && (
          <div style={{
            marginTop:6,
            fontSize:9,
            opacity:.75,
            paddingTop:6,
            borderTop:"1px solid var(--border)"
          }}>
            Portfolio: {portfolioAnalysis.sectors} sectors • 
            Top: {portfolioAnalysis.dominantSector} ({portfolioAnalysis.concentration}%)
          </div>
        )}

        {/* P/L Display */}
        <div style={{marginTop:6, fontSize:11, opacity:.85}}>
          Session P/L: <b style={{color: totalPnL>=0 ? "var(--good)" : "var(--bad)"}}>
            {totalPnL>=0 ? "+" : ""}{totalPnL.toFixed(2)}
          </b>
        </div>
      </div>
    </div>
  );
}
