import React from "react";

export default function HeadlineCard({ event, onClick }) {
  const isMacro = event.type === "MACRO";
  return (
    <button
      className={`nf-card ${isMacro ? "macro" : "micro"}`}
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