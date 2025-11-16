import { useCallback } from "react";
import { saveRoundScore } from "../api/roundScores";
import { useGameContext } from "../contexts/GameContext";

/**
 * Hook for managing round score operations
 */
export function useRoundScore() {
  const { currentRoundId, currentParticipantId } = useGameContext();

  /**
   * Calculate if player reacted to event
   * @param {Array} recentTrades - Array of trade records
   * @param {Object} lastEvent - Last event object
   * @param {number} eventTimestamp - Event timestamp in ms
   * @returns {Object} {reacted: boolean, reactionMs: number|null}
   */
  const calculateReaction = useCallback((recentTrades, lastEvent, eventTimestamp) => {
    if (!lastEvent || !eventTimestamp || !recentTrades || recentTrades.length === 0) {
      return { reacted: false, reactionMs: null };
    }

    // Find first trade after event (within 10 seconds)
    const REACTION_WINDOW_MS = 10000; // 10 seconds
    const tradesAfterEvent = recentTrades.filter(
      (trade) => trade.timestamp >= eventTimestamp && trade.timestamp <= eventTimestamp + REACTION_WINDOW_MS
    );

    if (tradesAfterEvent.length === 0) {
      return { reacted: false, reactionMs: null };
    }

    // Get first trade after event
    const firstTrade = tradesAfterEvent.reduce((earliest, trade) => {
      return trade.timestamp < earliest.timestamp ? trade : earliest;
    }, tradesAfterEvent[0]);

    const reactionMs = firstTrade.timestamp - eventTimestamp;
    return { reacted: true, reactionMs };
  }, []);

  /**
   * Save round score
   * @param {Object} params - {totalPnL, lastRoundPnL, recentTrades, lastEvent, eventTimestamp}
   * @returns {Promise<{success: boolean, score?: Object, error?: string}>}
   */
  const saveScore = useCallback(
    async ({ totalPnL, lastRoundPnL, recentTrades, lastEvent, eventTimestamp }) => {
      if (!currentRoundId || !currentParticipantId) {
        console.warn("Cannot save round score: round or participant not initialized");
        return { success: false, error: "Round or participant not initialized" };
      }

      // Calculate pnl_delta
      const pnlDelta = totalPnL - (lastRoundPnL || 0);

      // Calculate reaction
      const { reacted, reactionMs } = calculateReaction(recentTrades, lastEvent, eventTimestamp);

      // Save to database
      const result = await saveRoundScore({
        participant_id: currentParticipantId,
        round_id: currentRoundId,
        pnl_delta: pnlDelta,
        reacted: reacted,
        reaction_ms: reactionMs,
      });

      if (!result.success) {
        console.error("Failed to save round score:", result.error);
      }

      return result;
    },
    [currentRoundId, currentParticipantId, calculateReaction]
  );

  return {
    saveScore,
    calculateReaction,
  };
}

