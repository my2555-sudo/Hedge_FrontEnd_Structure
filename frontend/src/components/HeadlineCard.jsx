import React from "react";

export default function HeadlineCard({ event, onClick }) {
  const isMacro = event.type === "MACRO";
  const impactPct = event.impactPct || event.baseImpactPct || 0;
  const isPositive = impactPct > 0;
  const isNegative = impactPct < 0;
  
  return (
    <button
      className={`nf-card ${isMacro ? "macro" : "micro"} ${isPositive ? "positive" : ""} ${isNegative ? "negative" : ""}`}
      onClick={() => onClick?.(event)}
      title={event.details}
    >
      <span className="nf-icon" aria-hidden>
        {event.icon || (isMacro ? "🌐" : "📣")}
      </span>
      <span className="nf-headline">{event.title}</span>
      <time className="nf-time">
        {new Date(event.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </time>
    </button>
  );
}