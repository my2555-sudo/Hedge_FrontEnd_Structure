import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function BlackSwanModal({ event, open, onChoose }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !event) return null;
  
  const modalContent = (
    <div 
      className="BlackSwanModalOverlay" 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.3s ease-in",
        overflow: "hidden",
        padding: "20px",
        boxSizing: "border-box",
        margin: 0
      }}
      onClick={(e) => {
        // Prevent closing on background click - user must make a choice
        e.stopPropagation();
      }}
    >
      <div 
        className="BlackSwanModalCard" 
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          color: "white",
          padding: "20px",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "380px",
          boxShadow: "0 20px 60px rgba(216, 27, 96, 0.5)",
          border: "2px solid rgba(216, 27, 96, 0.3)",
          animation: "slideUp 0.3s ease-out",
          position: "relative",
          margin: "auto",
          maxHeight: "90vh",
          overflow: "auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning icon indicator */}
        <div style={{
          position: "absolute",
          top: "-15px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#d81b60",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          boxShadow: "0 4px 20px rgba(216, 27, 96, 0.6)"
        }}>
          ⚠️
        </div>

        {/* Title */}
        <div style={{ 
          fontSize: "18px", 
          fontWeight: 700, 
          marginBottom: "8px",
          marginTop: "15px",
          textAlign: "center",
          color: "#ff6b9d"
        }}>
          {event.icon} {event.title}
        </div>

        {/* Description */}
        <p style={{ 
          opacity: 0.9, 
          marginBottom: "16px",
          lineHeight: "1.5",
          fontSize: "14px",
          textAlign: "center"
        }}>
          {event.details || "Severe market dislocation detected."}
        </p>

        {/* Impact warning */}
        <div style={{
          background: "rgba(216, 27, 96, 0.2)",
          padding: "10px",
          borderRadius: "6px",
          marginBottom: "16px",
          border: "1px solid rgba(216, 27, 96, 0.4)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "4px" }}>
            Expected Impact
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#ff6b9d" }}>
            {(event.impactPct * 100).toFixed(2)}%
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ 
          display: "flex", 
          gap: "8px", 
          justifyContent: "center"
        }}>
          <button 
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "2px solid #4caf50",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              background: "rgba(76, 175, 80, 0.1)",
              color: "#4caf50",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#4caf50";
              e.target.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(76, 175, 80, 0.1)";
              e.target.style.color = "#4caf50";
            }}
            onClick={() => onChoose("HEDGE")}
          >
            🛡️ Hedge
          </button>
          <button 
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "2px solid #ff9800",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              background: "rgba(255, 152, 0, 0.1)",
              color: "#ff9800",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#ff9800";
              e.target.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255, 152, 0, 0.1)";
              e.target.style.color = "#ff9800";
            }}
            onClick={() => onChoose("HOLD")}
          >
            ⏸️ Hold
          </button>
          <button 
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "2px solid #d81b60",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              background: "rgba(216, 27, 96, 0.2)",
              color: "#ff6b9d",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#d81b60";
              e.target.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(216, 27, 96, 0.2)";
              e.target.style.color = "#ff6b9d";
            }}
            onClick={() => onChoose("DOUBLE")}
          >
            ⚡ Double
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );

  // Use portal to render at document body level for proper centering
  return createPortal(modalContent, document.body);
}

