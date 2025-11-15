/**
 * API service for events (news and blackswan events)
 * Connects to the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Check if the backend is reachable
 */
export async function checkBackendConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`);
    }
    
    const data = await response.json();
    return { connected: true, data };
  } catch (error) {
    console.error("Backend connection check failed:", error);
    return { connected: false, error: error.message };
  }
}

/**
 * Get all events with optional filters
 */
export async function fetchEvents({ limit, type } = {}) {
  try {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit);
    if (type) params.append("type", type);
    
    const url = `${API_BASE_URL}/api/events${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, events: data.events || [], count: data.count || 0 };
  } catch (error) {
    console.error("Error fetching events:", error);
    return { success: false, error: error.message, events: [], count: 0 };
  }
}

/**
 * Get a specific event by runtimeId
 */
export async function fetchEventById(eventId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "Event not found", event: null };
      }
      throw new Error(`Failed to fetch event: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, event: data.event };
  } catch (error) {
    console.error("Error fetching event:", error);
    return { success: false, error: error.message, event: null };
  }
}

/**
 * Generate a new event
 */
export async function generateEvent({ type, forceBlackSwan = false } = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: type || null,
        forceBlackSwan: forceBlackSwan,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate event: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, event: data.event };
  } catch (error) {
    console.error("Error generating event:", error);
    return { success: false, error: error.message, event: null };
  }
}

/**
 * Get all blackswan events
 */
export async function fetchBlackSwanEvents(limit) {
  try {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit);
    
    const url = `${API_BASE_URL}/api/events/blackswan${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blackswan events: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, events: data.events || [], count: data.count || 0 };
  } catch (error) {
    console.error("Error fetching blackswan events:", error);
    return { success: false, error: error.message, events: [], count: 0 };
  }
}

/**
 * Get all news events (MACRO and MICRO)
 */
export async function fetchNewsEvents(limit) {
  try {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit);
    
    const url = `${API_BASE_URL}/api/events/news${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch news events: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, events: data.events || [], count: data.count || 0 };
  } catch (error) {
    console.error("Error fetching news events:", error);
    return { success: false, error: error.message, events: [], count: 0 };
  }
}

