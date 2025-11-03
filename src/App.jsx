import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import TimerDisplay from "./components/TimerDisplay.jsx";
import NewsFeed from "./components/NewsFeed.jsx";
import PortfolioTable from "./components/PortfolioTable.jsx";
import TradeControls from "./components/TradeControls.jsx";
import TotalPnLDisplay from "./components/TotalPnLDisplay.jsx";
import GameController from "./components/GameController.jsx";
import AICoachPanel from "./components/AICoachPanel.jsx";

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
  const [portfolio, setPortfolio] = useState(initialPortfolio); // [{ticker, price, shares, avgPrice}]

  // [ADD] 
  const STARTING_CASH = 10000;
  const [cash, setCash] = useState(STARTING_CASH);

  const tickers = useMemo(() => portfolio.map((p) => p.ticker), [portfolio]);

  const positionsMap = useMemo(
    () => Object.fromEntries(portfolio.map(r => [r.ticker, r.shares])),
    [portfolio]
  );

  const [flashTicker, setFlashTicker] = useState(null);

  const [pctImpact, setPctImpact] = useState(0); // e.g. -0.03 => -3%

  // ensure we only apply each event once to portfolio
  const lastAppliedIdRef = useRef(null);

  // top-level UI countdown (separate from GameController’s internal timer)
  useEffect(() => {
    if (!roundActive) return;
    if (secondsLeft <= 0) return;

    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [roundActive, secondsLeft]);

  // Apply market reaction whenever a NEW event hits the bus
  useEffect(() => {
    if (!roundActive) return;
    const ev = events[0];
    if (!ev) return;

    // already applied?
    if (lastAppliedIdRef.current === ev.runtimeId) return;
    lastAppliedIdRef.current = ev.runtimeId;

    setLastEvent(ev);
    setPctImpact(ev.impactPct || 0);

    // simple global impact (you can make this sector-aware later)
    setPortfolio((prev) =>
      prev.map((row) => ({
        ...row,
        price: +(row.price * (1 + (ev.impactPct || 0))).toFixed(2),
      }))
    );
  }, [events, roundActive]);

  // round controls
  function startRound() {
    setLastEvent(null);
    setPctImpact(0);
    setSecondsLeft(ROUND_SECONDS);
    lastAppliedIdRef.current = null;
    setRoundActive(true);
  }
  function pauseRound() { setRoundActive(false); }
  function resumeRound() { if (secondsLeft > 0) setRoundActive(true); }

  // trades
  function handleTrade({ ticker, action, qty }) {
  // 先找到该股票的现价，用于现金计算
  const row = portfolio.find(r => r.ticker === ticker);
  if (!row) return;
  const px = row.price;

  if (action === "BUY") {
    const cost = px * qty;

    // [ADD] 余额不足，拦截交易（你也可以改成在 UI 上提示）
    if (cost > cash) {
      alert(`Not enough cash to buy ${qty} ${ticker}. Need $${cost.toFixed(2)}, have $${cash.toFixed(2)}.`);
      return;
    }

    // [ADD] 扣现金
    setCash(prev => +(prev - cost).toFixed(2));
  } else {
    // [ADD] 卖出回收现金（按当前价格）
    const proceeds = px * Math.min(qty, row.shares);
    setCash(prev => +(prev + proceeds).toFixed(2));
  }

  // 原有的持仓与均价更新
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

  // 行闪烁
  setFlashTicker(ticker);
  setTimeout(() => setFlashTicker(null), 400);
}


  // P/L
  const totalPnL = useMemo(() =>
    portfolio.reduce((sum, r) => sum + (r.price - r.avgPrice) * r.shares, 0),
  [portfolio]);

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
          <button className="btn start" onClick={startRound}>Start</button>
          <button className="btn pause" onClick={pauseRound} disabled={!roundActive}>Pause</button>
          <button className="btn resume" onClick={resumeRound} disabled={roundActive || secondsLeft <= 0}>Resume</button>
        </div>

        <AICoachPanel lastEvent={lastEvent} totalPnL={totalPnL} />
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
          <div className="ImpactBadge">Market impact: {(pctImpact * 100).toFixed(1)}%</div>
        )}
      </section>
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

