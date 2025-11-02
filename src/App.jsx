import { useEffect, useMemo, useState } from "react";
import "./App.css";

import TimerDisplay from "./components/TimerDisplay.jsx";
import NewsFeed from "./components/NewsFeed.jsx";
import PortfolioTable from "./components/PortfolioTable.jsx";
import TradeControls from "./components/TradeControls.jsx";
import TotalPnLDisplay from "./components/TotalPnLDisplay.jsx";
import GameController from "./components/GameController.jsx";
import AICoachPanel from "./components/AICoachPanel.jsx";

import { initialPortfolio } from "./data/mockPortfolio.js";
import { nextEvent } from "./data/mockEvents.js";

export default function App() {
  // --- game state ---
  const ROUND_SECONDS = 30;
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [roundActive, setRoundActive] = useState(false);

  // events/news
  const [feed, setFeed] = useState([]);      // array of events shown in the middle
  const [lastEvent, setLastEvent] = useState(null);

  // portfolio
  const [portfolio, setPortfolio] = useState(initialPortfolio); // [{ticker, price, shares, avgPrice}]
  const tickers = useMemo(() => portfolio.map(p => p.ticker), [portfolio]);

  // price impact cache（由事件驱动）
  const [pctImpact, setPctImpact] = useState(0); // e.g. -0.03 代表 -3%

  // 计时器：中途触发黑天鹅
  useEffect(() => {
    if (!roundActive) return;
    if (secondsLeft <= 0) { setRoundActive(false); return; }

    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);

    // 在 20s & 10s 时各触发一次事件（示例）
    if (secondsLeft === 20 || secondsLeft === 10) {
      const ev = nextEvent();
      setFeed(prev => [ev, ...prev].slice(0, 25));
      setLastEvent(ev);
      setPctImpact(ev.impactPct);

      // 价格根据事件影响做一次“跳变”
      setPortfolio(prev =>
        prev.map(row => ({
          ...row,
          // 简化：所有资产统一受影响（可以扩展为按行业/风格系数）
          price: +(row.price * (1 + ev.impactPct)).toFixed(2),
        }))
      );
    }
    return () => clearTimeout(t);
  }, [roundActive, secondsLeft]);

  // 开始新一轮
  function startRound() {
    setFeed([]);
    setLastEvent(null);
    setPctImpact(0);
    setSecondsLeft(ROUND_SECONDS);
    setRoundActive(true);
  }
  function pauseRound() { setRoundActive(false); }
  function resumeRound() { if (secondsLeft > 0) setRoundActive(true); }

  // 交易操作（更新 shares / avgPrice）
  function handleTrade({ ticker, action, qty }) {
    setPortfolio(prev => prev.map(row => {
      if (row.ticker !== ticker) return row;
      const px = row.price;
      if (action === "BUY") {
        const newShares = row.shares + qty;
        const newAvg = (row.avgPrice * row.shares + px * qty) / newShares;
        return { ...row, shares: newShares, avgPrice: +newAvg.toFixed(2) };
      } else {
        const newShares = Math.max(0, row.shares - qty);
        return { ...row, shares: newShares };
      }
    }));
  }

  // 实时 P/L
  const totalPnL = useMemo(() => {
    return portfolio.reduce((sum, r) => sum + (r.price - r.avgPrice) * r.shares, 0);
  }, [portfolio]);

  return (
    <div className="AppRoot">
      {/* 左列：头像/计时/控制 */}
      <section className="LeftRail glass">
        <div className="Avatar">
          <div className="AvatarCircle">🙂</div>
          <div className="GameTitle">HEDGE</div>
        </div>

        <TimerDisplay seconds={secondsLeft} active={roundActive} />

        <GameController
          onStart={startRound}
          onPause={pauseRound}
          onResume={resumeRound}
          seconds={secondsLeft}
          active={roundActive}
        />

        <AICoachPanel lastEvent={lastEvent} totalPnL={totalPnL} />
      </section>

      {/* 中列：新闻事件流 */}
      <section className="CenterFeed glass">
        <div className="PanelTitle">NEWS HEADLINES (AI)</div>
        <NewsFeed items={feed} />
      </section>

      {/* 右列：投资组合 + 交易 + TOTAL */}
      <section className="RightPortfolio glass">
        <div className="PanelTitle">PORTFOLIO</div>
        <PortfolioTable rows={portfolio} />
        <TradeControls tickers={tickers} onTrade={handleTrade} disabled={!roundActive} />
        <TotalPnLDisplay value={totalPnL} />
        {lastEvent && (
          <div className="ImpactBadge">
            Market impact: {(pctImpact * 100).toFixed(1)}%
          </div>
        )}
      </section>
    </div>
  );
}
