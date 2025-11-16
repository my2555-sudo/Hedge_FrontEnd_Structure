import { useCallback } from "react";
import { createPriceSnapshots } from "../api/priceSnapshots";
import { useGameContext } from "../contexts/GameContext";

/**
 * Hook for managing price snapshot operations
 */
export function usePriceSnapshots() {
  const { currentGameId, currentRoundId, tickerIdMap } = useGameContext();

  /**
   * Capture price snapshots for all tickers in portfolio
   * @param {Array} portfolio - Portfolio array with {ticker, price, ...}
   * @param {number|null} overrideGameId - Optional game ID to override context value
   * @param {number|null} overrideRoundId - Optional round ID to override context value
   * @returns {Promise<{success: boolean, count?: number, error?: string}>}
   */
  const captureSnapshots = useCallback(
    async (portfolio, overrideGameId = null, overrideRoundId = null) => {
      const gameId = overrideGameId || currentGameId;
      const roundId = overrideRoundId || currentRoundId;

      if (!gameId || !roundId) {
        console.warn("Cannot capture snapshots: game or round not initialized", {
          gameId,
          roundId,
          overrideGameId,
          overrideRoundId,
          currentGameId,
          currentRoundId,
        });
        return { success: false, error: "Game or round not initialized" };
      }

      if (!portfolio || portfolio.length === 0) {
        return { success: false, error: "Portfolio is empty" };
      }

      // Build snapshots array
      const snapshots = portfolio
        .map((row) => {
          const tickerId = tickerIdMap[row.ticker];
          if (!tickerId) {
            console.warn(`Ticker ID not found for symbol: ${row.ticker}`);
            return null;
          }

          return {
            game_id: gameId,
            round_id: roundId,
            ticker_id: tickerId,
            price: row.price,
          };
        })
        .filter((snapshot) => snapshot !== null); // Remove null entries

      if (snapshots.length === 0) {
        return { success: false, error: "No valid ticker IDs found" };
      }

      // Save to database
      const result = await createPriceSnapshots(snapshots);

      if (!result.success) {
        console.error("Failed to capture price snapshots:", result.error);
      }

      return result;
    },
    [currentGameId, currentRoundId, tickerIdMap]
  );

  return {
    captureSnapshots,
  };
}

