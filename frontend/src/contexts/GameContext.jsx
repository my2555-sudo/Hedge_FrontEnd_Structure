import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createOrGetGame } from "../api/games";
import { createOrGetRound, endRound as endRoundAPI } from "../api/games";
import { getOrCreateGameParticipant } from "../api/gameParticipants";
import { useAuth } from "./AuthContext";

const GameContext = createContext({
  currentGameId: null,
  currentRoundId: null,
  currentParticipantId: null,
  tickerIdMap: {},
  setCurrentGameId: () => {},
  setCurrentRoundId: () => {},
  setCurrentParticipantId: () => {},
  setTickerIdMap: () => {},
  initializeGame: async () => {},
  initializeRound: async () => {},
  endCurrentRound: async () => {},
});

export function GameProvider({ children }) {
  const { user } = useAuth();
  const [currentGameId, setCurrentGameId] = useState(null);
  const [currentRoundId, setCurrentRoundId] = useState(null);
  const [currentParticipantId, setCurrentParticipantId] = useState(null);
  const [tickerIdMap, setTickerIdMap] = useState({}); // symbol → id mapping

  /**
   * Initialize game - create or get game and participant
   */
  const initializeGame = useCallback(async (startingCash = 10000) => {
    if (!user?.id) {
      console.warn("Cannot initialize game: user not logged in");
      return { success: false };
    }

    try {
      // Create or get game
      const gameResult = await createOrGetGame({
        starting_cash: startingCash,
        status: "active",
      });

      if (!gameResult.success || !gameResult.game) {
        console.error("Failed to create/get game:", gameResult.error);
        return { success: false, error: gameResult.error };
      }

      const gameId = gameResult.game.id;
      setCurrentGameId(gameId);

      // Get or create participant
      const participantResult = await getOrCreateGameParticipant(
        user.id,
        gameId,
        startingCash
      );

      if (!participantResult.success || !participantResult.participant) {
        console.error("Failed to get/create participant:", participantResult.error);
        return { success: false, error: participantResult.error };
      }

      const participantId = participantResult.participant.id;
      setCurrentParticipantId(participantId);

      return {
        success: true,
        gameId,
        participantId,
      };
    } catch (error) {
      console.error("Error initializing game:", error);
      return { success: false, error: error.message };
    }
  }, [user]);

  /**
   * Initialize round - create or get round for current game.
   * Optionally accepts an explicit gameId to avoid race conditions when game
   * state was just created and React state hasn't updated yet.
   */
  const initializeRound = useCallback(
    async (roundNo, overrideGameId = null) => {
      const gameIdToUse = overrideGameId || currentGameId;

      if (!gameIdToUse) {
        console.warn("Cannot initialize round: game not initialized", {
          currentGameId,
          overrideGameId,
        });
        return { success: false, error: "Game not initialized" };
      }

      try {
        const roundResult = await createOrGetRound({
          game_id: gameIdToUse,
          round_no: roundNo,
        });

        if (!roundResult.success || !roundResult.round) {
          console.error("Failed to create/get round:", roundResult.error);
          return { success: false, error: roundResult.error };
        }

        const roundId = roundResult.round.id;
        setCurrentRoundId(roundId);

        return {
          success: true,
          roundId,
        };
      } catch (error) {
        console.error("Error initializing round:", error);
        return { success: false, error: error.message };
      }
    },
    [currentGameId]
  );

  /**
   * End current round
   */
  const endCurrentRound = useCallback(async () => {
    if (!currentRoundId) {
      return { success: false, error: "No active round" };
    }

    try {
      const result = await endRoundAPI(currentRoundId);
      if (result.success) {
        setCurrentRoundId(null); // Clear current round
      }
      return result;
    } catch (error) {
      console.error("Error ending round:", error);
      return { success: false, error: error.message };
    }
  }, [currentRoundId]);

  const value = {
    currentGameId,
    currentRoundId,
    currentParticipantId,
    tickerIdMap,
    setCurrentGameId,
    setCurrentRoundId,
    setCurrentParticipantId,
    setTickerIdMap,
    initializeGame,
    initializeRound,
    endCurrentRound,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within GameProvider");
  }
  return context;
}

