import { useMemo, useState, useEffect } from "react";
import { TITLES, calculateTitle } from "../gameLogic.js";

/**
 * StatsDashboard - Displays cumulative P/L trends and unlocked titles
 * 
 * @param {Object} props
 * @param {number} props.totalPnL - Current total profit/loss
 * @param {number} props.portfolioValue - Current portfolio value
 * @param {number} props.initialValue - Starting portfolio value
 * @param {number} props.streak - Current survival streak
 * @param {Array} props.pnlHistory - Array of {timestamp, pnl} for trend visualization
 */
export default function StatsDashboard({ 
  totalPnL = 0,
  portfolioValue = 10000,
  initialValue = 10000,
  streak = 0,
  pnlHistory = []
}) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");

  // Calculate current title and next title progress
  const { currentTitle, nextTitle, progressToNext, unlockedTitles } = useMemo(() => {
    const current = calculateTitle(streak);
    const currentIndex = TITLES.findIndex(t => t.title === current);
    const nextIndex = currentIndex < TITLES.length - 1 ? currentIndex + 1 : currentIndex;
    const next = TITLES[nextIndex];
    const progress = nextIndex > currentIndex 
      ? Math.min(100, (streak / next.minStreak) * 100)
      : 100;
    
    // Unlocked titles (all titles with minStreak <= current streak)
    const unlocked = TITLES.filter(t => streak >= t.minStreak);

    return {
      currentTitle: current,
      nextTitle: next,
      progressToNext: progress,
      unlockedTitles: unlocked
    };
  }, [streak]);

  // Calculate P/L percentage
  const pnlPercentage = useMemo(() => {
    return initialValue > 0 ? ((portfolioValue - initialValue) / initialValue) * 100 : 0;
  }, [portfolioValue, initialValue]);

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
    <div className="glass" style={{ padding: "16px", marginTop: "12px" }}>
      <div className="PanelTitle" style={{ marginBottom: "16px" }}>
        📊 ANALYTICS DASHBOARD
      </div>

      {/* P/L Summary Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
        marginBottom: "20px"
      }}>
        <div style={{
          padding: "12px",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "8px",
          border: `2px solid ${totalPnL >= 0 ? "rgba(40, 167, 69, 0.3)" : "rgba(220, 53, 69, 0.3)"}`
        }}>
          <div style={{ fontSize: "11px", opacity: 0.7, marginBottom: "4px" }}>Total P/L</div>
          <div style={{
            fontSize: "18px",
            fontWeight: 700,
            color: totalPnL >= 0 ? "var(--good)" : "var(--bad)"
          }}>
            {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
          </div>
          <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px" }}>
            {pnlPercentage >= 0 ? "+" : ""}{pnlPercentage.toFixed(1)}%
          </div>
        </div>

        <div style={{
          padding: "12px",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "8px",
          border: "2px solid rgba(79, 195, 247, 0.3)"
        }}>
          <div style={{ fontSize: "11px", opacity: 0.7, marginBottom: "4px" }}>Streak</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--accent)" }}>
            {streak}
          </div>
          <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px" }}>
            {currentTitle}
          </div>
        </div>
      </div>

      {/* P/L Trend Chart */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px"
        }}>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>P/L Trend</div>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "11px",
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
          background: "rgba(0,0,0,0.2)",
          borderRadius: "8px",
          padding: "8px",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Simple line chart */}
          <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
            {chartData.length > 1 && (
              <polyline
                points={chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1 || 1)) * 100 + "%";
                  const range = maxY - minY || 1;
                  const y = 100 - ((d.y - minY) / range) * 100 + "%";
                  return `${x},${y}`;
                }).join(" ")}
                fill="none"
                stroke={totalPnL >= 0 ? "var(--good)" : "var(--bad)"}
                strokeWidth="2"
                style={{ opacity: 0.8 }}
              />
            )}
            {/* Zero line */}
            <line
              x1="0%"
              y1={100 - ((0 - minY) / (maxY - minY || 1)) * 100 + "%"}
              x2="100%"
              y2={100 - ((0 - minY) / (maxY - minY || 1)) * 100 + "%"}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          </svg>
          
          {/* Trend indicator */}
          <div style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            fontSize: "10px",
            padding: "4px 8px",
            background: trend === "upward" 
              ? "rgba(40, 167, 69, 0.3)" 
              : trend === "downward" 
              ? "rgba(220, 53, 69, 0.3)" 
              : "rgba(255,255,255,0.1)",
            borderRadius: "4px"
          }}>
            {trend === "upward" ? "📈 Upward" : trend === "downward" ? "📉 Downward" : "➡️ Stable"}
          </div>
        </div>
      </div>

      {/* Title Progress */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
          Current Title: {currentTitle}
        </div>
        {progressToNext < 100 && (
          <>
            <div style={{ fontSize: "11px", opacity: 0.7, marginBottom: "4px" }}>
              Progress to {nextTitle.title}: {streak} / {nextTitle.minStreak} rounds
            </div>
            <div style={{
              height: "8px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "4px",
              overflow: "hidden"
            }}>
              <div style={{
                height: "100%",
                width: `${progressToNext}%`,
                background: "linear-gradient(90deg, var(--accent) 0%, #4fc3f7 100%)",
                transition: "width 0.3s ease"
              }} />
            </div>
          </>
        )}
        {progressToNext >= 100 && (
          <div style={{
            fontSize: "11px",
            color: "var(--good)",
            fontWeight: 600
          }}>
            ✓ Maximum title achieved!
          </div>
        )}
      </div>

      {/* Unlocked Titles */}
      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px" }}>
          Unlocked Titles ({unlockedTitles.length}/{TITLES.length})
        </div>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          maxHeight: "150px",
          overflowY: "auto"
        }}>
          {TITLES.map((title, idx) => {
            const isUnlocked = unlockedTitles.some(t => t.title === title.title);
            const isCurrent = title.title === currentTitle;
            
            return (
              <div
                key={idx}
                style={{
                  padding: "8px 10px",
                  background: isUnlocked 
                    ? (isCurrent ? "rgba(79, 195, 247, 0.2)" : "rgba(255,255,255,0.05)")
                    : "rgba(255,255,255,0.02)",
                  borderRadius: "6px",
                  fontSize: "11px",
                  border: isCurrent ? "1px solid var(--accent)" : "1px solid rgba(255,255,255,0.1)",
                  opacity: isUnlocked ? 1 : 0.5,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span>
                  {isUnlocked ? "✓" : "🔒"} {title.title}
                </span>
                <span style={{ fontSize: "10px", opacity: 0.6 }}>
                  {title.minStreak} rounds
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
