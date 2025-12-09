import { useMemo } from "react";
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

  return (
    <div className="glass AnalyticsDashboard" style={{ padding: "12px", marginTop: "8px" }}>
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
