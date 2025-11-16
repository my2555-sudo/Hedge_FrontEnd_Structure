/**
 * API service for games and rounds
 * Connects to the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Create or get a game
 * @param {Object} gameData - {code?, starting_cash, status}
 * @returns {Promise<{success: boolean, game?: Object, error?: string}>}
 */
export async function createOrGetGame(gameData = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: gameData.code || null,
        starting_cash: gameData.starting_cash || 10000,
        status: gameData.status || "active",
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create/get game: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, game: data.game };
  } catch (error) {
    console.error("Error creating/getting game:", error);
    return { success: false, error: error.message, game: null };
  }
}

/**
 * Get a game by ID
 * @param {number} gameId
 * @returns {Promise<{success: boolean, game?: Object, error?: string}>}
 */
export async function getGameById(gameId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "Game not found", game: null };
      }
      throw new Error(`Failed to fetch game: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, game: data.game };
  } catch (error) {
    console.error("Error fetching game:", error);
    return { success: false, error: error.message, game: null };
  }
}

/**
 * Create or get a round
 * @param {Object} roundData - {game_id, round_no}
 * @returns {Promise<{success: boolean, round?: Object, error?: string}>}
 */
export async function createOrGetRound(roundData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games/rounds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        game_id: roundData.game_id,
        round_no: roundData.round_no,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create/get round: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, round: data.round };
  } catch (error) {
    console.error("Error creating/getting round:", error);
    return { success: false, error: error.message, round: null };
  }
}

/**
 * Get a round by ID
 * @param {number} roundId
 * @returns {Promise<{success: boolean, round?: Object, error?: string}>}
 */
export async function getRoundById(roundId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games/rounds/${roundId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "Round not found", round: null };
      }
      throw new Error(`Failed to fetch round: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, round: data.round };
  } catch (error) {
    console.error("Error fetching round:", error);
    return { success: false, error: error.message, round: null };
  }
}

/**
 * End a round
 * @param {number} roundId
 * @returns {Promise<{success: boolean, round?: Object, error?: string}>}
 */
export async function endRound(roundId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/games/rounds/${roundId}/end`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "Round not found", round: null };
      }
      throw new Error(`Failed to end round: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, round: data.round };
  } catch (error) {
    console.error("Error ending round:", error);
    return { success: false, error: error.message, round: null };
  }
}

