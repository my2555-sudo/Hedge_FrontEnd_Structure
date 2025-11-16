/**
 * API service for tickers
 * Connects to the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Get all tickers
 * @returns {Promise<{success: boolean, tickers?: Array, count?: number, error?: string}>}
 */
export async function getTickers() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tickers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tickers: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, tickers: data.tickers || [], count: data.count || 0 };
  } catch (error) {
    console.error("Error fetching tickers:", error);
    return { success: false, error: error.message, tickers: [], count: 0 };
  }
}

/**
 * Get a ticker by ID
 * @param {number} tickerId - The ticker ID
 * @returns {Promise<{success: boolean, ticker?: Object, error?: string}>}
 */
export async function getTickerById(tickerId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tickers/${tickerId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "Ticker not found", ticker: null };
      }
      throw new Error(`Failed to fetch ticker: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, ticker: data.ticker };
  } catch (error) {
    console.error("Error fetching ticker:", error);
    return { success: false, error: error.message, ticker: null };
  }
}

/**
 * Get a ticker by symbol
 * @param {string} symbol - The ticker symbol (e.g., "AAPL")
 * @returns {Promise<{success: boolean, ticker?: Object, error?: string}>}
 */
export async function getTickerBySymbol(symbol) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tickers/symbol/${encodeURIComponent(symbol)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "Ticker not found", ticker: null };
      }
      throw new Error(`Failed to fetch ticker: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, ticker: data.ticker };
  } catch (error) {
    console.error("Error fetching ticker by symbol:", error);
    return { success: false, error: error.message, ticker: null };
  }
}

/**
 * Create a new ticker
 * @param {Object} tickerData - {symbol, name, sector}
 * @returns {Promise<{success: boolean, ticker?: Object, error?: string}>}
 */
export async function createTicker(tickerData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tickers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tickerData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create ticker: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, ticker: data.ticker };
  } catch (error) {
    console.error("Error creating ticker:", error);
    return { success: false, error: error.message, ticker: null };
  }
}

