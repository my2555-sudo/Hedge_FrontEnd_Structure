import { useMemo } from "react";
import { generateFeedback } from "../data/mockFeedback.js";

/**
 * FeedbackModal - Displays personalized AI feedback with 2-3 tips
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether modal is visible
 * @param {Object} props.lastEvent - Most recent market event
 * @param {Array} props.portfolio - Current portfolio holdings
 * @param {number} props.totalPnL - Total profit/loss
 * @param {Array} props.recentTrades - Recent trading activity
 * @param {string} props.mode - "serious" or "playful" feedback mode
 * @param {Function} props.onClose - Callback when modal is closed
 */
export default function FeedbackModal({ 
  open, 
  lastEvent, 
  portfolio = [],
  totalPnL = 0,
  recentTrades = [],
  mode = "serious",
  onClose 
}) {
  if (!open) return null;

  // Determine player action based on recent trades
  const playerAction = useMemo(() => {
    if (!lastEvent) return "no_action";
    
    const eventTrades = recentTrades.filter(
      t => t.eventId === lastEvent.runtimeId && 
      t.timestamp > (lastEvent.ts || 0) - 10000 // Trades within 10s of event
    );
    
    if (eventTrades.length === 0) return "no_action";
    
    const sells = eventTrades.filter(t => t.action === "SELL");
    const buys = eventTrades.filter(t => t.action === "BUY");
    
    if (sells.length >= 2 && sells.length > buys.length) {
      return "panic_sell";
    } else if (buys.length >= 2) {
      return "bought_aggressively";
    } else if (buys.length > 0 && sells.length > 0) {
      return "bought_multiple";
    } else if (sells.length > 0) {
      return totalPnL < -500 ? "panic_sell" : "sold";
    } else if (buys.length > 0) {
      return "bought";
    }
    
    return "no_action";
  }, [lastEvent, recentTrades, totalPnL]);

  // Generate personalized feedback tips
  const tips = useMemo(() => {
    return generateFeedback({
      lastEvent,
      playerAction,
      portfolio,
      totalPnL,
      mode
    });
  }, [lastEvent, playerAction, portfolio, totalPnL, mode]);

  const modeIcon = mode === "playful" ? "🎮" : "📊";
  const modeLabel = mode === "playful" ? "Playful Mode" : "Serious Mode";

  return (
    <div 
      className="ModalOverlay" 
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        backdropFilter: "blur(4px)"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div 
        className="ModalCard" 
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          color: "white",
          padding: "24px",
          borderRadius: "16px",
          width: "90%",
          maxWidth: "520px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}
      >
        {/* Header */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          marginBottom: "20px",
          paddingBottom: "16px",
          borderBottom: "2px solid rgba(255,255,255,0.1)"
        }}>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>
              {modeIcon} AI Coach Feedback
            </div>
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              {modeLabel} • Round Analysis
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "white",
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.target.style.background = "rgba(255,255,255,0.2)"}
            onMouseOut={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
          >
            ×
          </button>
        </div>

        {/* Event Summary */}
        {lastEvent && (
          <div style={{
            marginBottom: "20px",
            padding: "12px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "8px",
            borderLeft: `4px solid ${lastEvent.type === "BLACKSWAN" ? "#d81b60" : lastEvent.type === "MACRO" ? "#ff4d4f" : "#1890ff"}`
          }}>
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
              {lastEvent.icon || "📰"} {lastEvent.title}
            </div>
            <div style={{ fontSize: "11px", opacity: 0.8 }}>
              {lastEvent.type} Event • Impact: {(lastEvent.impactPct * 100).toFixed(1)}%
            </div>
          </div>
        )}

        {/* Personalized Tips */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ 
            fontSize: "14px", 
            fontWeight: 600, 
            marginBottom: "12px",
            color: "var(--accent, #4fc3f7)"
          }}>
            💡 Personalized Tips ({tips.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {tips.map((tip, index) => (
              <div
                key={index}
                style={{
                  padding: "14px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  borderLeft: "3px solid rgba(79, 195, 247, 0.5)",
                  transition: "transform 0.2s, background 0.2s"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <span style={{ 
                  display: "inline-block",
                  marginRight: "8px",
                  fontWeight: 600,
                  color: "var(--accent, #4fc3f7)"
                }}>
                  {index + 1}.
                </span>
                {tip}
              </div>
            ))}
          </div>
        </div>

        {/* P/L Summary */}
        <div style={{
          marginTop: "20px",
          padding: "12px",
          background: totalPnL >= 0 
            ? "rgba(40, 167, 69, 0.15)" 
            : "rgba(220, 53, 69, 0.15)",
          borderRadius: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ fontSize: "12px", opacity: 0.9 }}>Session P/L:</div>
          <div style={{
            fontSize: "16px",
            fontWeight: 700,
            color: totalPnL >= 0 ? "var(--good, #28a745)" : "var(--bad, #dc3545)"
          }}>
            {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "12px",
            background: "var(--accent, #4fc3f7)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s, transform 0.1s"
          }}
          onMouseOver={(e) => {
            e.target.style.background = "var(--accent-hover, #29b6f6)";
            e.target.style.transform = "scale(1.02)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "var(--accent, #4fc3f7)";
            e.target.style.transform = "scale(1)";
          }}
        >
          Got it! ✓
        </button>
      </div>
    </div>
  );
}
