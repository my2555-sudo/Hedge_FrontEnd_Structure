import React, { useState, useEffect, useRef } from "react";
import { applyRound, getGameState, resetGame, ROUND_DURATION } from "../gameLogic";
import { nextEvent } from "../data/mockEvents";
import LeaderboardTrigger from "./LeaderboardTrigger";
import { useEventBus } from "./EventContext.jsx";
import { useBlackSwan } from "./useBlackSwan";
import BlackSwanModal from "./BlackSwanModal.jsx";

// ---- News cadence knobs (busy feed) ----
const NEWS_TARGET_PER_ROUND = 8;
const ROUND_SECONDS = ROUND_DURATION; // 30
const NEWS_MIN_MS = 1000;
const NEWS_MAX_MS = 2500;
const NEWS_FIRE_PROB = 1.0;

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
  controlledActive, // parent can drive active flag
}) {
  const totalRounds = Math.floor(gameDuration / ROUND_DURATION);
  const { publishEvent } = useEventBus(); // persist + realtime broadcast

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

  const [blackSwan, setBlackSwan] = useState(null);
  const [bsOccurredThisRound, setBsOccurredThisRound] = useState(false);

  const isActive = controlledActive ?? active;
  const loopRef = useRef({ running: false, timeoutId: null });

  // Internal timer
  useEffect(() => {
    if (!isActive || paused) return;
    if (seconds <= 0) { endRound(); return; }
    if (gameSeconds <= 0) { stopGame(); return; }

    const t = setInterval(() => {
      setSeconds((p) => p - 1);
      setGameSeconds((p) => p - 1);
    }, 1000);
    return () => clearInterval(t);
  }, [isActive, paused, seconds, gameSeconds]);

  // Normal events loop
  useEffect(() => {
    if (!isActive || !emitEvents) return;
    if (loopRef.current.running) return;
    loopRef.current.running = true;

    let cancelled = false;
    const schedule = () => {
      if (cancelled) return;
      if (!paused && !roundOver && Math.random() < NEWS_FIRE_PROB) {
        handleEvent(nextEvent());
      }
      const next = NEWS_MIN_MS + Math.random() * (NEWS_MAX_MS - NEWS_MIN_MS);
      loopRef.current.timeoutId = setTimeout(schedule, next);
    };
    schedule();

    return () => {
      cancelled = true;
      if (loopRef.current.timeoutId) clearTimeout(loopRef.current.timeoutId);
      loopRef.current.running = false;
      loopRef.current.timeoutId = null;
    };
  }, [isActive, paused, roundOver, emitEvents]);

  // Black Swan (rare)
  useBlackSwan({
    active: isActive && emitEvents,
    meanIntervalSec: 45,
    onEvent: (ev) => {
      setBsOccurredThisRound(true);
      setBlackSwan(ev);
      handleEvent(ev, { isBlackSwan: true });
    },
  });

  // Handle one event: update score locally + publish to server
  function handleEvent(event /*, opts = {} */) {
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

      // Persist → DB (EventProvider will map & dedupe via realtime)
      publishEvent({ ...event, ts: Date.now() }).catch(console.error);

      // Toast
      setEventMessage({
        text: `${event.title} (${impactAbs >= 0 ? "+" : ""}${impactAbs})`,
        type: event.type,
      });
      setTimeout(() => setEventMessage(null), 3000);

      return updated;
    });
  }

  function resolveBlackSwan(choice) {
    if (!blackSwan) return;
    const base = blackSwan.impactPct || 0;

    let followUp = 0;
    if (choice === "HEDGE")  followUp = base * 0.3;
    if (choice === "HOLD")   followUp = base * 0.6;
    if (choice === "DOUBLE") followUp = base * 1.2;

    if (followUp) {
      handleEvent({ ...blackSwan, impactPct: followUp, title: `${blackSwan.title} (Aftershock)` });
    }
    setBlackSwan(null);
  }

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

    // seed the feed so panel isn't empty
    try { handleEvent(nextEvent()); } catch (e) { console.error(e); }
  };

  const stopGame = () => { setActive(false); setPaused(false); setRoundOver(false); };

  const togglePause = () => {
    if (!isActive) return;
    if (!paused) {
      setPaused(true);
    } else {
      setPaused(false);
      if (roundOver) {
        setRoundOver(false);
        setSeconds(ROUND_DURATION);
        setRoundNumber((p) => p + 1);
        setBsOccurredThisRound(false);
      }
    }
  };

  const endRound = () => {
    if (!gameState) return;

    setGameState((prev) => ({
      ...(applyRound({
        portfolioValue: prev.portfolioValue,
        blackSwanOccurred: bsOccurredThisRound,
        blackSwanType: bsOccurredThisRound ? (blackSwan?.id || "occurred") : null,
      }) || prev),
      title: calculateTitle(prev.portfolioValue),
      roundsCompleted: roundNumber,
    }));

    const entry = {
      playerName,
      portfolioValue: gameState.portfolioValue,
      title: calculateTitle(gameState.portfolioValue),
      roundsCompleted: roundNumber,
      timestamp: Date.now(),
    };
    setLeaderboard((prev) => {
      const u = [...prev.filter((e) => e.playerName !== playerName), entry];
      u.sort((a, b) => b.portfolioValue - a.portfolioValue);
      return u;
    });

    if (roundNumber >= totalRounds) {
      stopGame();
    } else {
      setPaused(true);
      setRoundOver(true);
    }
  };

  // --- UI ---
  const containerStyle = { padding: "16px", fontFamily: "Arial, sans-serif", color: "white", textAlign: "center" };
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
  const btnBaseStyle = { padding: "8px 16px", border: "none", borderRadius: "6px", fontSize: "14px", cursor: "pointer", color: "white" };
  const startStopStyle = { ...btnBaseStyle, backgroundColor: "#28a745" };
  const pauseResumeStyle = { ...btnBaseStyle, backgroundColor: "#ffc107" };
  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const getEventStyle = (type) => ({
    position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)",
    backgroundColor: type === "MACRO" ? "#ff4d4f" : type === "BLACKSWAN" ? "#d81b60" : "#1890ff",
    padding: "8px 16px", borderRadius: "6px", fontSize: "16px", fontWeight: "bold",
    textAlign: "center", minWidth: "250px", color: "white", zIndex: 1200,
  });

  return (
    <div style={containerStyle}>
      <BlackSwanModal event={blackSwan} open={!!blackSwan} onChoose={resolveBlackSwan} />

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
