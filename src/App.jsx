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

import { initialPortfolio } from "./data/mockPortfolio.js";
import { EventProvider, useEventBus } from "./components/EventContext.jsx";

import { getOrCreateCurrentRound } from "./lib/round.js";

function AppInner() {
  const ROUND_SECONDS = 30;
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [roundActive, setRoundActive] = useState(false);

  const { events } = useEventBus();

  const [lastEvent, setLastEvent] = useState(null);
  const [portfolio, setPortfolio] = useState(initialPortfolio);

  const STARTING_CASH = 10000;
  const [cash, setCash] = useState(STARTING_CASH);

  const tickers = useMemo(() => portfolio.map((p) => p.ticker), [portfolio]);
  const positionsMap = useMemo(
    () => Object.fromEntries(portfolio.map((r) => [r.ticker, r.shares])),
    [portfolio]
  );

  const [flashTicker, setFlashTicker] = useState(null);
  const [pctImpact, setPctImpact] = useState(0);

  const [recentTrades, setRecentTrades] = useState([]);
  const [tradesSinceLastEvent, setTradesSinceLastEvent] = useState(0);
  const lastEventIdRef = useRef(null);

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState("serious");

  const [pnlHistory, setPnlHistory] = useState([]);
  const [streak, setStreak] = useState(0);
  const lastRoundPnLRef = useRef(0);

  const lastAppliedIdRef = useRef(null);

  function applyImpacts(ev) {
    setPortfolio((prev) =>
      prev.map((row) => {
        let pct = ev?.impactPct ?? 0;
        if (ev?.impacts?.sector && row.sector) pct += ev.impacts.sector[row.sector] ?? 0;
        if (ev?.impacts?.ticker) pct += ev.impacts.ticker[row.ticker] ?? 0;
        return { ...row, price: +(row.price * (1 + pct)).toFixed(2) };
      })
    );
  }

  useEffect(() => {
    if (!roundActive || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [roundActive, secondsLeft]);

  useEffect(() => {
    if (!roundActive) return;
    const ev = events[0];
    if (!ev) return;
    if (lastAppliedIdRef.current === ev.runtimeId) return;
    lastAppliedIdRef.current = ev.runtimeId;

    setLastEvent(ev);
    setPctImpact(ev.impactPct || 0);
    applyImpacts(ev);

    setTradesSinceLastEvent(0);
    lastEventIdRef.current = ev.runtimeId;
  }, [events, roundActive]);

  function handleTrade({ ticker, action, qty }) {
    const row = portfolio.find((r) => r.ticker === ticker);
    if (!row) return;
    const px = row.price;

    if (action === "BUY") {
      const cost = px * qty;
      if (cost > cash) {
        alert(`Not enough cash to buy ${qty} ${ticker}. Need $${cost.toFixed(2)}, have $${cash.toFixed(2)}.`);
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

    const tradeRecord = { action, ticker, qty, timestamp: Date.now(), eventId: lastEventIdRef.current };
    setRecentTrades((prev) => [tradeRecord, ...prev].slice(0, 10));
    setTradesSinceLastEvent((prev) => prev + 1);

    setFlashTicker(ticker);
    setTimeout(() => setFlashTicker(null), 400);
  }

  const totalPnL = useMemo(
    () => portfolio.reduce((sum, r) => sum + (r.price - r.avgPrice) * r.shares, 0),
    [portfolio]
  );

  useEffect(() => {
    if (!roundActive) return;
    const id = setInterval(() => {
      setPnlHistory((prev) => [{ timestamp: Date.now(), pnl: totalPnL }, ...prev].slice(0, 100));
    }, 5000);
    return () => clearInterval(id);
  }, [roundActive, totalPnL]);

  function startRound() {
    setLastEvent(null);
    setPctImpact(0);
    setSecondsLeft(ROUND_SECONDS);
    lastAppliedIdRef.current = null;
    setRoundActive(true);
    lastRoundPnLRef.current = totalPnL;
  }

  useEffect(() => {
    if (!roundActive && secondsLeft <= 0 && lastRoundPnLRef.current !== undefined) {
      const survived = totalPnL >= lastRoundPnLRef.current || totalPnL >= 0;
      setStreak((prev) => (survived ? prev + 1 : 0));
    }
  }, [roundActive, secondsLeft, totalPnL]);

  function pauseRound() { setRoundActive(false); }
  function resumeRound() { if (secondsLeft > 0) setRoundActive(true); }

  return (
    <div className="AppRoot">
      {/* Left column */}
      <section className="LeftRail glass">
        <div className="Avatar">
          <div className="AvatarCircle">🙂</div>
          <div className="GameTitle">HEDGE</div>
        </div>

        <TimerDisplay seconds={secondsLeft} active={roundActive} />
        {/* Drive GameController from here so BlackSwan runs */}
        <GameController controlledActive={roundActive} />

        <div style={{ marginTop: 12 }}>
          <button className="btn start" onClick={startRound}>Start</button>
          <button className="btn pause" onClick={pauseRound} disabled={!roundActive}>Pause</button>
          <button className="btn resume" onClick={resumeRound} disabled={roundActive || secondsLeft <= 0}>Resume</button>
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
        <div
          style={{
            marginTop: 12,
            padding: "8px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "11px", opacity: 0.8 }}>Feedback Mode:</span>
          <button
            onClick={() => setFeedbackMode((p) => (p === "serious" ? "playful" : "serious"))}
            style={{
              flex: 1,
              padding: "6px 12px",
              background: feedbackMode === "serious" ? "rgba(79, 195, 247, 0.3)" : "rgba(255,255,255,0.1)",
              border: `1px solid ${feedbackMode === "serious" ? "var(--accent)" : "rgba(255,255,255,0.2)"}`,
              borderRadius: "4px",
              color: "white",
              fontSize: "11px",
              cursor: "pointer",
              transition: "all 0.2s",
              fontWeight: feedbackMode === "serious" ? 600 : 400,
            }}
          >
            📊 Serious
          </button>
          <button
            onClick={() => setFeedbackMode((p) => (p === "playful" ? "serious" : "playful"))}
            style={{
              flex: 1,
              padding: "6px 12px",
              background: feedbackMode === "playful" ? "rgba(255, 193, 7, 0.3)" : "rgba(255,255,255,0.1)",
              border: `1px solid ${feedbackMode === "playful" ? "#ffc107" : "rgba(255,255,255,0.2)"}`,
              borderRadius: "4px",
              color: "white",
              fontSize: "11px",
              cursor: "pointer",
              transition: "all 0.2s",
              fontWeight: feedbackMode === "playful" ? 600 : 400,
            }}
          >
            🎮 Playful
          </button>
        </div>

        {lastEvent && (
          <button className="btn" onClick={() => setFeedbackModalOpen(true)} style={{ marginTop: 8, width: "100%" }}>
            💡 Get Feedback ({feedbackMode === "serious" ? "📊" : "🎮"})
          </button>
        )}
      </section>

      {/* Center column */}
      <section className="CenterFeed glass">
        <div className="PanelTitle">
          NEWS HEADLINES (AI) <span className="count">{events.length}</span>
        </div>
        <NewsFeed events={events} onSelect={(ev) => setLastEvent(ev)} />
      </section>

      {/* Right column */}
      <section className="RightPortfolio glass">
        <div className="PanelTitle">PORTFOLIO</div>
        <PortfolioTable rows={portfolio} flashTicker={flashTicker} />
        <TradeControls
          tickers={tickers}
          positions={positionsMap}
          onTrade={handleTrade}
          disabled={!roundActive}
        />
        <TotalPnLDisplay value={totalPnL} />
        <div className="CashDisplay">💵 Cash: ${cash.toFixed(2)}</div>
        {lastEvent && <div className="ImpactBadge">Market impact: {(pctImpact * 100).toFixed(1)}%</div>}

        <StatsDashboard
          totalPnL={totalPnL}
          portfolioValue={portfolio.reduce((sum, r) => sum + r.price * r.shares, 0) + cash}
          initialValue={STARTING_CASH}
          streak={streak}
          pnlHistory={pnlHistory}
        />
      </section>

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

// ------------------------------
// Wrapper: ensure a round exists and provide roundId to EventProvider
// ------------------------------
export default function App() {
  const GAME_ID = Number(new URLSearchParams(window.location.search).get("game")) || 1;
  const ROUND_SECONDS = 30;

  const [roundId, setRoundId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const rid = await getOrCreateCurrentRound(GAME_ID, ROUND_SECONDS);
        if (!cancelled) setRoundId(rid);
      } catch (e) {
        if (!cancelled) setErr(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [GAME_ID]);

  if (loading) return <div className="AppRoot" style={{ color: "#fff", padding: 24 }}>Loading round…</div>;

  if (err || !roundId) {
    return (
      <div className="AppRoot" style={{ color: "#fff", padding: 24 }}>
        {err ? `Failed to load/create round: ${err.message}` : "No round found or created."}
        <div style={{ opacity: 0.7, marginTop: 6 }}>
          Ensure RLS allows reading <code>rounds</code> and a <code>games</code> row exists for <code>id={GAME_ID}</code>.
        </div>
      </div>
    );
  }

  return (
    <EventProvider roundId={roundId}>
      <AppInner />
    </EventProvider>
  );
}
