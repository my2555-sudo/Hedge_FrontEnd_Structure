import { useEffect, useRef } from "react";
import { generateEvent } from "../api/events";
import { nextBlackSwan } from "../data/mockEvents"; // Fallback if API fails

function sampleDelayMs(meanSec, minSec = 45, maxSec = 180) {
  const u = Math.random();
  const exp = -Math.log(1 - u) * meanSec;
  return Math.max(minSec, Math.min(exp, maxSec)) * 1000;
}

export function useBlackSwan({ active, onEvent, meanIntervalSec = 45, useBackendAPI = true } = {}) {
  const timerRef = useRef(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!active) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      runningRef.current = false;
      return;
    }
    if (runningRef.current) return;
    runningRef.current = true;

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
      const delay = sampleDelayMs(meanIntervalSec);
      timerRef.current = setTimeout(async () => {
        try {
          const event = await fetchBlackSwanFromAPI();
          onEvent?.(event);
        } catch (e) {
          console.error(e);
        }
        schedule();
      }, delay);
    };
    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      runningRef.current = false;
    };
  }, [active, onEvent, meanIntervalSec, useBackendAPI]);
}
