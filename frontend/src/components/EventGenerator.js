// src/components/EventGenerator.js
import { useEffect, useRef } from "react";
import { generateEvent } from "../api/events";
import { nextEvent } from "../data/mockEvents"; // Fallback if API fails

/**
 * Continuously emits events while `active` is true.
 * Calls `onEvent(ev)` for each emission.
 * Now uses backend API to generate events.
 */
export function useEventGenerator({
  active,
  minDelayMs = 5000,
  maxDelayMs = 9000,
  immediate = true,
  forceQuietCeilingMs = 15000, // never go longer than this without an event
  probPerTick = 0.7,          // chance to emit on a tick
  onEvent,                     // (ev) => void
  useBackendAPI = true,        // Use backend API (default: true)
} = {}) {
  const timerRef = useRef(null);
  const lastEmitRef = useRef(0);

  useEffect(() => {
    if (!active) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      return;
    }

    async function fetchEventFromAPI(eventType = null) {
      if (useBackendAPI) {
        try {
          const result = await generateEvent({ type: eventType });
          if (result.success && result.event) {
            return result.event;
          }
        } catch (error) {
          console.warn("Backend API failed, falling back to mock data:", error);
        }
      }
      // Fallback to mock data if API fails or useBackendAPI is false
      return nextEvent();
    }

    function scheduleNext() {
      const delay = Math.floor(minDelayMs + Math.random() * (maxDelayMs - minDelayMs));
      timerRef.current = setTimeout(tick, delay);
    }

    async function tick() {
      const now = Date.now();
      const tooQuiet = now - lastEmitRef.current > forceQuietCeilingMs;
      const shouldEmit = tooQuiet || Math.random() < probPerTick;

      if (shouldEmit) {
        const ev = await fetchEventFromAPI();
        lastEmitRef.current = now;
        try { onEvent?.(ev); } catch (e) { console.error(e); }
      }
      scheduleNext();
    }

    if (immediate) {
      // fire one right away so the feed isn't empty
      fetchEventFromAPI().then((ev) => {
        lastEmitRef.current = Date.now();
        try { onEvent?.(ev); } catch (e) { console.error(e); }
      });
    }

    scheduleNext();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active, minDelayMs, maxDelayMs, immediate, forceQuietCeilingMs, probPerTick, onEvent, useBackendAPI]);
}
