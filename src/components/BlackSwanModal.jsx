import React from "react";

export default function BlackSwanModal({ event, open, onChoose }) {
  if (!open || !event) return null;
  return (
    <div className="ModalOverlay" style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000
    }}>
      <div className="ModalCard" style={{
        background: "#121212", color: "white", padding: 16, borderRadius: 12,
        width: 420, boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
      }}>
        <div className="ModalTitle" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          {event.icon} {event.title}
        </div>
        <p className="ModalText" style={{ opacity: 0.9, marginBottom: 16 }}>
          {event.details || "Severe market dislocation detected."}
        </p>
        <div className="ModalActions" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn" onClick={() => onChoose("HEDGE")}>Hedge</button>
          <button className="btn" onClick={() => onChoose("HOLD")}>Hold</button>
          <button className="btn danger" onClick={() => onChoose("DOUBLE")} style={{ background: "#d81b60" }}>
            Double Down
          </button>
        </div>
      </div>
    </div>
  );
}

