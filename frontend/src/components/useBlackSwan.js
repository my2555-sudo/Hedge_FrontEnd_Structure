import { useEffect, useRef } from "react";
import { generateEvent } from "../api/events";
import { nextBlackSwan } from "../data/mockEvents"; // Fallback if API fails

function sampleDelayMs(meanSec, minSec = 5, maxSec = 30) {
  // For testing: much shorter delays (5-30 seconds instead of 45-180)
  const u = Math.random();
  const exp = -Math.log(1 - u) * meanSec;
  return Math.max(minSec, Math.min(exp, maxSec)) * 1000;
}

export function useBlackSwan({ active, onEvent, meanIntervalSec = 15, useBackendAPI = true } = {}) {
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
      // For testing: fire first black swan quickly (5-10 seconds)
      let delay;
      if (!firstEventFired.current) {
        delay = (5 + Math.random() * 5) * 1000; // 5-10 seconds for first event
        firstEventFired.current = true;
      } else {
        delay = sampleDelayMs(meanIntervalSec);
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
