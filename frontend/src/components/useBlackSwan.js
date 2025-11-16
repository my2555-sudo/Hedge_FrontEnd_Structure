import { useEffect, useRef } from "react";
import { generateEvent } from "../api/events";
import { nextBlackSwan } from "../data/mockEvents"; // Fallback if API fails

function sampleDelayMs(meanSec, minSec = 45, maxSec = 180) {
  // Normal delays: 45-180 seconds (was 5-30 for testing)
  const u = Math.random();
  const exp = -Math.log(1 - u) * meanSec;
  return Math.max(minSec, Math.min(exp, maxSec)) * 1000;
}

export function useBlackSwan({ active, onEvent, meanIntervalSec = 120, useBackendAPI = true } = {}) {
  const timerRef = useRef(null);
  const firstEventFired = useRef(false);
  const activeRef = useRef(active);

  // Keep activeRef in sync
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    // Clear any existing timer when effect runs
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!active) {
      firstEventFired.current = false;
      return;
    }

    async function fetchBlackSwanFromAPI() {
      if (useBackendAPI) {
        try {
          const result = await generateEvent({ forceBlackSwan: true });
          if (result.success && result.event) {
            return result.event;
          }
        } catch (error) {
          console.warn("Backend API failed for blackswan, falling back to mock data:", error);
        }
      }
      // Fallback to mock data if API fails or useBackendAPI is false
      return nextBlackSwan();
    }

    const schedule = () => {
      // Normal frequency: use the mean interval for all events
      const delay = sampleDelayMs(meanIntervalSec);
      if (!firstEventFired.current) {
        firstEventFired.current = true;
      }
      
      timerRef.current = setTimeout(async () => {
        // Check active state at execution time using ref
        if (!activeRef.current) {
          return;
        }
        
        try {
          const event = await fetchBlackSwanFromAPI();
          if (event && onEvent) {
            onEvent(event);
          }
        } catch (e) {
          console.error("Error in black swan schedule:", e);
        }
        
        // Schedule next event only if still active
        if (activeRef.current) {
          schedule();
        }
      }, delay);
    };
    
    schedule();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      firstEventFired.current = false;
    };
  }, [active, onEvent, meanIntervalSec, useBackendAPI]);
}
