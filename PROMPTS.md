# PROMPTS & DOCUMENTATION

## AI Coach & Analytics Dashboard Implementation

This document explains the AI Coach feedback system, mock data usage, and component architecture implemented by Member D (Uditi).

---

## 📋 Overview

The AI Coach & Analytics Dashboard provides post-round behavioral analysis, personalized feedback, and performance visualization. The system analyzes player reactions to market events and generates contextual feedback in two modes: **Serious** (professional/analytical) and **Playful** (casual/engaging).

---

## 🎯 Components Implemented

### 1. **AICoachPanel.jsx**
**Purpose**: Displays real-time event summaries and player reaction analysis in the left sidebar.

**Features**:
- **Event Summary**: Shows event type, impact percentage, and title using `generateEventSummary()` from `mockFeedback.js`
- **Player Reaction Analysis**: Tracks trades made after events and categorizes reactions (e.g., "Rapid selling detected", "Aggressive buying", "No action taken")
- **Portfolio Analysis**: Displays sector diversification metrics and dominant sector concentration
- **Live P/L Display**: Shows current session profit/loss

**Key Props**:
```javascript
{
  lastEvent,        // Most recent market event
  totalPnL,         // Current profit/loss
  portfolio,        // Current holdings array
  recentTrades,     // Array of trade records
  tradesSinceLastEvent,
  feedbackMode      // "serious" or "playful"
}
```

---

### 2. **FeedbackModal.jsx**
**Purpose**: Displays personalized feedback tips (2-3) in a modal dialog after rounds or on-demand.

**Features**:
- **Personalized Tips**: Uses `generateFeedback()` to produce context-aware feedback based on:
  - Player actions (panic selling, aggressive buying, passive response, etc.)
  - Portfolio state (concentration, diversification)
  - Event type (MACRO, MICRO, BLACKSWAN)
  - Current P/L
- **Event Context**: Shows event summary with impact visualization
- **Mode Selection**: Adapts feedback tone based on Serious/Playful toggle
- **Clean UI**: Modal overlay with gradient background and smooth interactions

**Trigger**: 
- Manual: "💡 Get Feedback" button (appears when an event has occurred)
- Automatic: Can be integrated to trigger after round completion

**Feedback Categories**:
- `PANIC_SELLING` - Detected reactive selling during volatility
- `OVER_CONCENTRATION` - Single-sector portfolio risk
- `GOOD_DIVERSIFICATION` - Well-balanced holdings
- `MISSED_OPPORTUNITY` - No action during favorable events
- `AGGRESSIVE_BUYING` - Momentum chasing behavior
- `PASSIVE_RESPONSE` - No trades during significant events
- `BLACK_SWAN_RESPONSE` - Reaction to rare extreme events
- `PROFIT_TAKING` - Strategic profit realization
- `RATE_SHOCK` - Response to interest rate changes
- `EARNINGS_MOVE` - Company-specific news reactions

---

### 3. **StatsDashboard.jsx**
**Purpose**: Visualizes cumulative P/L trends and tracks unlocked titles/progress.

**Features**:
- **P/L Trend Chart**: Simple line chart showing profit/loss over time
  - Timeframe selector: 5m, 15m, 30m, All Time
  - Trend indicators: Upward 📈, Downward 📉, Stable ➡️
- **Title Progress Bar**: Shows current title and progress to next title
  - Calculates progress percentage based on streak
- **Unlocked Titles List**: 
  - Displays all titles with lock/unlock status
  - Highlights current title
  - Shows required streak for each title
- **P/L Summary Cards**: Total P/L and streak display with color coding

**Data Tracking**:
- P/L history updated every 5 seconds during active rounds
- Streak tracked based on round survival (maintained P/L or improvement)
- Title calculation uses `calculateTitle()` from `gameLogic.js`

---

### 4. **mockFeedback.js**
**Purpose**: Stores NLP-style feedback data and generation logic.

**Structure**:

#### Feedback Types
Defines 10 behavioral categories that trigger different feedback sets.

#### Feedback Modes

**Serious Mode** (`seriousFeedback`):
- Professional, analytical tone
- Uses terms like "correlates with", "risk-adjusted returns", "systematic responses"
- Example: *"Detected panic selling behavior. Studies show that reactive selling during market volatility often underperforms holding strategies."*

**Playful Mode** (`playfulFeedback`):
- Casual, engaging tone with emojis
- Uses conversational language and metaphors
- Example: *"Whoa there, speed trader! 😅 Panic selling is like throwing all your chips away when the table gets hot."*

#### Core Functions

**`generateFeedback({ lastEvent, playerAction, portfolio, totalPnL, mode })`**
- Analyzes player behavior and portfolio state
- Selects appropriate feedback category
- Returns 2-3 personalized tips
- Replaces placeholders like `{sector}` and `{eventType}`

**`generateEventSummary(event, totalPnL)`**
- Creates concise event summary string
- Includes impact percentage and current P/L
- Format: `"{type} event: {title}. Impact: {impact}%. Your P/L: {pnl}"`

