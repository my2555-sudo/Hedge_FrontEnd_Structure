import React, { useState, useEffect, useRef, useCallback } from "react";
import { formatTime, getGameState, resetGame } from "../gameLogic";
import { generateEvent } from "../api/events";
import { nextEvent } from "../data/mockEvents"; // Fallback if API fails
import { useEventBus } from "./EventContext.jsx";
import { useBlackSwan } from "./useBlackSwan";
import BlackSwanModal from "./BlackSwanModal.jsx";

// ---- News cadence knobs ----
// More aggressive cadence now that rounds are removed
const NEWS_MIN_MS = 2000;                // ~2 seconds minimum between events
const NEWS_MAX_MS = 4000;                // ~4 seconds maximum between events
const NEWS_FIRE_PROB = 1.0;               // always fire when scheduled

const INITIAL_PORTFOLIO = 20000;



export default function GameController({
  gameDuration = 300,
  playerName = "Player1",
  emitEvents = true,
  controlledActive,           // allow parent to control active state
  onGameEnd,                  // optional callback when the full game ends
}) {
  const { addEvent } = useEventBus();

  const [gameState, setGameState] = useState(
    () =>
      getGameState() || {
        portfolioValue: INITIAL_PORTFOLIO,
        roundsCompleted: 0,
        title: "Novice Trader",
        playerName,
      }
  );

  const [gameSeconds, setGameSeconds] = useState(gameDuration);
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [eventMessage, setEventMessage] = useState(null);

  // Black Swan UI/state
  const [blackSwan, setBlackSwan] = useState(null);
  const sessionStartedRef = useRef(false);
  const gameEndedRef = useRef(false);
  const blackSwanForcedRef = useRef(false);

  // parent-controlled active flag (if provided)
  const isControlled = controlledActive !== undefined;
  const isActive = (controlledActive ?? active) && !gameEndedRef.current;
  const isPaused = isControlled ? !controlledActive : paused;

  // StrictMode-safe emitter guard
  const loopRef = useRef({ running: false, timeoutId: null });

  const startSession = useCallback(() => {
    const newState = resetGame(playerName);
    setGameState(newState || getGameState());
    setGameSeconds(gameDuration);
    setPaused(false);
    setEventMessage(null);
    setBlackSwan(null);
    sessionStartedRef.current = true;
    gameEndedRef.current = false;
    blackSwanForcedRef.current = false; // Reset forced black swan flag
  }, [gameDuration, playerName]);

  const handleGameComplete = useCallback(() => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;
    setActive(false);
    setPaused(false);
    if (typeof onGameEnd === "function") {
      onGameEnd({ portfolioValue: gameState?.portfolioValue });
    }
  }, [gameState?.portfolioValue, onGameEnd]);

  // --- Countdown timer (full-game only) ---
  useEffect(() => {
    if (!isActive || isPaused) return;
    const timer = setInterval(() => {
      setGameSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGameComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isPaused, handleGameComplete]);

  // Sync controlled mode start/reset
  useEffect(() => {
    if (!isControlled) return;
    if (controlledActive && !sessionStartedRef.current) {
      startSession();
    }
    if (!controlledActive && gameEndedRef.current) {
      sessionStartedRef.current = false;
      blackSwanForcedRef.current = false; // Reset black swan flag when game ends
    }
  }, [controlledActive, isControlled, startSession]);

  // --- Handle event impact & publish to feed ---
  const handleEvent = useCallback((event) => {
    setGameState((prev) => {
      if (!prev) return prev;

      const rawImpact = event.impactPct || 0;
      const impactAbs = Math.round(prev.portfolioValue * rawImpact);
      const newPortfolio = Math.max(0, prev.portfolioValue + impactAbs);

      const updated = {
        ...prev,
        portfolioValue: newPortfolio,
      };

      // Only publish non-blackswan events to the news feed
      // Black swan events appear as modal popup only
      if (event.type !== "BLACKSWAN") {
        addEvent({ ...event, ts: Date.now() });
      }

      // Only show toast for non-blackswan events (black swan has modal)
      if (event.type !== "BLACKSWAN") {
        setEventMessage({
          text: `${event.title} (${impactAbs >= 0 ? "+" : ""}${impactAbs})`,
          type: event.type,
        });
        setTimeout(() => setEventMessage(null), 3000);
      }

      return updated;
    });
  }, [addEvent]);

  // --- Normal (MACRO/MICRO) random event generation ---
  useEffect(() => {
    if (!isActive || !emitEvents) return;
    if (loopRef.current.running) return; // prevent double-loop in StrictMode
    loopRef.current.running = true;

    let cancelled = false;

    async function fetchEventFromAPI() {
      try {
        // Randomly choose MACRO or MICRO (or let backend decide)
        const eventType = Math.random() < 0.5 ? "MACRO" : "MICRO";
        const result = await generateEvent({ type: eventType });
        if (result.success && result.event) {
          return result.event;
        }
      } catch (error) {
        console.warn("Backend API failed, falling back to mock data:", error);
      }
      // Fallback to mock data if API fails
      return nextEvent();
    }

    const scheduleEvent = async () => {
      if (cancelled) return;

      if (!isPaused && Math.random() < NEWS_FIRE_PROB) {
        try {
          const event = await fetchEventFromAPI();
          handleEvent(event);
        } catch (error) {
          console.warn("Error fetching event:", error);
        }
      }
      const nextTimeout = NEWS_MIN_MS + Math.random() * (NEWS_MAX_MS - NEWS_MIN_MS); 
      loopRef.current.timeoutId = setTimeout(scheduleEvent, nextTimeout);
    };

    // Start immediately, then continue on interval
    scheduleEvent();

    return () => {
      cancelled = true;
      if (loopRef.current.timeoutId) clearTimeout(loopRef.current.timeoutId);
      loopRef.current.running = false;
      loopRef.current.timeoutId = null;
    };
  }, [isActive, isPaused, emitEvents, handleEvent]);

  // --- Black Swan emitter (rare, Poisson-timed) ---
  // Only active when game is active AND not paused
  const blackSwanActive = isActive && !isPaused && (emitEvents !== false);
  
  useBlackSwan({
    active: blackSwanActive,
    meanIntervalSec: 120, // avg every ~2 minutes (normal frequency)
    useBackendAPI: true,  // Use backend API for blackswan events
    onEvent: (ev) => {
      setBlackSwan(ev);       // open modal popup
      handleEvent(ev);
    },
  });

  // Force black swan event after ~1 minute (60 seconds) when game starts
  useEffect(() => {
    console.log("[BlackSwan] Effect running - isActive:", isActive, "isPaused:", isPaused, "blackSwanForcedRef:", blackSwanForcedRef.current);
    
    // Only set up timer when game becomes active and we haven't forced it yet
    if (!isActive || isPaused || blackSwanForcedRef.current) {
      console.log("[BlackSwan] Skipping timer setup - conditions not met");
      return;
    }

    console.log("[BlackSwan] Setting up forced black swan timer - will trigger in 60 seconds");
    
    // Set flag immediately to prevent multiple timers
    blackSwanForcedRef.current = true;
    
    // Wait 60 seconds, then trigger black swan
    const timer = setTimeout(() => {
      console.log("[BlackSwan] Timer fired! isActive:", isActive, "isPaused:", isPaused);
      // Check again that game is still active and not paused
      // Use refs to get current values at execution time
      const stillActive = (controlledActive ?? active) && !gameEndedRef.current;
      const stillPaused = isControlled ? !controlledActive : paused;
      
      if (stillActive && !stillPaused) {
        console.log("[BlackSwan] Generating forced black swan event...");
        generateEvent({ forceBlackSwan: true })
          .then((result) => {
            console.log("[BlackSwan] Result:", result);
            if (result.success && result.event) {
              console.log("[BlackSwan] Success! Setting black swan:", result.event);
              setBlackSwan(result.event);
              handleEvent(result.event);
            } else {
              console.warn("[BlackSwan] Event generation failed:", result);
            }
          })
          .catch((error) => {
            console.error("[BlackSwan] Error generating forced black swan:", error);
          });
      } else {
        console.warn("[BlackSwan] Game not active or paused, skipping black swan. stillActive:", stillActive, "stillPaused:", stillPaused);
      }
    }, 60000); // 60 seconds = 1 minute

    return () => {
      console.log("[BlackSwan] Cleaning up timer");
      clearTimeout(timer);
    };
  }, [isActive, isPaused, handleEvent, controlledActive, active, paused, isControlled]);

  // --- Player choice to resolve Black Swan (follow-up impact) ---
  function resolveBlackSwan(choice) {
    if (!blackSwan) return;
    const base = blackSwan.impactPct || 0;

    let followUp = 0;
    if (choice === "HEDGE")  followUp = base * 0.3; // soften
    if (choice === "HOLD")   followUp = base * 0.6; // neutral
    if (choice === "DOUBLE") followUp = base * 1.2; // amplify

    if (followUp) {
      handleEvent({
        ...blackSwan,
        impactPct: followUp,
        title: `${blackSwan.title} (Aftershock)`,
      });
    }
    setBlackSwan(null);
  }

  // --- Game controls ---
  const startGame = () => {
    startSession();
    setActive(true);

    // kick off with one immediate event so feed isn't empty
    generateEvent({ type: "MACRO" })
      .then((result) => {
        if (result.success && result.event) {
          handleEvent(result.event);
        } else {
          // Fallback to mock data
          handleEvent(nextEvent());
        }
      })
      .catch((error) => {
        console.warn("Backend API failed on game start, using mock data:", error);
        handleEvent(nextEvent());
      });
  };

  const stopGame = () => {
    setActive(false);
    setPaused(false);
    sessionStartedRef.current = false;
    gameEndedRef.current = true;
  };

  const togglePause = () => {
    if (!isActive) return;
    setPaused((prev) => !prev);
  };

  // --- UI styles ---
  const containerStyle = {
    padding: "16px",
    fontFamily: "Arial, sans-serif",
    color: "white",
    textAlign: "center",
  };
  const timerStyle = { fontSize: "48px", fontWeight: "bold", marginBottom: "12px" };
  const statusBadgeStyle = {
    fontSize: "14px",
    padding: "2px 6px",
    borderRadius: "4px",
    backgroundColor: isActive && !paused ? "#28a745" : "#ffc107",
    fontWeight: "bold",
    marginLeft: "8px",
  };
  const buttonsStyle = { display: "flex", justifyContent: "center", gap: "8px", marginTop: "4px" };
  const btnBaseStyle = {
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer",
    color: "white",
  };
  const startStopStyle = { ...btnBaseStyle, backgroundColor: "#28a745" };
  const pauseResumeStyle = { ...btnBaseStyle, backgroundColor: "#ffc107" };
  const getEventStyle = (type) => ({
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: type === "MACRO" ? "#ff4d4f" : type === "BLACKSWAN" ? "#d81b60" : "#1890ff",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "bold",
    textAlign: "center",
    minWidth: "250px",
    color: "white",
    zIndex: 1200,
  });


  return (
    <div style={containerStyle}>
      {/* Black Swan decision modal - appears as popup overlay */}
      <BlackSwanModal 
        event={blackSwan} 
        open={!!blackSwan} 
        onChoose={resolveBlackSwan}
      />

      <div style={{ marginBottom: "8px" }}>
        <div style={{ fontSize: "14px", marginBottom: "8px", opacity: 0.8 }}>Game Time Remaining</div>
        <div style={{ fontSize: "56px", fontWeight: "bold", lineHeight: "1.2" }}>{formatTime(gameSeconds)}</div>
      </div>

      <div style={{ marginBottom: "4px" }}>
        <span style={statusBadgeStyle}>{isActive && !isPaused ? "LIVE" : "PAUSED"}</span>
      </div>

      {/* Only show buttons if parent is NOT controlling active state */}
      {controlledActive === undefined && (
        <div style={buttonsStyle}>
          <button
            style={startStopStyle}
            onClick={active ? stopGame : startGame}
          >
            {isActive ? "Stop" : "Start"}
          </button>
          <button
            style={!isActive ? { ...pauseResumeStyle, backgroundColor: "#ccc", cursor: "not-allowed" } : pauseResumeStyle}
            onClick={togglePause}
            disabled={!isActive}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        </div>
      )}
    </div>
  );
}
