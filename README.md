# HEDGE

## Team & Contributions
- Cynthia: Developed the interface for viewing holdings, executing trades, and displaying live P/L updates.
- Amy: Implemented the real-time news ticker and randomized event engine that drive gameplay.
- Harsh: Controlled game pacing, round logic, and scoring.
- Uditi: Provided post-round behavioral analysis, feedback, and performance visualization.

## What It Does
Hedge is a simulated financial trading platform that allows beginner investors to explore the workings of the stock market by making artificial trades (buy and sell orders) in a specified amount of time (5, 10, or 15 minutes). Occasionally, Black Swan events will occur that cause stock prices for jump or fall, and the player will have to adjust their trades accordingly. They will also receive feedback during the game from an AI coach and will be able to see their net P/L.

## Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Mock Data
Our app uses mock data for:
1. Black Swan events that will occur regularly (`mockEvents.js`).
2. AI coach feedback that will appear when positive or negative trading attributes are detected (`mockFeedback.js`).
3. Company tickers, prices, and # of shares at start (`mockPortfolio.js`).

Next week, we will connect it to our backend APIs.