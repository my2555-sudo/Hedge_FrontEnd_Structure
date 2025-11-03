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

function AppInner() {
  // --- game state (top-level UI timer only) ---
  const ROUND_SECONDS = 30;
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [roundActive, setRoundActive] = useState(false);

  // global event bus
  const { events } = useEventBus();

  // last event + portfolio
  const [lastEvent, setLastEvent] = useState(null);
  const [portfolio, setPortfolio] = useState(initialPortfolio); // [{ticker, price, shares, avgPrice, sector?}]

  // Cash 机制
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

  // === 统一应用价格冲击（全市场 + 行业 + 个股）===
  function applyImpacts(ev) {
    setPortfolio((prev) =>
      prev.map((row) => {
        // 基线：全市场
        let pct = ev?.impactPct ?? 0;

        // 叠加：行业（事件可选字段）
        if (ev?.impacts?.sector && row.sector) {
          pct += ev.impacts.sector[row.sector] ?? 0;
        }

        // 叠加：个股（事件可选字段）
        if (ev?.impacts?.ticker) {
          pct += ev.impacts.ticker[row.ticker] ?? 0;
        }

        return { ...row, price: +(row.price * (1 + pct)).toFixed(2) };
      })
    );
  }

  // 顶层 UI 倒计时（独立于 GameController 内部计时）
  useEffect(() => {
    if (!roundActive) return;
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [roundActive, secondsLeft]);

  // 有新事件到达时，仅应用一次价格冲击
  useEffect(() => {
    if (!roundActive) return;
    const ev = events[0];
    if (!ev) return;

    // 防止重复应用同一事件
    if (lastAppliedIdRef.current === ev.runtimeId) return;
    lastAppliedIdRef.current = ev.runtimeId;

    setLastEvent(ev);
    setPctImpact(ev.impactPct || 0);
    applyImpacts(ev);
    
    // Reset trade tracking for new event
    setTradesSinceLastEvent(0);
    lastEventIdRef.current = ev.runtimeId;
  }, [events, roundActive]);

  // 交易（含现金校验）
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

  // 总 P/L
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

  // 回合控制
  function startRound() {
    setLastEvent(null);
    setPctImpact(0);
    setSecondsLeft(ROUND_SECONDS);
    lastAppliedIdRef.current = null;
    setRoundActive(true);
    lastRoundPnLRef.current = totalPnL;
  }
  
  // Track streak based on round survival (simple: if P/L improved or stayed positive)
  useEffect(() => {
    if (!roundActive && secondsLeft <= 0 && lastRoundPnLRef.current !== undefined) {
      const survived = totalPnL >= lastRoundPnLRef.current || totalPnL >= 0;
      setStreak((prev) => survived ? prev + 1 : 0);
    }
  }, [roundActive, secondsLeft, totalPnL]);
  function pauseRound() {
    setRoundActive(false);
  }
  function resumeRound() {
    if (secondsLeft > 0) setRoundActive(true);
  }

  return (
    <div className="AppRoot">
      {/* Left column */}
      <section className="LeftRail glass">
        <div className="Avatar">
          <div className="AvatarCircle">🙂</div>
          <div className="GameTitle">HEDGE</div>
        </div>

        <TimerDisplay seconds={secondsLeft} active={roundActive} />
        {/* Drive GameController’s active state from here so BlackSwan hook runs */}
        <GameController controlledActive={roundActive} />

        <div style={{ marginTop: 12 }}>
          <button className="btn start" onClick={startRound}>
            Start
          </button>
          <button className="btn pause" onClick={pauseRound} disabled={!roundActive}>
            Pause
          </button>
          <button
            className="btn resume"
            onClick={resumeRound}
            disabled={roundActive || secondsLeft <= 0}
          >
            Resume
          </button>
        </div>

        <AICoachPanel 
          lastEvent={lastEvent} 
          totalPnL={totalPnL}
          portfolio={portfolio}
          recentTrades={recentTrades}
          tradesSinceLastEvent={tradesSinceLastEvent}
        />
        
        {/* Feedback button */}
        {lastEvent && (
          <button 
            className="btn" 
            onClick={() => setFeedbackModalOpen(true)}
            style={{ marginTop: 12, width: "100%" }}
          >
            💡 Get Feedback
          </button>
        )}
      </section>

      {/* Center column: global feed */}
      <section className="CenterFeed glass">
        <div className="PanelTitle">
          NEWS HEADLINES (AI) <span className="count">{events.length}</span>
        </div>
        <NewsFeed events={events} onSelect={(ev) => setLastEvent(ev)} />
      </section>

      {/* Right column: portfolio */}
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
