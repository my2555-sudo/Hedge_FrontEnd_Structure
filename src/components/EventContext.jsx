// src/components/EventContext.jsx
import React, { createContext, useCallback, useContext, useRef, useState } from "react";

const EventContext = createContext({ events: [], addEvent: () => {} });

export function EventProvider({ children }) {
  const [events, setEvents] = useState([]);

  // Remember the last time we saw each (type|title) so we can skip near-duplicates
  const lastByKeyRef = useRef(new Map()); // key -> ts
  const DEDUP_WINDOW_MS = 20_000;         // ignore same headline within 20s

  const addEvent = useCallback((ev) => {
    const now = Date.now();
    const key = `${(ev.type || "").trim()}|${(ev.title || "").trim()}`;
    if (key !== "|") {
      const last = lastByKeyRef.current.get(key) || 0;
      if (now - last < DEDUP_WINDOW_MS) return; // drop near-duplicate
      lastByKeyRef.current.set(key, now);
    }

    const withTs = { ...ev, ts: ev.ts ?? now };
    setEvents((prev) => [withTs, ...prev].slice(0, 100));
  }, []);

  return (
    <EventContext.Provider value={{ events, addEvent }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEventBus() {
  return useContext(EventContext);
}

