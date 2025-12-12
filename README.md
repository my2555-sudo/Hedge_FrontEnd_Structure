# Hedge

## Project Title and Description
Hedge: Trading Game Platform
Hedge is a simulated financial trading platform that allows beginner investors to explore the workings of the stock market by making artificial trades (buy and sell orders) in a specified amount of time (5, 10, or 15 minutes). Occasionally, Black Swan events will occur that cause stock prices to jump or fall, and the player will have to adjust their trades accordingly. Players receive feedback during the game from an AI coach and can see their net P/L.

## Tech Stack Used
- **Frontend**: React, Vite
- **Backend**: FastAPI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: CSS

## Setup Instructions (How to Run Locally)

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+ and pip

### 1. Backend API

1. From the project root:
   ```bash
   cd Hedge_FrontEnd_Structure
   ```
2. (Optional but recommended) create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```
   On Windows:
   ```bash
   .venv\Scripts\activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```

The API will be available at `http://localhost:8000`.

### 2. Frontend App

1. In a new terminal window:
   ```bash
   cd Hedge_FrontEnd_Structure/frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```

The frontend will be available at the URL printed by Vite, typically `http://localhost:5173`.

## Environment Variables Needed
Create a `.env` file in the project root with the following variables:
```env
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-key>
```

Create a `.env` file in `frontend/` with the following variables:
```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_API_BASE_URL=http://localhost:8000
```

## API Endpoint Documentation

Base URL:
`http://localhost:8000`

---

### **Games**
#### GET /games
Returns all games.

#### POST /games
Creates a new game.
Body:
{
  "code": "GAME001",
  "starting_cash": 100000
}

---

### **Game Participants**
#### POST /games/{game_id}/join
Adds a user to a game.
Body:
{
  "user_id": "uuid-of-user"
}

#### GET /games/{game_id}/participants
Returns all participants in the game.

---

### **Rounds**
#### GET /games/{game_id}/rounds
Returns all rounds for the game.

#### POST /games/{game_id}/rounds
Creates a round.
Body:
{
  "round_no": 1,
  "starts_at": "2025-11-16T20:00:00Z"
}

---

### **Tickers**
#### GET /tickers
Returns tradable tickers.
Response:
[
  { "id": 1, "symbol": "AAPL", "name": "Apple", "sector": "Technology" }
]

---

### **Price Snapshots**
#### GET /rounds/{round_id}/prices
Returns price snapshots for the round.

---

### **Events**
#### GET /rounds/{round_id}/events
Returns Black Swan events for the round.
Example:
[
  {
    "id": 1,
    "etype": "negative",
    "severity": "high",
    "headline": "Unexpected rate hike",
    "description": "Markets fall sharply",
    "impulse_pct": -12.5
  }
]

#### POST /rounds/{round_id}/events
Creates a new event.
Body:
{
  "etype": "positive",
  "severity": "medium",
  "headline": "Earnings beat expectations",
  "description": "Strong revenue growth",
  "target_ticker_id": 3,
  "impulse_pct": 5.2
}

---

### **Trades**
#### POST /rounds/{round_id}/trade
Executes a trade.
Body:
{
  "participant_id": 12,
  "ticker_id": 1,
  "side": "buy",
  "quantity": 5,
  "price": 187.50,
  "response_ms": 420
}

#### GET /participants/{participant_id}/trades
Returns all trades by the participant.

---

### **Round Scores**
#### GET /rounds/{round_id}/scores
Returns scoring information for each participant.
Example:
[
  {
    "participant_id": 12,
    "pnl_delta": 3200.50,
    "points_earned": 15,
    "reacted": true,
    "reaction_ms": 420
  }
]

---

### **AI Coach Feedback**
#### GET /rounds/{round_id}/feedback
Returns AI behavioral feedback for the round.
Example:
[
  {
    "participant_id": 12,
    "tone": "positive",
    "feedback": "Great job cutting losses quickly!"
  }
]

---
### Database schema
## Database Schema

```sql
-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GAMES
CREATE TABLE games (
  id BIGINT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  starting_cash NUMERIC NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GAME PARTICIPANTS
CREATE TABLE game_participants (
  id BIGINT PRIMARY KEY,
  game_id BIGINT REFERENCES games(id),
  user_id UUID REFERENCES profiles(id),
  cash_balance NUMERIC NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROUNDS
CREATE TABLE rounds (
  id BIGINT PRIMARY KEY,
  game_id BIGINT REFERENCES games(id),
  round_no INT NOT NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ
);

-- TICKERS
CREATE TABLE tickers (
  id BIGINT PRIMARY KEY,
  symbol TEXT UNIQUE NOT NULL,
  name TEXT,
  sector TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRICE SNAPSHOTS
CREATE TABLE price_snapshots (
  id BIGINT PRIMARY KEY,
  game_id BIGINT REFERENCES games(id),
  round_id BIGINT REFERENCES rounds(id),
  ticker_id BIGINT REFERENCES tickers(id),
  price NUMERIC NOT NULL,
  taken_at TIMESTAMPTZ DEFAULT NOW()
);

-- EVENTS
CREATE TABLE events (
  id BIGINT PRIMARY KEY,
  round_id BIGINT REFERENCES rounds(id),
  etype TEXT NOT NULL,
  severity TEXT NOT NULL,
  headline TEXT,
  description TEXT,
  target_ticker_id BIGINT REFERENCES tickers(id),
  impulse_pct NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRADES
CREATE TABLE trades (
  id BIGINT PRIMARY KEY,
  participant_id BIGINT REFERENCES game_participants(id),
  round_id BIGINT REFERENCES rounds(id),
  ticker_id BIGINT REFERENCES tickers(id),
  side TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  response_ms INT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROUND SCORES
CREATE TABLE round_scores (
  id BIGINT PRIMARY KEY,
  participant_id BIGINT REFERENCES game_participants(id),
  round_id BIGINT REFERENCES rounds(id),
  pnl_delta NUMERIC,
  points_earned INT,
  reacted BOOLEAN,
  reaction_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COACH FEEDBACK
CREATE TABLE coach_feedback (
  id BIGINT PRIMARY KEY,
  participant_id BIGINT REFERENCES game_participants(id),
  round_id BIGINT REFERENCES rounds(id),
  tone TEXT,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