---

## 🔧 Integration Details

### App.jsx Integration

**State Management**:
```javascript
// Player action tracking
const [recentTrades, setRecentTrades] = useState([]);
const [tradesSinceLastEvent, setTradesSinceLastEvent] = useState(0);

// Feedback system
const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
const [feedbackMode, setFeedbackMode] = useState("serious");

// Stats tracking
const [pnlHistory, setPnlHistory] = useState([]);
const [streak, setStreak] = useState(0);
```

**Trade Tracking**:
- Each trade records: `action`, `ticker`, `qty`, `timestamp`, `eventId`
- Trades linked to events via `eventId` for reaction analysis
- Last 10 trades kept in memory for analysis

**P/L History**:
- Updates every 5 seconds during active rounds
- Stores: `{ timestamp, pnl }`
- Last 100 entries retained for trend analysis

**Streak Calculation**:
- Tracks survival based on round completion
- Increments if P/L improved or stayed positive
- Resets to 0 if portfolio value drops significantly

---

## 📊 Mock Data Usage

### mockFeedback.js Structure

**Feedback Categories**:
Each category contains arrays of feedback strings in both serious and playful modes. The system:
1. Analyzes player action and portfolio state
2. Maps to appropriate category
3. Randomly selects 2-3 tips from that category
4. Replaces dynamic placeholders

**Placeholder Replacement**:
- `{sector}` → Dominant sector name (e.g., "Tech", "Financials")
- `{eventType}` → Event type (e.g., "MACRO", "MICRO")

**Player Action Detection**:
Actions inferred from recent trades:
- `panic_sell`: Multiple sells after negative event
- `bought_aggressively`: Multiple buys
- `no_action`: No trades after significant event
- `sold`: Single sell (context-dependent)
- `bought`: Single buy

---

## 🎨 User Experience Flow

1. **Event Occurs**: Market event triggers price impact
2. **Player Trades**: User makes buy/sell decisions (or stays passive)
3. **AICoachPanel Updates**: Shows event summary and reaction analysis
4. **User Requests Feedback**: Clicks "💡 Get Feedback" button
5. **FeedbackModal Opens**: Displays 2-3 personalized tips based on:
   - Selected mode (Serious/Playful)
   - Player actions
   - Portfolio state
   - Event context
6. **StatsDashboard Updates**: Continuously tracks P/L trends and title progress

---

## 🔄 Feedback Mode Toggle

**Location**: Left sidebar, below AICoachPanel

**Functionality**:
- Two-button toggle: "📊 Serious" / "🎮 Playful"
- Active mode highlighted with colored border
- Mode persists during session
- Affects all feedback generation (AICoachPanel summary, FeedbackModal tips)

**Visual Indicators**:
- AICoachPanel title shows mode icon
- Feedback button shows active mode icon
- Modal header displays mode label

---

## 📈 Title System Integration

**Source**: `gameLogic.js` - `TITLES` array and `calculateTitle()` function

**Titles** (based on streak):
- `Novice Trader` (0 rounds)
- `Market Strategist` (3 rounds)
- `Senior Trader` (5 rounds)
- `Portfolio Manager` (8 rounds)
- `Market Veteran` (12 rounds)
- `Trading Legend` (15 rounds)

**StatsDashboard Display**:
- Shows current title
- Progress bar to next title
- List of all titles with unlock status
- Locked titles shown at 50% opacity with 🔒 icon

---

## 🧪 Testing & Validation

**Feedback Generation**:
- Test with different player actions (panic sell, aggressive buy, passive)
- Verify mode switching changes feedback tone
- Check placeholder replacement (sector names, event types)

**Stats Tracking**:
- Verify P/L history updates during active rounds
- Check streak increments on round completion
- Validate title progression

**Component Integration**:
- Ensure AICoachPanel receives all required props
- Verify FeedbackModal opens/closes correctly
- Check StatsDashboard renders with mock data

---

## 🚀 Future Enhancements

**Potential Additions**:
1. Automatic feedback trigger after round completion
2. Historical feedback archive
3. More sophisticated NLP analysis (sentiment, patterns)
4. Integration with external AI for dynamic feedback generation
5. Performance metrics comparison (vs. other players)
6. Export stats to CSV/JSON
7. Feedback history tracking

---

## 📝 Notes

- Feedback system is fully functional with mock data
- All components follow existing codebase styling (`glass` class, color variables)
- Player action detection is heuristic-based (can be enhanced with ML)
- P/L history updates are optimized (every 5s, max 100 entries)
- Mode toggle state is local to session (not persisted)

---

**Implementation Date**: 2024
**Component Files**:
- `src/components/AICoachPanel.jsx`
- `src/components/FeedbackModal.jsx`
- `src/components/StatsDashboard.jsx`
- `src/data/mockFeedback.js`
- `src/App.jsx` (integration)
