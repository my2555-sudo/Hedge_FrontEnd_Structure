/**
 * API service for round scores
 * Connects to the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Create a round score
 * @param {Object} scoreData - {participant_id, round_id, pnl_delta, reacted, reaction_ms?}
 * @returns {Promise<{success: boolean, score?: Object, error?: string}>}
 */
export async function saveRoundScore(scoreData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/round-scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        participant_id: scoreData.participant_id,
        round_id: scoreData.round_id,
        pnl_delta: scoreData.pnl_delta,
        reacted: scoreData.reacted,
        reaction_ms: scoreData.reaction_ms || null,
      }),
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = `Failed to save round score: ${response.status} ${response.statusText}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use the text
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const data = JSON.parse(responseText);
    
    // Handle different response formats
    if (data.score) {
      return { success: true, score: data.score };
    } else if (data.success && data.score) {
      return { success: true, score: data.score };
    } else if (data.id) {
      // If response is the score object directly
      return { success: true, score: data };
    } else {
      return { success: true, score: data };
    }
  } catch (error) {
    console.error("Error saving round score:", error);
    return { success: false, error: error.message, score: null };
  }
}

/**
 * Get round scores by round ID
 * @param {number} roundId
 * @returns {Promise<{success: boolean, scores?: Array, count?: number, error?: string}>}
 */
export async function getRoundScoresByRound(roundId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/round-scores?round_id=${roundId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch round scores: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, scores: data.scores || [], count: data.count || 0 };
  } catch (error) {
    console.error("Error fetching round scores:", error);
    return { success: false, error: error.message, scores: [], count: 0 };
  }
}

/**
 * Get round scores by participant ID
 * @param {number} participantId
 * @returns {Promise<{success: boolean, scores?: Array, count?: number, error?: string}>}
 */
export async function getRoundScoresByParticipant(participantId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/round-scores?participant_id=${participantId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch round scores: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, scores: data.scores || [], count: data.count || 0 };
  } catch (error) {
    console.error("Error fetching round scores:", error);
    return { success: false, error: error.message, scores: [], count: 0 };
  }
}

