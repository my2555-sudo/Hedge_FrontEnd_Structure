# CONTRIBUTIONS

## Cynthia - Portfolio & Trading Panel

### Main Goal:
Develop the interface for viewing holdings, executing trades, and displaying live P/L updates.

### Responsibilities
1. Build PortfolioTable to display each asset’s ticker, shares, avg price, and P/L.

2. Implement TradeControls with interactive Buy/Sell buttons that update state locally.

3. Create TotalPnLDisplay summarizing total profit / loss each round.

4. Disable or highlight trading buttons during Black Swan events.

5. Load initial holdings from mockPortfolio.js.

## Amy – News Feed & Event System

### Main Goal:
Implement the real-time news ticker and randomized event engine that drive gameplay.

### Responsibilities
1. Build NewsFeed to render continuously updating headlines.

2. Write EventGenerator.js to create macro (rate hikes, inflation) and micro (earnings, M&A) events.

3. Link each event to simulated market reactions that affect the Portfolio module.

4. Add click/hover actions on headlines to open event details and trigger AI feedback.

5. Visually differentiate Macro vs. Micro events (colors / icons).

6. Store example events in mockEvents.js.

## Harsh - Game Flow & Timer System

### Main Goal:
Control game pacing, round logic, and scoring.

### Responsibilities
1. Develop GameController to manage full game rounds (Start → Countdown → Event → Results).

2. Create TimerDisplay showing a 30-second countdown.

3. Trigger random Black Swan events mid-round via callbacks from EventGenerator.

4. Freeze trading at round end and dispatch results to AI Coach.

5. Track consecutive survival streaks and assign titles (“Market Strategist”, “Senior Trader”, etc.).

6. Build LeaderboardTrigger to display rankings after rounds.

7. Store scoring logic inside gameLogic.js.

## Uditi - AI Coach & Analytics Dashboard

### Main Goal:
Provide post-round behavioral analysis, feedback, and performance visualization.

### Responsibilities
1. Implement AICoachPanel summarizing each event and player reaction.

2. Build FeedbackModal displaying 2–3 personalized tips.

3. Create StatsDashboard showing cumulative P/L trends and unlocked titles.

4. Add toggle between Serious and Playful feedback modes.

5. Store sample NLP-style feedback in mockFeedback.js (e.g., “panic selling”, “try diversification”).