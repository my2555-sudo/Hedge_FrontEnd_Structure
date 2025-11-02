import React, { useState, useEffect } from "react";
import { applyRound, getGameState, resetGame, formatTime, GAME_DURATIONS } from "../gameLogic";

export default function GameController({ initialDuration = GAME_DURATIONS.SHORT, onGameEnd, playerName = "Player1" }) {
  // Safe initialization of gameState
  const [gameState, setGameState] = useState(() => {
    const state = getGameState() || {
      score: 0,
      portfolioValue: 20000,
      streak: 0,
      roundsCompleted: 0,
      title: "Novice Trader",
      blackSwanOccurred: false,
      blackSwanType: null,
      playerName
    };
    return state;
  });

  const [seconds, setSeconds] = useState(initialDuration);
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (active && !paused && seconds > 0) {
      timer = setInterval(() => setSeconds(prev => prev - 1), 1000);
    } else if (seconds <= 0 && active) {
      endRound();
    }
    return () => clearInterval(timer);
  }, [active, paused, seconds]);

  // Start game
  const startGame = () => {
    const newState = resetGame(playerName); // Pass playerName
    if (!newState) {
      console.error("resetGame() returned undefined!");
      return;
    }
    setGameState(newState);
    setSeconds(initialDuration);
    setActive(true);
    setPaused(false);
    setRoundNumber(1);
  };

  // Stop game
  const stopGame = () => {
    setActive(false);
    onGameEnd?.(gameState);
  };

  // Pause/resume toggle
  const togglePause = () => setPaused(prev => !prev);

  // End round
  const endRound = () => {
    if (!gameState) return;

    const portfolioValue = Math.max(0, gameState.portfolioValue + Math.floor(Math.random() * 2000 - 500));
    const blackSwanOccurred = Math.random() < 0.1;
    const updatedState = applyRound({ portfolioValue, blackSwanOccurred });

    if (!updatedState) {
      console.error("applyRound() returned undefined!");
      return;
    }

    setGameState(updatedState);

    if (roundNumber >= Math.floor(initialDuration / 30)) {
      stopGame();
    } else {
      setRoundNumber(prev => prev + 1);
      setSeconds(30);
    }
  };

  // Inline styles
  const containerStyle = { padding: "16px", fontFamily: "Arial, sans-serif" };
  const statusStyle = { marginBottom: "12px", fontSize: "16px", color: "white" };
  const buttonsStyle = { display: "flex", gap: "8px" };
  const btnBaseStyle = { padding: "8px 16px", border: "none", borderRadius: "6px", fontSize: "14px", cursor: "pointer", color: "white" };
  const startStopStyle = { ...btnBaseStyle, backgroundColor: "#28a745" };
  const pauseResumeStyle = { ...btnBaseStyle, backgroundColor: "#ffc107" };
  const disabledStyle = { backgroundColor: "#ccc", cursor: "not-allowed" };

  if (!gameState) return <div style={{ color: "white" }}>Loading game...</div>;

  return (
    <div style={containerStyle}>
      <div style={statusStyle}>
        <strong>Round:</strong> {roundNumber} | <strong>Time:</strong> {formatTime(seconds)} | <strong>Score:</strong> {gameState.score}
      </div>
      <div style={buttonsStyle}>
        <button
          style={startStopStyle}
          onClick={active ? stopGame : startGame}
        >
          {active ? "Stop" : "Start"}
        </button>
        <button
          style={!active ? { ...pauseResumeStyle, ...disabledStyle } : paused ? pauseResumeStyle : { ...pauseResumeStyle }}
          onClick={togglePause}
          disabled={!active}
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </div>
    </div>
  );
}
