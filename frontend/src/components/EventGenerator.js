// src/components/EventGenerator.js
import { useEffect, useRef } from "react";
import { nextEvent } from "../data/mockEvents";

/**
 * Continuously emits events while `active` is true.
 * Calls `onEvent(ev)` for each emission.
 */
export function useEventGenerator({
  active,
  minDelayMs = 5000,
  maxDelayMs = 9000,
  immediate = true,
  forceQuietCeilingMs = 15000, // never go longer than this without an event
  probPerTick = 0.7,          // chance to emit on a tick
  onEvent,                     // (ev) => void
} = {}) {
  const timerRef = useRef(null);
  const lastEmitRef = useRef(0);

  useEffect(() => {
    if (!active) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      return;
    }

    function scheduleNext() {
      const delay = Math.floor(minDelayMs + Math.random() * (maxDelayMs - minDelayMs));
      timerRef.current = setTimeout(tick, delay);
    }

    function tick() {
      const now = Date.now();
      const tooQuiet = now - lastEmitRef.current > forceQuietCeilingMs;
      const shouldEmit = tooQuiet || Math.random() < probPerTick;

      if (shouldEmit) {
        const ev = nextEvent();
        lastEmitRef.current = now;
        try { onEvent?.(ev); } catch (e) { console.error(e); }
      }
      scheduleNext();
    }

    if (immediate) {
      // fire one right away so the feed isn’t empty
      const ev = nextEvent();
      lastEmitRef.current = Date.now();
      try { onEvent?.(ev); } catch (e) { console.error(e); }
    }

    scheduleNext();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active, minDelayMs, maxDelayMs, immediate, forceQuietCeilingMs, probPerTick, onEvent]);
}
