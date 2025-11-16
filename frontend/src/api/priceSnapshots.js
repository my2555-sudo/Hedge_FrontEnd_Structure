/**
 * API service for price snapshots
 * Connects to the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Create a single price snapshot
 * @param {Object} snapshotData - {game_id, round_id, ticker_id, price}
 * @returns {Promise<{success: boolean, snapshot?: Object, error?: string}>}
 */
export async function createPriceSnapshot(snapshotData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/price-snapshots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        game_id: snapshotData.game_id,
        round_id: snapshotData.round_id,
        ticker_id: snapshotData.ticker_id,
        price: snapshotData.price,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create price snapshot: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, snapshot: data.snapshot };
  } catch (error) {
    console.error("Error creating price snapshot:", error);
    return { success: false, error: error.message, snapshot: null };
  }
}

/**
 * Create multiple price snapshots in a batch
 * @param {Array} snapshots - Array of {game_id, round_id, ticker_id, price}
 * @returns {Promise<{success: boolean, snapshots?: Array, count?: number, error?: string}>}
 */
export async function createPriceSnapshots(snapshots) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/price-snapshots/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snapshots: snapshots,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create price snapshots: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, snapshots: data.snapshots || [], count: data.count || 0 };
  } catch (error) {
    console.error("Error creating price snapshots:", error);
    return { success: false, error: error.message, snapshots: [], count: 0 };
  }
}

/**
 * Get price history for a ticker
 * @param {Object} params - {ticker_id, game_id, round_id?, limit?}
 * @returns {Promise<{success: boolean, snapshots?: Array, count?: number, error?: string}>}
 */
export async function getPriceHistory(params) {
  try {
    const queryParams = new URLSearchParams({
      ticker_id: params.ticker_id.toString(),
      game_id: params.game_id.toString(),
    });
    if (params.round_id) queryParams.append("round_id", params.round_id.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/api/price-snapshots?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch price history: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, snapshots: data.snapshots || [], count: data.count || 0 };
  } catch (error) {
    console.error("Error fetching price history:", error);
    return { success: false, error: error.message, snapshots: [], count: 0 };
  }
}

/**
 * Get price snapshots by round
 * @param {number} roundId
 * @returns {Promise<{success: boolean, snapshots?: Array, count?: number, error?: string}>}
 */
export async function getPriceSnapshotsByRound(roundId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/price-snapshots?round_id=${roundId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch price snapshots: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, snapshots: data.snapshots || [], count: data.count || 0 };
  } catch (error) {
    console.error("Error fetching price snapshots:", error);
    return { success: false, error: error.message, snapshots: [], count: 0 };
  }
}

