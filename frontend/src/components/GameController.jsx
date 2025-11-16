import React, { useState, useEffect, useRef } from "react";
import { applyRound, getGameState, resetGame, ROUND_DURATION } from "../gameLogic";
import { generateEvent } from "../api/events";
import { nextEvent } from "../data/mockEvents"; // Fallback if API fails
import LeaderboardTrigger from "./LeaderboardTrigger";
import { useEventBus } from "./EventContext.jsx";
import { useBlackSwan } from "./useBlackSwan";
import BlackSwanModal from "./BlackSwanModal.jsx";

// ---- News cadence knobs ----
const NEWS_TARGET_PER_ROUND = 3;        // ↑ increase = more headlines per 30s round
const ROUND_SECONDS = ROUND_DURATION;   // 30
const NEWS_MEAN_SEC = ROUND_SECONDS / Math.max(1, NEWS_TARGET_PER_ROUND);
const NEWS_MIN_MS = Math.max(1500, NEWS_MEAN_SEC * 0.6 * 1000);
const NEWS_MAX_MS = NEWS_MEAN_SEC * 1.4 * 1000;
const NEWS_FIRE_PROB = 0.9;             // keep high; delay drives cadence

const INITIAL_PORTFOLIO = 20000;

const TITLES = [
  { minGain: 0,    title: "Novice Trader" },
  { minGain: 0.05, title: "Market Strategist" },
  { minGain: 0.15, title: "Senior Trader" },
  { minGain: 0.25, title: "Portfolio Manager" },
  { minGain: 0.4,  title: "Market Veteran" },
  { minGain: 0.6,  title: "Trading Legend" },
];

function calculateTitle(portfolioValue) {
  const gain = (portfolioValue - INITIAL_PORTFOLIO) / INITIAL_PORTFOLIO;
  for (let i = TITLES.length - 1; i >= 0; i--) {
    if (gain >= TITLES[i].minGain) return TITLES[i].title;
  }
  return TITLES[0].title;
}

