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
    if (rank === 1) return { color: "#FFD700", fontWeight: "bold", textShadow: "0 0 8px #FFD700" };
    if (rank === 2) return { color: "#C0C0C0", fontWeight: "bold", textShadow: "0 0 6px #C0C0C0" };
    if (rank === 3) return { color: "#CD7F32", fontWeight: "bold", textShadow: "0 0 4px #CD7F32" };
    return { color: "#ddd" };
  };

  const modalContent = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#1c1c1c",
          borderRadius: "16px",
          padding: "32px 24px",
          color: "white",
          width: "100%",
          maxWidth: "520px",
          boxShadow: "0 0 25px rgba(0,0,0,0.5)",
          textAlign: "center",
          transform: visible ? "translateY(0)" : "translateY(40px)",
          transition: "transform 0.5s ease",
        }}
      >
        <h2
          style={{
            marginBottom: "20px",
            fontSize: "22px",
            fontWeight: "600",
            letterSpacing: "0.5px",
          }}
        >
          Round {roundNumber} Complete!
        </h2>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "15px",
              minWidth: "400px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #666",
                  color: "#aaa",
                }}
              >
                <th style={{ textAlign: "left", padding: "10px 12px", minWidth: "40px" }}>#</th>
                <th style={{ textAlign: "left", padding: "10px 12px", minWidth: "100px" }}>Player</th>
                <th style={{ textAlign: "center", padding: "10px 12px", minWidth: "120px" }}>Title</th>
                <th style={{ textAlign: "right", padding: "10px 12px", minWidth: "100px" }}>Portfolio</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry, index) => {
                const rank = index + 1;
                const isTop = rank === 1;
                const isEven = index % 2 === 0;

                return (
                  <tr
                    key={index}
                    style={{
                      backgroundColor: isTop
                        ? "#3b2f00"
                        : isEven
                        ? "#222"
                        : "#2b2b2b",
                      boxShadow: isTop ? "0 0 20px #FFD700" : "none",
                      animation: visible ? `fadeSlideIn 0.6s ease ${0.15 * index}s both` : "none",
                      transition: "background-color 0.3s ease, box-shadow 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = isTop ? "#4d3b00" : "#333")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = isTop
                        ? "#3b2f00"
                        : isEven
                        ? "#222"
                        : "#2b2b2b")
                    }
                  >
                    <td style={{ textAlign: "left", padding: "10px 12px", ...getRankStyle(rank) }}>
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                    </td>
                    <td style={{ textAlign: "left", padding: "10px 12px", fontWeight: "500" }}>
                      {entry.playerName}
                    </td>
                    <td style={{ textAlign: "center", padding: "10px 12px", fontStyle: "italic" }}>
                      {entry.title}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "10px 12px",
                        fontVariantNumeric: "tabular-nums",
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
          onClick={() => {
            setVisible(false);
            setTimeout(onResume, 400);
          }}
          style={{
            marginTop: "28px",
            backgroundColor: "#28a745",
            color: "white",
            padding: "10px 22px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "bold",
            transition: "background-color 0.3s ease",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#34c759")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#28a745")}
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
