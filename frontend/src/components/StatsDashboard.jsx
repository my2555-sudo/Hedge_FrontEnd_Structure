import { useMemo, useState } from "react";
import useMarketInsights from "../hooks/useMarketInsights.js";
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
  const {
    indexes,
    sectors,
    fearGreed,
    loading: insightsLoading,
    error: insightsError,
    lastUpdated,
    refresh: refreshInsights
  } = useMarketInsights();

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
    <div className="glass" style={{ padding: "12px", marginTop: "8px" }}>
      <div className="PanelTitle" style={{ marginBottom: "10px" }}>
        📊 ANALYTICS DASHBOARD
      </div>

      {/* P/L Summary Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "8px",
        marginBottom: "12px"
      }}>
        <div style={{
          padding: "10px",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "8px",
          border: `1px solid ${totalPnL >= 0 ? "rgba(74, 222, 128, 0.3)" : "rgba(248, 113, 113, 0.3)"}`
        }}>
          <div style={{ fontSize: "10px", opacity: 0.7, marginBottom: "3px" }}>Total P/L</div>
          <div style={{
            fontSize: "16px",
            fontWeight: 600,
            color: totalPnL >= 0 ? "var(--good)" : "var(--bad)"
          }}>
            {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
          </div>
          <div style={{ fontSize: "9px", opacity: 0.65, marginTop: "2px" }}>
            {pnlPercentage >= 0 ? "+" : ""}{pnlPercentage.toFixed(1)}%
          </div>
        </div>

        <div style={{
          padding: "10px",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "8px",
          border: "1px solid rgba(79, 195, 247, 0.3)"
        }}>
          <div style={{ fontSize: "10px", opacity: 0.7, marginBottom: "3px" }}>Streak</div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--accent)" }}>
            {streak}
          </div>
          <div style={{ fontSize: "9px", opacity: 0.65, marginTop: "2px" }}>
            {currentTitle}
          </div>
        </div>
      </div>

      {/* Live Market Insights (API-powered) */}
      <div style={{
        marginBottom: "12px",
        padding: "10px",
        background: "rgba(79,195,247,0.06)",
        borderRadius: "8px",
        border: "1px solid rgba(79,195,247,0.2)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px"
        }}>
          <div style={{ fontSize: "12px", fontWeight: 600 }}>
            🌐 Live Market Pulse
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {lastUpdated && (
              <span style={{ fontSize: "9px", opacity: 0.6 }}>
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={refreshInsights}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--border)",
                color: "white",
                borderRadius: "6px",
                padding: "3px 6px",
                fontSize: "9px",
                cursor: "pointer",
                fontWeight: 500
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {insightsError && (
          <div style={{
            fontSize: "10px",
            color: "var(--bad)",
            background: "rgba(248,113,113,0.12)",
            padding: "6px 8px",
            borderRadius: "6px",
            marginBottom: "8px"
          }}>
            {insightsError} — showing latest sample data instead.
          </div>
        )}
        <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: "6px",
              marginBottom: "10px"
            }}>
              {(insightsLoading && indexes.length === 0 
                ? Array.from({ length: 4 }, (_, i) => ({ symbol: `loading-${i}`, name: "Loading...", price: 0, changesPercentage: 0 }))
                : indexes.length > 0 
                  ? indexes 
                  : [
                      { symbol: "^GSPC", name: "S&P 500", price: 5121.42, changesPercentage: "-0.41" },
                      { symbol: "^NDX", name: "NASDAQ 100", price: 17894.65, changesPercentage: "0.32" },
                      { symbol: "^DJI", name: "Dow Jones", price: 38940.22, changesPercentage: "-0.15" },
                      { symbol: "^VIX", name: "CBOE VIX", price: 14.87, changesPercentage: "1.12" },
                    ]
              ).map((index, idx) => {
                const price = index?.price ?? index?.close ?? 0;
                const rawChange = index?.changesPercentage ?? index?.changePercent ?? 0;
                const change = Number(String(rawChange).replace("%", ""));
                const isPositive = change >= 0;
                return (
                  <div
                    key={index?.symbol || idx}
                    style={{
                      padding: "8px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "6px",
                      border: `1px solid ${isPositive ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`,
                      minHeight: "56px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <div style={{ fontSize: "10px", opacity: 0.7 }}>
                      {index?.name || "Market Index"}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>
                      {insightsLoading && !index
                        ? "···"
                        : (
                          <>
                            ${Number(price).toFixed(2)}
                            <span style={{
                              fontSize: "10px",
                              marginLeft: "4px",
                              color: isPositive ? "var(--good)" : "var(--bad)"
                            }}>
                              {isPositive ? "+" : ""}{change.toFixed(2)}%
                            </span>
                          </>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {(fearGreed || { value: 62, classification: "Greed" }) && (
                <div style={{
                  flex: "1 1 140px",
                  padding: "8px",
                  background: "rgba(251,191,36,0.1)",
                  borderRadius: "6px",
                  border: "1px solid rgba(251,191,36,0.25)"
                }}>
                  <div style={{ fontSize: "10px", opacity: 0.7, marginBottom: "3px" }}>
                    Sentiment (Fear & Greed)
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 600 }}>
                    {(fearGreed || { value: 62 }).value}
                  </div>
                  <div style={{ fontSize: "10px", opacity: 0.7 }}>
                    {(fearGreed || { classification: "Greed" }).classification}
                  </div>
                </div>
              )}

              <div style={{
                flex: "2 1 180px",
                padding: "8px",
                background: "rgba(167,139,250,0.08)",
                borderRadius: "6px",
                border: "1px solid rgba(167,139,250,0.2)"
              }}>
                <div style={{ fontSize: "10px", opacity: 0.7, marginBottom: "4px" }}>
                  Leading Sectors
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {(sectors.length > 0 ? sectors : [
                    { name: "Technology", change: 1.23 },
                    { name: "Healthcare", change: 0.88 },
                    { name: "Financial", change: -0.31 },
                    { name: "Energy", change: 0.47 },
                    { name: "Consumer Discretionary", change: -0.56 },
                  ]).map((sector, idx) => {
                      const isPositive = sector.change >= 0;
                      return (
                        <div
                          key={sector.name || idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "10px",
                            background: "rgba(0,0,0,0.15)",
                            padding: "4px 6px",
                            borderRadius: "4px",
                            border: `1px solid ${isPositive ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"}`
                          }}
                        >
                          <span>{sector.name}</span>
                          <span style={{ color: isPositive ? "var(--good)" : "var(--bad)", fontWeight: 500 }}>
                            {isPositive ? "+" : ""}{sector.change.toFixed(2)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
            </div>
          </>
      </div>

      {/* P/L Trend Chart */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px"
        }}>
          <div style={{ fontSize: "12px", fontWeight: 600 }}>P/L Trend</div>
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
          height: "80px",
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

      {/* Title Progress */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
          Current Title: {currentTitle}
        </div>
        {progressToNext < 100 && (
          <>
            <div style={{ fontSize: "10px", opacity: 0.7, marginBottom: "3px" }}>
              Progress to {nextTitle.title}: {streak} / {nextTitle.minStreak} rounds
            </div>
            <div style={{
              height: "6px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: "3px",
              overflow: "hidden"
            }}>
              <div style={{
                height: "100%",
                width: `${progressToNext}%`,
                background: "linear-gradient(90deg, var(--accent) 0%, var(--accent2) 100%)",
                transition: "width 0.3s ease"
              }} />
            </div>
          </>
        )}
        {progressToNext >= 100 && (
          <div style={{
            fontSize: "10px",
            color: "var(--good)",
            fontWeight: 600
          }}>
            ✓ Maximum title achieved!
          </div>
        )}
      </div>

      {/* Unlocked Titles */}
      <div>
        <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>
          Unlocked Titles ({unlockedTitles.length}/{TITLES.length})
        </div>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          maxHeight: "120px",
          overflowY: "auto"
        }}>
          {TITLES.map((title, idx) => {
            const isUnlocked = unlockedTitles.some(t => t.title === title.title);
            const isCurrent = title.title === currentTitle;
            
            return (
              <div
                key={idx}
                style={{
                  padding: "6px 8px",
                  background: isUnlocked 
                    ? (isCurrent ? "rgba(79, 195, 247, 0.2)" : "rgba(255,255,255,0.05)")
                    : "rgba(255,255,255,0.02)",
                  borderRadius: "4px",
                  fontSize: "10px",
                  border: isCurrent ? "1px solid rgba(79,195,247,0.4)" : "1px solid var(--border)",
                  opacity: isUnlocked ? 1 : 0.5,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span>
                  {isUnlocked ? "✓" : "🔒"} {title.title}
                </span>
                <span style={{ fontSize: "9px", opacity: 0.6 }}>
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
