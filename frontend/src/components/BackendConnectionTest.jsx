import { useEffect, useState } from "react";
import { checkBackendConnection, fetchEvents, generateEvent } from "../api/events";

/**
 * Component to test and verify backend connection
 * You can add this temporarily to your App.jsx to verify the connection
 */
export default function BackendConnectionTest() {
  const [status, setStatus] = useState("checking");
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    // Check connection on mount
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setStatus("checking");
    const result = await checkBackendConnection();
    setConnectionInfo(result);
    setStatus(result.connected ? "connected" : "disconnected");
    
    if (result.connected) {
      // Run additional tests
      runTests();
    }
  };

  const runTests = async () => {
    const results = {
      generateEvent: null,
      fetchEvents: null,
    };

    // Test 1: Generate an event
    try {
      const genResult = await generateEvent({ type: "MACRO" });
      results.generateEvent = genResult.success
        ? { success: true, eventId: genResult.event?.runtimeId }
        : { success: false, error: genResult.error };
    } catch (error) {
      results.generateEvent = { success: false, error: error.message };
    }

    // Test 2: Fetch events
    try {
      const fetchResult = await fetchEvents({ limit: 5 });
      results.fetchEvents = fetchResult.success
        ? { success: true, count: fetchResult.count }
        : { success: false, error: fetchResult.error };
    } catch (error) {
      results.fetchEvents = { success: false, error: error.message };
    }

    setTestResults(results);
  };

  const handleGenerateTest = async () => {
    const result = await generateEvent({ type: "MICRO" });
    console.log("Generated event:", result);
    if (result.success) {
      alert(`Event generated successfully!\nTitle: ${result.event.title}\nID: ${result.event.runtimeId}`);
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: status === "connected" ? "#1a5f1a" : "#5f1a1a",
        color: "white",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "12px",
        fontFamily: "monospace",
        zIndex: 9999,
        maxWidth: "300px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: status === "connected" ? "#4ade80" : "#ef4444",
            animation: status === "checking" ? "pulse 1.5s infinite" : "none",
          }}
        />
        <strong>
          Backend: {status === "connected" ? "Connected" : status === "checking" ? "Checking..." : "Disconnected"}
        </strong>
        <button
          onClick={checkConnection}
          style={{
            marginLeft: "auto",
            padding: "4px 8px",
            fontSize: "10px",
            background: "rgba(255,255,255,0.2)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "4px",
            color: "white",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>

      {connectionInfo?.connected && (
        <div style={{ fontSize: "10px", opacity: 0.9, marginTop: "8px" }}>
          <div>✓ Health check passed</div>
          {testResults && (
            <>
              <div style={{ marginTop: "4px" }}>
                {testResults.generateEvent?.success ? "✓" : "✗"} Generate Event
              </div>
              <div>
                {testResults.fetchEvents?.success ? "✓" : "✗"} Fetch Events ({testResults.fetchEvents?.count || 0})
              </div>
              <button
                onClick={handleGenerateTest}
                style={{
                  marginTop: "8px",
                  padding: "4px 8px",
                  fontSize: "10px",
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "4px",
                  color: "white",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Test: Generate Event
              </button>
            </>
          )}
        </div>
      )}

      {connectionInfo && !connectionInfo.connected && (
        <div style={{ fontSize: "10px", opacity: 0.9, marginTop: "8px" }}>
          <div>✗ {connectionInfo.error || "Connection failed"}</div>
          <div style={{ marginTop: "4px", fontSize: "9px" }}>
            Make sure backend is running on port 8000
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
}

