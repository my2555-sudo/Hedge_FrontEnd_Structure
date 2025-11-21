import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import TimerDisplay from "./components/TimerDisplay.jsx";
import NewsFeed from "./components/NewsFeed.jsx";
import PortfolioTable from "./components/PortfolioTable.jsx";
import TradeControls from "./components/TradeControls.jsx";
import TotalPnLDisplay from "./components/TotalPnLDisplay.jsx";
import GameController from "./components/GameController.jsx";
import AICoachPanel from "./components/AICoachPanel.jsx";
import FeedbackModal from "./components/FeedbackModal.jsx";
import StatsDashboard from "./components/StatsDashboard.jsx";
import PnLChart from "./components/PnLChart.jsx";

import { initialPortfolio } from "./data/mockPortfolio.js";
import { EventProvider, useEventBus } from "./components/EventContext.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import { useGameContext } from "./contexts/GameContext.jsx";
import { usePriceSnapshots } from "./hooks/usePriceSnapshots.js";
import { getTickers } from "./api/tickers.js";
import LoginPage from "./components/LoginPage.jsx";
import { saveRoundScore as apiSaveRoundScore } from "./api/roundScores.js";

function AppInner() {
  const { user, profile, loading, signOut } = useAuth();
  const {
    currentGameId,
    currentRoundId,
    currentParticipantId,
    tickerIdMap,
    setTickerIdMap,
    initializeGame,
    initializeRound,
    endCurrentRound,
  } = useGameContext();
  const { captureSnapshots } = usePriceSnapshots();

  // --- game state (top-level UI timer only) ---
  // All hooks must be called before any early returns (React Hooks rules)
  const ROUND_SECONDS = 30;
  const GAME_DURATION = 300; // 10 rounds * 30 seconds
  const TOTAL_ROUNDS = Math.floor(GAME_DURATION / ROUND_SECONDS); // 10 rounds
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [roundActive, setRoundActive] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [gameOver, setGameOver] = useState(false);

  // global event bus
  const { events } = useEventBus();

  // last event + portfolio
  const [lastEvent, setLastEvent] = useState(null);
  const [portfolio, setPortfolio] = useState(initialPortfolio); // [{ticker, price, shares, avgPrice, sector?}]

  // Cash mechanism
  const STARTING_CASH = 10000;
  const [cash, setCash] = useState(STARTING_CASH);

  const tickers = useMemo(() => portfolio.map((p) => p.ticker), [portfolio]);

  const positionsMap = useMemo(
    () => Object.fromEntries(portfolio.map((r) => [r.ticker, r.shares])),
    [portfolio]
  );

  const [flashTicker, setFlashTicker] = useState(null);
  const [pctImpact, setPctImpact] = useState(0); // e.g. -0.03 => -3%

  // Track player actions for AI Coach analysis
  const [recentTrades, setRecentTrades] = useState([]); // [{action, ticker, qty, timestamp, eventId}]
  const [tradesSinceLastEvent, setTradesSinceLastEvent] = useState(0);
  const lastEventIdRef = useRef(null);

  // Feedback modal state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState("serious"); // "serious" or "playful"

  // Stats tracking
  const [pnlHistory, setPnlHistory] = useState([]); // [{timestamp, pnl}]
  const [streak, setStreak] = useState(0); // Survival streak
  const lastRoundPnLRef = useRef(0);

  // ensure we only apply each event once to portfolio
  const lastAppliedIdRef = useRef(null);

  // Ref to store current round ID (persists even if state is cleared)
  const currentRoundIdRef = useRef(null);
  const currentParticipantIdRef = useRef(null);
  const lastProcessedRoundRef = useRef(null); // avoid double-processing same round

  // === Initialize Tickers (on app startup) ===
  useEffect(() => {
    getTickers().then((result) => {
      if (result.success && result.tickers.length > 0) {
        // Build symbol → id mapping
        const map = Object.fromEntries(result.tickers.map((t) => [t.symbol, t.id]));
        setTickerIdMap(map);

        // Update portfolio, add tickerId
        setPortfolio((prev) =>
          prev.map((row) => {
            const ticker = result.tickers.find((t) => t.symbol === row.ticker);
            return ticker ? { ...row, tickerId: ticker.id } : row;
          })
        );
      } else {
        // Fallback: use mockPortfolio, but without tickerId
        console.warn("Failed to load tickers, using mock data");
      }
    });
  }, []); // Execute only once on app startup

  // === Apply price impacts (market-wide + sector + ticker) ===
  function applyImpacts(ev) {
    setPortfolio((prev) => {
      const updated = prev.map((row) => {
        // Base: market-wide
        let pct = ev?.impactPct ?? 0;

        // Add: sector (optional event field)
        if (ev?.impacts?.sector && row.sector) {
          pct += ev.impacts.sector[row.sector] ?? 0;
        }

        // Add: ticker (optional event field)
        if (ev?.impacts?.ticker) {
          pct += ev.impacts.ticker[row.ticker] ?? 0;
        }

        return { ...row, price: +(row.price * (1 + pct)).toFixed(2) };
      });

      // Auto-capture price snapshots (async, non-blocking)
      // Use ref values to ensure they're available even if state was cleared
      const gameIdForSnapshot = currentGameId;
      const roundIdForSnapshot = currentRoundIdRef.current || currentRoundId;
      if (gameIdForSnapshot && roundIdForSnapshot) {
        // Use updated portfolio
        setTimeout(() => {
          captureSnapshots(updated, gameIdForSnapshot, roundIdForSnapshot).catch((err) => {
            console.warn("Failed to capture price snapshots:", err);
          });
        }, 0);
      }

      return updated;
    });
  }

  // Top-level UI countdown (independent of GameController internal timer)
  useEffect(() => {
    if (!roundActive) return;
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [roundActive, secondsLeft]);

  // When new event arrives, apply price impact only once
  useEffect(() => {
    if (!roundActive) return;
    const ev = events[0];
    if (!ev) return;

    // Prevent duplicate application of same event
    if (lastAppliedIdRef.current === ev.runtimeId) return;
    lastAppliedIdRef.current = ev.runtimeId;

    setLastEvent(ev);
    setPctImpact(ev.impactPct || 0);
    applyImpacts(ev);
    
    // Reset trade tracking for new event
    setTradesSinceLastEvent(0);
    lastEventIdRef.current = ev.runtimeId;
  }, [events, roundActive]);

  // Trade (with cash validation)
  function handleTrade({ ticker, action, qty }) {
    const row = portfolio.find((r) => r.ticker === ticker);
    if (!row) return;
    const px = row.price;

    if (action === "BUY") {
      const cost = px * qty;
      if (cost > cash) {
        alert(
          `Not enough cash to buy ${qty} ${ticker}. Need $${cost.toFixed(
            2
          )}, have $${cash.toFixed(2)}.`
        );
        return;
      }
      setCash((prev) => +(prev - cost).toFixed(2));
    } else {
      const sellQty = Math.min(qty, row.shares);
      const proceeds = px * sellQty;
      setCash((prev) => +(prev + proceeds).toFixed(2));
    }

    setPortfolio((prev) =>
      prev.map((r) => {
        if (r.ticker !== ticker) return r;
        if (action === "BUY") {
          const newShares = r.shares + qty;
          const newAvg = (r.avgPrice * r.shares + px * qty) / newShares;
          return { ...r, shares: newShares, avgPrice: +newAvg.toFixed(2) };
        } else {
          const newShares = Math.max(0, r.shares - qty);
          return { ...r, shares: newShares };
        }
      })
    );

    // Track trade for AI Coach analysis
    const tradeRecord = {
      action,
      ticker,
      qty,
      timestamp: Date.now(),
      eventId: lastEventIdRef.current
    };
    setRecentTrades((prev) => [tradeRecord, ...prev].slice(0, 10)); // Keep last 10 trades
    setTradesSinceLastEvent((prev) => prev + 1);

    setFlashTicker(ticker);
    setTimeout(() => setFlashTicker(null), 400);
  }

  // Total P/L
  const totalPnL = useMemo(
    () =>
      portfolio.reduce(
        (sum, r) => sum + (r.price - r.avgPrice) * r.shares,
        0
      ),
    [portfolio]
  );

  // Track P/L history for dashboard
  useEffect(() => {
    if (roundActive) {
      const interval = setInterval(() => {
        setPnlHistory((prev) => {
          const newEntry = { timestamp: Date.now(), pnl: totalPnL };
          // Keep last 100 entries
          return [newEntry, ...prev].slice(0, 100);
        });
      }, 5000); // Update every 5 seconds during active rounds
      
      return () => clearInterval(interval);
    }
  }, [roundActive, totalPnL]);

  // === Game initialization (when game starts for first time) ===
  useEffect(() => {
    if (roundActive && roundNumber === 1 && !currentGameId) {
      // Initialize game and participant
      initializeGame(STARTING_CASH)
        .then((result) => {
          if (result.success) {
            // Store participant ID in ref
            currentParticipantIdRef.current = result.participantId;
          } else {
            console.error("Failed to initialize game:", result.error);
          }
        })
        .catch((err) => {
          console.error("Error initializing game:", err);
        });
    }
  }, [roundActive, roundNumber, currentGameId, initializeGame]);

  // Update participant ID ref when it changes
  useEffect(() => {
    if (currentParticipantId) {
      currentParticipantIdRef.current = currentParticipantId;
    }
  }, [currentParticipantId]);

  // === Round initialization (at start of each round) ===
  useEffect(() => {
    if (roundActive && currentGameId && roundNumber) {
      // Initialize round
      initializeRound(roundNumber)
        .then((result) => {
          if (result.success) {
            // Store round ID in ref (persists even if state is cleared)
            currentRoundIdRef.current = result.roundId;
            // Capture price snapshot at round start (use ref values to ensure they're available)
            captureSnapshots(portfolio, currentGameId, result.roundId).catch((err) => {
              console.warn("Failed to capture initial price snapshots:", err);
            });
          } else {
            console.error("Failed to initialize round:", result.error);
          }
        })
        .catch((err) => {
          console.error("Error initializing round:", err);
        });
    }
  }, [roundActive, currentGameId, roundNumber, initializeRound, captureSnapshots, portfolio]);

  // Update round ID ref when it changes
  useEffect(() => {
    if (currentRoundId) {
      currentRoundIdRef.current = currentRoundId;
    }
  }, [currentRoundId]);

  // Round control
  function startRound() {
    if (gameOver) {
      // Reset game completely if starting after game over
      setRoundNumber(1);
      setGameOver(false);
      setRoundActive(false);
      return;
    }
    setLastEvent(null);
    setPctImpact(0);
    setSecondsLeft(ROUND_SECONDS);
    lastAppliedIdRef.current = null;
    setRoundActive(true);
    lastRoundPnLRef.current = totalPnL;
    // Update roundNumber (if resuming from pause, don't increment)
    // Note: roundNumber increments after each round ends, controlled by GameController or other logic
  }
  
  // Handle round end (called from GameController)
  async function handleRoundEnd({ roundNumber: endedRoundNumber, totalRounds }) {
    // Avoid double-processing the same round (React StrictMode / multiple calls)
    if (lastProcessedRoundRef.current === endedRoundNumber) {
      return;
    }
    lastProcessedRoundRef.current = endedRoundNumber;

    // Check if game is over
    if (endedRoundNumber >= totalRounds) {
      setGameOver(true);
      setRoundActive(false);
      return;
    }

    // Determine if player "survived" this round (basic rule)
    const survived = totalPnL >= lastRoundPnLRef.current || totalPnL >= 0;
    setStreak((prev) => (survived ? prev + 1 : 0));

    const roundIdToSave = currentRoundIdRef.current || currentRoundId;
    const participantIdToSave = currentParticipantIdRef.current || currentParticipantId;

    if (!roundIdToSave || !participantIdToSave) {
      console.warn("Cannot save round score: missing IDs", {
        roundId: roundIdToSave,
        participantId: participantIdToSave,
      });
      return;
    }

    // Calculate reaction window and whether the player reacted
    const REACTION_WINDOW_MS = 10000;
    let reacted = false;
    let reactionMs = null;

    if (lastEvent && lastEvent.ts && recentTrades && recentTrades.length > 0) {
      const tradesAfterEvent = recentTrades.filter(
        (trade) =>
          trade.timestamp >= lastEvent.ts &&
          trade.timestamp <= lastEvent.ts + REACTION_WINDOW_MS
      );

      if (tradesAfterEvent.length > 0) {
        const firstTrade = tradesAfterEvent.reduce((earliest, trade) => {
          return trade.timestamp < earliest.timestamp ? trade : earliest;
        }, tradesAfterEvent[0]);
        reactionMs = firstTrade.timestamp - lastEvent.ts;
        reacted = true;
      }
    }

    const pnlDelta = totalPnL - (lastRoundPnLRef.current || 0);

    try {
      const result = await apiSaveRoundScore({
        participant_id: participantIdToSave,
        round_id: roundIdToSave,
        pnl_delta: pnlDelta,
        reacted,
        reaction_ms: reactionMs,
      });

      if (!result.success) {
        console.error("Failed to save round score:", result.error);
      }
    } catch (error) {
      console.error("Error saving round score:", error);
    }

    // Capture price snapshot at round end (use ref values)
    const roundIdForSnapshot = currentRoundIdRef.current || currentRoundId;
    if (currentGameId && roundIdForSnapshot) {
      setPortfolio((currentPortfolio) => {
        captureSnapshots(currentPortfolio, currentGameId, roundIdForSnapshot).catch(
          (err) => {
            console.warn("Failed to capture final price snapshots:", err);
          }
        );
        return currentPortfolio;
      });
    }

    // End round in backend and prepare for next round
    try {
      await endCurrentRound();
    } catch (error) {
      console.warn("Failed to end round:", error);
    }

    setRoundNumber((prev) => prev + 1);
  }

  function pauseRound() {
    setRoundActive(false);
  }
  function resumeRound() {
    if (secondsLeft > 0) setRoundActive(true);
  }

  // Show login page if not authenticated (after all hooks)
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="AppRoot">
      {/* Left column */}
      <section className="LeftRail glass">
        <div className="Avatar">
          <div className="AvatarCircle">🙂</div>
          <div className="GameTitle">HEDGE</div>
        </div>
        
        {/* User Info */}
        {profile && (
          <div style={{ 
            marginTop: 12, 
            padding: 8, 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: 6,
            fontSize: 12
          }}>
            <div style={{ opacity: 0.9 }}>👤 {profile.username || profile.full_name}</div>
            {profile.full_name && profile.full_name !== profile.username && (
              <div style={{ opacity: 0.7, marginTop: 4 }}>{profile.full_name}</div>
            )}
            <button
              onClick={async () => {
                await signOut();
              }}
              style={{
                marginTop: 8,
                padding: '4px 8px',
                fontSize: 10,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                color: 'white',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Sign Out
            </button>
          </div>
        )}
        {!profile && user && (
          <div style={{ 
            marginTop: 12, 
            padding: 8, 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: 6,
            fontSize: 12
          }}>
            <button
              onClick={async () => {
                await signOut();
              }}
              style={{
                padding: '6px 10px',
                fontSize: 12,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                color: 'white',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Sign Out
            </button>
          </div>
        )}

        <TimerDisplay seconds={secondsLeft} active={roundActive} />
        {/* Drive GameController's active state from here so BlackSwan hook runs */}
        <GameController controlledActive={roundActive && !gameOver} onRoundEnd={handleRoundEnd} />
        
        {/* Game Over Message */}
        {gameOver && (
          <div className="glass" style={{ padding: "16px", marginTop: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--accent)", marginBottom: "8px" }}>
              🎉 Game Complete!
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              All {TOTAL_ROUNDS} rounds finished. Final P/L: <span style={{ color: totalPnL >= 0 ? "var(--good)" : "var(--bad)", fontWeight: "600" }}>
                {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div style={{ marginTop: 12, display: "flex", gap: "8px", justifyContent: "center" }}>
          <button className="btn btn-start" onClick={startRound}>
            {gameOver ? "🔄 New Game" : "▶ Start"}
          </button>
          <button className="btn btn-pause" onClick={pauseRound} disabled={!roundActive}>
            ⏸ Pause
          </button>
          <button
            className="btn btn-resume"
            onClick={resumeRound}
            disabled={roundActive || secondsLeft <= 0}
          >
            ▶ Resume
          </button>
        </div>

        <AICoachPanel 
          lastEvent={lastEvent} 
          totalPnL={totalPnL}
          portfolio={portfolio}
          recentTrades={recentTrades}
          tradesSinceLastEvent={tradesSinceLastEvent}
          feedbackMode={feedbackMode}
        />
        
        {/* Feedback Mode Toggle */}
        {/* Feedback button */}
        {lastEvent && (
          <button 
            className="btn btn-feedback" 
            onClick={() => setFeedbackModalOpen(true)}
            style={{ marginTop: 8, width: "100%" }}
          >
            💡 Get Feedback ({feedbackMode === "serious" ? "📊" : "🎮"})
          </button>
        )}
        
        <div style={{
          marginTop: 12,
          padding: "8px",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "6px",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}>
          <span style={{ fontSize: "11px", opacity: 0.8 }}>Feedback Mode:</span>
          <div style={{
            display: "flex",
            gap: "8px"
          }}>
            <button
              onClick={() => setFeedbackMode(prev => prev === "serious" ? "playful" : "serious")}
              style={{
                flex: 1,
                padding: "6px 12px",
                background: feedbackMode === "serious" 
                  ? "rgba(79, 195, 247, 0.3)" 
                  : "rgba(255,255,255,0.1)",
                border: `1px solid ${feedbackMode === "serious" ? "var(--accent)" : "rgba(255,255,255,0.2)"}`,
                borderRadius: "4px",
                color: "white",
                fontSize: "11px",
                cursor: "pointer",
                transition: "all 0.2s",
                fontWeight: feedbackMode === "serious" ? 600 : 400
              }}
              onMouseOver={(e) => {
                if (feedbackMode !== "serious") {
                  e.target.style.background = "rgba(255,255,255,0.15)";
                }
              }}
              onMouseOut={(e) => {
                if (feedbackMode !== "serious") {
                  e.target.style.background = "rgba(255,255,255,0.1)";
                }
              }}
            >
              📊 Serious
            </button>
            <button
              onClick={() => setFeedbackMode(prev => prev === "playful" ? "serious" : "playful")}
              style={{
                flex: 1,
                padding: "6px 12px",
                background: feedbackMode === "playful" 
                  ? "rgba(255, 193, 7, 0.3)" 
                  : "rgba(255,255,255,0.1)",
                border: `1px solid ${feedbackMode === "playful" ? "#ffc107" : "rgba(255,255,255,0.2)"}`,
                borderRadius: "4px",
                color: "white",
                fontSize: "11px",
                cursor: "pointer",
                transition: "all 0.2s",
                fontWeight: feedbackMode === "playful" ? 600 : 400
              }}
              onMouseOver={(e) => {
                if (feedbackMode !== "playful") {
                  e.target.style.background = "rgba(255,255,255,0.15)";
                }
              }}
              onMouseOut={(e) => {
                if (feedbackMode !== "playful") {
                  e.target.style.background = "rgba(255,255,255,0.1)";
                }
              }}
            >
              🎮 Playful
            </button>
          </div>
        </div>
      </section>

      {/* Center column: global feed */}
      <section className="CenterFeed glass">
        <NewsFeed events={events} onSelect={(ev) => setLastEvent(ev)} />
        
        {/* P/L Chart */}
        <PnLChart
          totalPnL={totalPnL}
          pnlHistory={pnlHistory}
        />
      </section>

      {/* Right column: portfolio */}
      <section className="RightPortfolio glass">
        <div className="PanelTitle">PORTFOLIO</div>
        <PortfolioTable rows={portfolio} flashTicker={flashTicker} cash={cash} />
        <TradeControls
          tickers={tickers}
          positions={positionsMap}
          onTrade={handleTrade}
          disabled={!roundActive || gameOver}
          portfolio={portfolio}
          cash={cash}
        />
        <TotalPnLDisplay value={totalPnL} />
        <div className="CashDisplay">💵 Cash: ${cash.toFixed(2)}</div>
        {lastEvent && (
          <div className="ImpactBadge">
            Market impact: {(pctImpact * 100).toFixed(1)}%
          </div>
        )}
        
        {/* Stats Dashboard */}
        <StatsDashboard
          totalPnL={totalPnL}
          portfolioValue={portfolio.reduce((sum, r) => sum + (r.price * r.shares), 0) + cash}
          initialValue={STARTING_CASH}
          streak={streak}
          pnlHistory={pnlHistory}
        />
      </section>

      {/* Feedback Modal */}
      <FeedbackModal
        open={feedbackModalOpen}
        lastEvent={lastEvent}
        portfolio={portfolio}
        totalPnL={totalPnL}
        recentTrades={recentTrades}
        mode={feedbackMode}
        onClose={() => setFeedbackModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <EventProvider>
      <AppInner />
    </EventProvider>
  );
}
