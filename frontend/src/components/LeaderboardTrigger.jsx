import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

export default function LeaderboardTrigger({ leaderboard, playerName, roundNumber, onResume }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!leaderboard || leaderboard.length === 0) return null;

  const sorted = [...leaderboard].sort((a, b) => b.portfolioValue - a.portfolioValue);

  const getRankStyle = (rank) => {
    if (rank === 1) return { color: "#d4a574", fontWeight: "600" };
    if (rank === 2) return { color: "var(--text-muted)", fontWeight: "600" };
    if (rank === 3) return { color: "var(--text-muted)", fontWeight: "600" };
    return { color: "var(--text-muted)" };
  };

  const modalContent = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
        padding: "16px",
      }}
    >
      <div
        className="glass"
        style={{
          borderRadius: "16px",
          padding: "28px 24px",
          color: "var(--text)",
          width: "100%",
          maxWidth: "540px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
          textAlign: "center",
          transform: visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.95)",
          transition: "transform 0.4s ease",
          border: "1px solid var(--border)",
        }}
      >
        <div className="PanelTitle" style={{ marginBottom: "20px", fontSize: "16px", fontWeight: "600", letterSpacing: "0.05em" }}>
          🎯 Round {roundNumber} Complete!
        </div>

        <div style={{ overflowX: "auto", marginBottom: "20px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
              minWidth: "400px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                <th style={{ textAlign: "left", padding: "10px 12px", minWidth: "40px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>#</th>
                <th style={{ textAlign: "left", padding: "10px 12px", minWidth: "100px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Player</th>
                <th style={{ textAlign: "center", padding: "10px 12px", minWidth: "120px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Title</th>
                <th style={{ textAlign: "right", padding: "10px 12px", minWidth: "100px", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Portfolio</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry, index) => {
                const rank = index + 1;
                const isTop = rank === 1;
                const isEven = index % 2 === 0;
                const isPlayer = entry.playerName === playerName;

                return (
                  <tr
                    key={index}
                    style={{
                      backgroundColor: isTop
                        ? "rgba(251, 191, 36, 0.1)"
                        : isEven
                        ? "rgba(255,255,255,0.02)"
                        : "transparent",
                      borderBottom: "1px solid var(--border)",
                      boxShadow: isTop ? "0 2px 12px rgba(251, 191, 36, 0.2)" : "none",
                      outline: isPlayer ? "2px solid rgba(107, 157, 209, 0.4)" : "none",
                      outlineOffset: "-2px",
                      animation: visible ? `fadeSlideIn 0.5s ease ${0.1 * index}s both` : "none",
                      transition: "background-color 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = isTop 
                        ? "rgba(251, 191, 36, 0.15)" 
                        : "rgba(255,255,255,0.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = isTop
                        ? "rgba(251, 191, 36, 0.1)"
                        : isEven
                        ? "rgba(255,255,255,0.02)"
                        : "transparent")
                    }
                  >
                    <td style={{ textAlign: "left", padding: "12px", ...getRankStyle(rank), fontSize: "14px" }}>
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                    </td>
                    <td style={{ textAlign: "left", padding: "12px", fontWeight: isPlayer ? "600" : "500", color: isPlayer ? "var(--accent)" : "var(--text)" }}>
                      {entry.playerName}
                      {isPlayer && (
                        <span style={{ marginLeft: "6px", fontSize: "10px", color: "var(--accent)", opacity: 0.8 }}>
                          (You)
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "center", padding: "12px", fontStyle: "italic", color: "var(--text-muted)", fontSize: "12px" }}>
                      {entry.title}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "12px",
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: "600",
                        color: "var(--text)",
                        fontSize: "13px",
                      }}
                    >
                      ${entry.portfolioValue.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          className="btn btn-start"
          onClick={() => {
            setVisible(false);
            setTimeout(onResume, 400);
          }}
          style={{
            marginTop: "20px",
            padding: "10px 24px",
            fontSize: "13px",
            minWidth: "120px",
          }}
        >
          Continue
        </button>
      </div>
      <style>
        {`
          @keyframes fadeSlideIn {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