export default function GameController({
  gameDuration = 300,
  playerName = "Player1",
  emitEvents = true,
  controlledActive,           // allow parent to control active state
  onRoundEnd,                 // optional callback when a round ends
}) {
  const totalRounds = Math.floor(gameDuration / ROUND_DURATION);
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

  const [seconds, setSeconds] = useState(ROUND_DURATION);
  const [gameSeconds, setGameSeconds] = useState(gameDuration);
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundOver, setRoundOver] = useState(false);
  const [eventMessage, setEventMessage] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Black Swan UI/state
  const [blackSwan, setBlackSwan] = useState(null);
  const [bsOccurredThisRound, setBsOccurredThisRound] = useState(false);
  
  // Force black swan in round 2 for testing
  const blackSwanForcedRef = useRef(false);

  // parent-controlled active flag (if provided)
  const isActive = controlledActive ?? active;

  // StrictMode-safe emitter guard
  const loopRef = useRef({ running: false, timeoutId: null });

  // --- Countdown timers (internal to GameController card) ---
  useEffect(() => {
    if (!isActive || paused) return;

    if (seconds <= 0) {
      endRound();
      return;
    }
    if (gameSeconds <= 0) {
      stopGame();
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
      setGameSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, paused, seconds, gameSeconds]);

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

      if (!paused && !roundOver && Math.random() < NEWS_FIRE_PROB) {
        const event = await fetchEventFromAPI();
        handleEvent(event);
      }
      const nextTimeout = NEWS_MIN_MS + Math.random() * (NEWS_MAX_MS - NEWS_MIN_MS); 
      loopRef.current.timeoutId = setTimeout(scheduleEvent, nextTimeout);
    };

    scheduleEvent();

    return () => {
      cancelled = true;
      if (loopRef.current.timeoutId) clearTimeout(loopRef.current.timeoutId);
      loopRef.current.running = false;
      loopRef.current.timeoutId = null;
    };
  }, [isActive, paused, roundOver, emitEvents]);

  // Force black swan in round 2 for testing
  useEffect(() => {
    if (roundNumber === 2 && isActive && !paused && !blackSwanForcedRef.current) {
      blackSwanForcedRef.current = true;
      const timer = setTimeout(() => {
        generateEvent({ forceBlackSwan: true })
          .then((result) => {
            if (result.success && result.event) {
              setBsOccurredThisRound(true);
              setBlackSwan(result.event);
              handleEvent(result.event);
            }
          })
          .catch((error) => {
            console.error("Error generating forced black swan:", error);
          });
      }, 2000); // Wait 2 seconds after round 2 starts
      
      return () => clearTimeout(timer);
    }
  }, [roundNumber, isActive, paused]);

  // --- Black Swan emitter (rare, Poisson-timed) ---
  // For testing: much faster frequency (15 seconds average, 5-30 second range)
  const blackSwanActive = isActive && (emitEvents !== false);
  
  useBlackSwan({
    active: blackSwanActive,
    meanIntervalSec: 15, // avg every ~15 seconds for testing (was 120)
    useBackendAPI: true,  // Use backend API for blackswan events
    onEvent: (ev) => {
      setBsOccurredThisRound(true);
      setBlackSwan(ev);       // open modal popup
      handleEvent(ev);
    },
  });

  // --- Handle event impact & publish to feed ---
  function handleEvent(event) {
    setGameState((prev) => {
      if (!prev) return prev;

      const rawImpact = event.impactPct || 0;
      const impactAbs = Math.round(prev.portfolioValue * rawImpact);
      const newPortfolio = Math.max(0, prev.portfolioValue + impactAbs);

      const updated = {
        ...prev,
        portfolioValue: newPortfolio,
        title: calculateTitle(newPortfolio),
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
  }

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
    const newState = resetGame(playerName);
    if (!newState) return console.error("resetGame() returned undefined!");

    setGameState(newState);
    setSeconds(ROUND_DURATION);
    setGameSeconds(gameDuration);
    setActive(true);
    setPaused(false);
    setRoundNumber(1);
    setRoundOver(false);
    setEventMessage(null);
    setLeaderboard([]);
    setBsOccurredThisRound(false);
    setBlackSwan(null);
    blackSwanForcedRef.current = false; // Reset forced flag

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
    setRoundOver(false);
  };

  const togglePause = () => {
    if (!isActive) return;
    if (!paused) {
      setPaused(true);
    } else {
      setPaused(false);
      if (roundOver) {
        setRoundOver(false);
        setSeconds(ROUND_DURATION);
        const newRound = roundNumber + 1;
        setRoundNumber(newRound);
        setBsOccurredThisRound(false); // new round
        
        // Force black swan in round 2 for testing
        if (newRound === 2 && !blackSwanForcedRef.current) {
          blackSwanForcedRef.current = true;
          console.log("[GameController] Forcing black swan in round 2...");
          setTimeout(() => {
            generateEvent({ forceBlackSwan: true })
              .then((result) => {
                if (result.success && result.event) {
                  console.log("[GameController] Forced black swan event:", result.event);
                  setBsOccurredThisRound(true);
                  setBlackSwan(result.event);
                  handleEvent(result.event);
                } else {
                  console.error("[GameController] Failed to generate forced black swan");
                }
              })
              .catch((error) => {
                console.error("[GameController] Error generating forced black swan:", error);
              });
          }, 2000); // Wait 2 seconds after round starts
        }
      }
    }
  };

  const endRound = () => {
    if (!gameState) return;

    setGameState((prev) => ({
      ...(
        applyRound({
          portfolioValue: prev.portfolioValue,
          blackSwanOccurred: bsOccurredThisRound,
          blackSwanType: bsOccurredThisRound ? (blackSwan?.id || "occurred") : null,
        }) || prev
      ),
      title: calculateTitle(prev.portfolioValue),
      roundsCompleted: roundNumber,
    }));

    // leaderboard snapshot
    const entry = {
      playerName,
      portfolioValue: gameState.portfolioValue,
      title: calculateTitle(gameState.portfolioValue),
      roundsCompleted: roundNumber,
      timestamp: Date.now(),
    };
    setLeaderboard((prev) => {
      const updated = [...prev.filter((e) => e.playerName !== playerName), entry];
      updated.sort((a, b) => b.portfolioValue - a.portfolioValue);
      return updated;
    });

    // Notify parent that the round has ended (for persistence, etc.)
    if (typeof onRoundEnd === "function") {
      try {
        onRoundEnd({
          roundNumber,
          totalRounds,
          portfolioValue: gameState.portfolioValue,
          blackSwanOccurred: bsOccurredThisRound,
        });
      } catch (error) {
        console.error("Error in onRoundEnd callback:", error);
      }
    }

    if (roundNumber >= totalRounds) {
      stopGame();
    } else {
      setPaused(true);
      setRoundOver(true);
    }
  };

  // --- UI styles ---
  const containerStyle = {
    padding: "16px",
    fontFamily: "Arial, sans-serif",
    color: "white",
    textAlign: "center",
  };
  const timerStyle = { fontSize: "32px", fontWeight: "bold", marginBottom: "12px" };
  const statusBadgeStyle = {
    fontSize: "14px",
    padding: "2px 6px",
    borderRadius: "4px",
    backgroundColor: isActive && !paused ? "#28a745" : "#ffc107",
    fontWeight: "bold",
    marginLeft: "8px",
  };
  const buttonsStyle = { display: "flex", justifyContent: "center", gap: "8px", marginTop: "12px" };
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
  const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
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

      <div style={{ marginBottom: "16px" }}>
        <strong>Game Time:</strong> {formatTime(gameSeconds)}
      </div>

      <div style={timerStyle}>
        {String(seconds).padStart(2, "0")}s
        <span style={statusBadgeStyle}>{isActive && !paused ? "LIVE" : "PAUSED"}</span>
      </div>

      <div>
        <div><strong>Round:</strong> {roundNumber} / {totalRounds}</div>
        <div><strong>Portfolio:</strong> ${gameState.portfolioValue.toLocaleString()}</div>
        <div><strong>Title:</strong> {gameState.title}</div>
      </div>

      {/* If parent is controlling active state, gray out the internal Start/Stop */}
      <div style={buttonsStyle}>
        <button
          style={{
            ...startStopStyle,
            opacity: controlledActive !== undefined ? 0.5 : 1,
            pointerEvents: controlledActive !== undefined ? "none" : "auto",
          }}
          onClick={active ? stopGame : startGame}
        >
          {isActive ? "Stop" : "Start"}
        </button>
        <button
          style={!isActive ? { ...pauseResumeStyle, backgroundColor: "#ccc", cursor: "not-allowed" } : pauseResumeStyle}
          onClick={togglePause}
          disabled={!isActive}
        >
          {paused && !roundOver ? "Resume" : "Pause"}
        </button>
      </div>

      {eventMessage && <div style={getEventStyle(eventMessage.type)}>{eventMessage.text}</div>}

      {roundOver && (
        <LeaderboardTrigger
          leaderboard={leaderboard}
          playerName={playerName}
          roundNumber={roundNumber}
          onResume={togglePause}
        />
      )}
    </div>
  );
}
