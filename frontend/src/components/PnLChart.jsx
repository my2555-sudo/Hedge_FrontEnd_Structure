import { useMemo, useState } from "react";

/**
 * PnLChart - Displays P/L trend chart
 * 
 * @param {Object} props
 * @param {number} props.totalPnL - Current total profit/loss
 * @param {Array} props.pnlHistory - Array of {timestamp, pnl} for trend visualization
 */
export default function PnLChart({ 
  totalPnL = 0,
  pnlHistory = []
}) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");

  // Filter P/L history by timeframe
  const filteredHistory = useMemo(() => {
    if (!pnlHistory || pnlHistory.length === 0) return [];
    
    const now = Date.now();
    const timeframes = {
      "5m": 5 * 60 * 1000,
      "15m": 15 * 60 * 1000,
      "30m": 30 * 60 * 1000,
      "all": Infinity
    };
    
    const cutoff = timeframes[selectedTimeframe] || Infinity;
    return pnlHistory.filter(entry => (now - entry.timestamp) <= cutoff);
  }, [pnlHistory, selectedTimeframe]);

  // Calculate P/L trend (simple linear trend)
  const trend = useMemo(() => {
    if (filteredHistory.length < 2) return "stable";
    const recent = filteredHistory.slice(0, 10); // Last 10 data points
    if (recent.length < 2) return "stable";
    
    const first = recent[recent.length - 1].pnl;
    const last = recent[0].pnl;
    const diff = last - first;
    const percent = Math.abs((diff / Math.abs(first || 1)) * 100);
    
    if (diff > 0 && percent > 5) return "upward";
    if (diff < 0 && percent > 5) return "downward";
    return "stable";
  }, [filteredHistory]);

  // Simple chart data points (max 20 points for visualization)
  const chartData = useMemo(() => {
    if (filteredHistory.length === 0) {
      // Create sample data if no history
      return Array.from({ length: 10 }, (_, i) => ({
        x: i,
        y: totalPnL * (1 + (i - 5) * 0.05) // Simulated trend
      }));
    }
    
    const maxPoints = 20;
    const step = Math.max(1, Math.floor(filteredHistory.length / maxPoints));
    return filteredHistory
      .filter((_, i) => i % step === 0 || i === 0 || i === filteredHistory.length - 1)
      .slice(0, maxPoints)
      .map((entry, idx) => ({
        x: idx,
        y: entry.pnl
      }));
  }, [filteredHistory, totalPnL]);

  // Find min/max for chart scaling
  const { minY, maxY } = useMemo(() => {
    if (chartData.length === 0) return { minY: 0, maxY: 100 };
    const values = chartData.map(d => d.y);
    return {
      minY: Math.min(...values, 0),
      maxY: Math.max(...values, 100)
    };
  }, [chartData]);

  return (
    <div className="glass" style={{ padding: "12px", marginTop: "8px" }}>
      <div className="PanelTitle" style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>P/L Trend</span>
        <select
          value={selectedTimeframe}
          onChange={(e) => setSelectedTimeframe(e.target.value)}
          style={{
            background: "rgba(79,195,247,0.15)",
            border: "1px solid rgba(79,195,247,0.3)",
            color: "white",
            padding: "3px 6px",
            borderRadius: "4px",
            fontSize: "10px",
            cursor: "pointer"
          }}
        >
          <option value="5m">Last 5m</option>
          <option value="15m">Last 15m</option>
          <option value="30m">Last 30m</option>
          <option value="all">All Time</option>
        </select>
      </div>
      
      <div style={{
        height: "120px",
        background: "rgba(0,0,0,0.15)",
        borderRadius: "6px",
        padding: "6px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Simple line chart */}
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0 }}>
          {chartData.length > 1 && (
            <polyline
              points={chartData.map((d, i) => {
                const x = Number(((i / (chartData.length - 1 || 1)) * 100).toFixed(2));
                const range = maxY - minY || 1;
                const y = Number((100 - ((d.y - minY) / range) * 100).toFixed(2));
                return `${x},${y}`;
              }).join(" ")}
              fill="none"
              stroke={totalPnL >= 0 ? "var(--good)" : "var(--bad)"}
              strokeWidth="0.5"
              style={{ opacity: 0.8 }}
            />
          )}
          {/* Zero line */}
          <line
            x1="0"
            y1={Number((100 - ((0 - minY) / (maxY - minY || 1)) * 100).toFixed(2))}
            x2="100"
            y2={Number((100 - ((0 - minY) / (maxY - minY || 1)) * 100).toFixed(2))}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.3"
            strokeDasharray="2,2"
          />
        </svg>
        
        {/* Trend indicator */}
        <div style={{
          position: "absolute",
          top: "4px",
          right: "4px",
          fontSize: "9px",
          padding: "2px 6px",
          background: trend === "upward" 
            ? "rgba(74, 222, 128, 0.3)" 
            : trend === "downward" 
            ? "rgba(248, 113, 113, 0.3)" 
            : "rgba(79,195,247,0.15)",
          borderRadius: "4px"
        }}>
          {trend === "upward" ? "📈 Up" : trend === "downward" ? "📉 Down" : "➡️ Stable"}
        </div>
      </div>
    </div>
  );
}

