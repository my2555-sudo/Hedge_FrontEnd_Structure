import { useEffect, useRef } from "react";
import { nextBlackSwan } from "../data/mockEvents";

function sampleDelayMs(meanSec, minSec = 45, maxSec = 180) {
  const u = Math.random();
  const exp = -Math.log(1 - u) * meanSec;
  return Math.max(minSec, Math.min(exp, maxSec)) * 1000;
}

export function useBlackSwan({ active, onEvent, meanIntervalSec = 45 } = {}) {
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

    const schedule = () => {
      const delay = sampleDelayMs(meanIntervalSec);
      timerRef.current = setTimeout(() => {
        try { onEvent?.(nextBlackSwan()); } catch (e) { console.error(e); }
        schedule();
      }, delay);
    };
    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      runningRef.current = false;
    };
  }, [active, onEvent, meanIntervalSec]);
}
