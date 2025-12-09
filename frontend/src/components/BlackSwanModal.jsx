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
        width: "100vw",
        height: "100vh",
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
        margin: 0,
        pointerEvents: "auto"
      }}
      onClick={(e) => {
        // Prevent closing on background click - user must make a choice
        e.stopPropagation();
      }}
    >
      <div 
        className="BlackSwanModalCard" 
        style={{
          background: "#ffffff",
          color: "#1a1f2e",
          padding: "24px",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "380px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(0, 0, 0, 0.1)",
          animation: "slideUp 0.3s ease-out",
          position: "relative",
          margin: "0 auto",
          maxHeight: "90vh",
          overflow: "auto",
          transform: "translateY(0)",
          flexShrink: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning icon indicator */}
        <div style={{
          position: "absolute",
          top: "-15px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#ff6b35",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          boxShadow: "0 4px 12px rgba(255, 107, 53, 0.4)"
        }}>
          ⚠️
        </div>

        {/* Title */}
        <div style={{ 
          fontSize: "20px", 
          fontWeight: 700, 
          marginBottom: "12px",
          marginTop: "15px",
          textAlign: "center",
          color: "#ff6b35"
        }}>
          {event.icon} {event.title}
        </div>

        {/* Description */}
        <p style={{ 
          color: "#4a5568",
          marginBottom: "20px",
          lineHeight: "1.6",
          fontSize: "14px",
          textAlign: "center"
        }}>
          {event.details || "Severe market dislocation detected."}
        </p>

        {/* Impact warning */}
        <div style={{
          background: "#fff4e6",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "2px solid #ff6b35",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Expected Impact
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#ff6b35" }}>
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
              padding: "12px 16px",
              border: "2px solid #6bbf8a",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              background: "#ffffff",
              color: "#6bbf8a",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#6bbf8a";
              e.target.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#ffffff";
              e.target.style.color = "#6bbf8a";
            }}
            onClick={() => onChoose("HEDGE")}
          >
            🛡️ Hedge
          </button>
          <button 
            style={{
              flex: 1,
              padding: "12px 16px",
              border: "2px solid #d4a574",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              background: "#ffffff",
              color: "#d4a574",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#d4a574";
              e.target.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#ffffff";
              e.target.style.color = "#d4a574";
            }}
            onClick={() => onChoose("HOLD")}
          >
            ⏸️ Hold
          </button>
          <button 
            style={{
              flex: 1,
              padding: "12px 16px",
              border: "2px solid #ff6b35",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              background: "#ffffff",
              color: "#ff6b35",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#ff6b35";
              e.target.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#ffffff";
              e.target.style.color = "#ff6b35";
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

