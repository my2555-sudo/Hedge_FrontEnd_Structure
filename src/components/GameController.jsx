import React, { useState, useEffect } from "react";
import { applyRound, getGameState, resetGame, ROUND_DURATION } from "../gameLogic";
import { nextEvent } from "../data/mockEvents";
import LeaderboardTrigger from "./LeaderboardTrigger";

const INITIAL_PORTFOLIO = 20000;

const TITLES = [
  { minGain: 0, title: "Novice Trader" },
  { minGain: 0.05, title: "Market Strategist" },
  { minGain: 0.15, title: "Senior Trader" },
  { minGain: 0.25, title: "Portfolio Manager" },
  { minGain: 0.4, title: "Market Veteran" },
  { minGain: 0.6, title: "Trading Legend" },
];

function calculateTitle(portfolioValue) {
  const gain = (portfolioValue - INITIAL_PORTFOLIO) / INITIAL_PORTFOLIO;
  for (let i = TITLES.length - 1; i >= 0; i--) {
    if (gain >= TITLES[i].minGain) return TITLES[i].title;
  }
  return TITLES[0].title;
}

export default function GameController({ gameDuration = 300, playerName = "Player1" }) {
  const totalRounds = Math.floor(gameDuration / ROUND_DURATION);

  const [gameState, setGameState] = useState(() => getGameState() || {
    portfolioValue: INITIAL_PORTFOLIO,
    roundsCompleted: 0,
    title: "Novice Trader",
    playerName,
  });

  const [seconds, setSeconds] = useState(ROUND_DURATION);
  const [gameSeconds, setGameSeconds] = useState(gameDuration);
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundOver, setRoundOver] = useState(false);
  const [eventMessage, setEventMessage] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // --- Countdown timers ---
  useEffect(() => {
    if (!active || paused) return;

    if (seconds <= 0) {
      endRound();
      return;
    }

    if (gameSeconds <= 0) {
      stopGame();
      return;
    }

    const timer = setInterval(() => {
      setSeconds(prev => prev - 1);
      setGameSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [active, paused, seconds, gameSeconds]);

  // --- Random event generation ---
  useEffect(() => {
    if (!active) return;

    let isCancelled = false;

    const scheduleEvent = () => {
      if (isCancelled) return;

      if (!paused && !roundOver && Math.random() < 0.4) {
        const event = nextEvent();
        handleEvent(event);
      }

      const nextTimeout = 15000 + Math.random() * 20000;
      setTimeout(scheduleEvent, nextTimeout);
    };

    scheduleEvent();
    return () => { isCancelled = true; };
  }, [active, paused, roundOver]);

  // --- Handle event impact ---
  function handleEvent(event) {
    setGameState(prevState => {
      if (!prevState) return prevState;
      const impact = Math.round(prevState.portfolioValue * (event.impactPct || 0));
      const newPortfolio = Math.max(0, prevState.portfolioValue + impact);

      const updatedState = {
        ...prevState,
        portfolioValue: newPortfolio,
        title: calculateTitle(newPortfolio),
      };

      setEventMessage({
        text: `${event.title} (${impact >= 0 ? "+" : ""}${impact})`,
        type: event.type,
      });
      setTimeout(() => setEventMessage(null), 3000);

      return updatedState;
    });
  }

  // --- Game control functions ---
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
  };

  const stopGame = () => {
    setActive(false);
    setPaused(false);
    setRoundOver(false);
  };

  const togglePause = () => {
    if (!active) return;

    if (!paused) {
      setPaused(true);
    } else {
      setPaused(false);
      if (roundOver) {
        setRoundOver(false);
        setSeconds(ROUND_DURATION);
        setRoundNumber(prev => prev + 1);
      }
    }
  };

  const endRound = () => {
    if (!gameState) return;

    setGameState(prev => ({
      ...applyRound({ portfolioValue: prev.portfolioValue, blackSwanOccurred: false }) || prev,
      title: calculateTitle(prev.portfolioValue),
      roundsCompleted: roundNumber,
    }));

    // --- Leaderboard update ---
    const entry = {
      playerName,
      portfolioValue: gameState.portfolioValue,
      title: calculateTitle(gameState.portfolioValue),
      roundsCompleted: roundNumber,
      timestamp: Date.now(),
    };
    setLeaderboard(prev => {
      const updated = [...prev.filter(e => e.playerName !== playerName), entry];
      updated.sort((a, b) => b.portfolioValue - a.portfolioValue);
      return updated;
    });

    if (roundNumber >= totalRounds) {
      stopGame();
    } else {
      setPaused(true);
      setRoundOver(true);
    }
  };

  // --- UI Styling ---
  const containerStyle = {
    padding: "16px",
    fontFamily: "Arial, sans-serif",
    color: "white",
    textAlign: "center",
  };

  const timerStyle = {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "12px",
  };

  const statusBadgeStyle = {
    fontSize: "14px",
    padding: "2px 6px",
    borderRadius: "4px",
    backgroundColor: active && !paused ? "#28a745" : "#ffc107",
    fontWeight: "bold",
    marginLeft: "8px",
  };

  const buttonsStyle = {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginTop: "12px",
  };

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
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60)
      .toString()
      .padStart(2, "0")}`;

  const getEventStyle = (type) => ({
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: type === "MACRO" ? "#ff4d4f" : "#1890ff",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "bold",
    textAlign: "center",
    minWidth: "250px",
    color: "white",
    zIndex: 1200,
  });

  // --- Render ---
  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: "16px" }}>
        <strong>Game Time:</strong> {formatTime(gameSeconds)}
      </div>

      <div style={timerStyle}>
        {String(seconds).padStart(2, "0")}s
        <span style={statusBadgeStyle}>{active && !paused ? "LIVE" : "PAUSED"}</span>
      </div>

      <div>
        <div><strong>Round:</strong> {roundNumber} / {totalRounds}</div>
        <div><strong>Portfolio:</strong> ${gameState.portfolioValue.toLocaleString()}</div>
        <div><strong>Title:</strong> {gameState.title}</div>
      </div>

      <div style={buttonsStyle}>
        <button style={startStopStyle} onClick={active ? stopGame : startGame}>
          {active ? "Stop" : "Start"}
        </button>
        <button
          style={!active ? { ...pauseResumeStyle, backgroundColor: "#ccc", cursor: "not-allowed" } : pauseResumeStyle}
          onClick={togglePause}
          disabled={!active}
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
