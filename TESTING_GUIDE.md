# Testing Guide - Database Connection & Data Verification

## Step 1: Setup Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd Hedge_FrontEnd_Structure/backend
touch .env
```

Add your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
```

**Where to find these:**
1. Go to your Supabase project dashboard
2. Settings → API
3. Copy `Project URL` → `SUPABASE_URL`
4. Copy `anon public` key → `SUPABASE_KEY`

---

## Step 2: Test Database Connection

### Option A: Run Test Script

```bash
cd Hedge_FrontEnd_Structure/backend
python test_database.py
```

**Expected output:**
```
============================================================
Database Connection Test
============================================================
✅ SUPABASE_URL: https://xxx.supabase.co...
✅ SUPABASE_KEY: ********************...xxxxxxxxxx

Testing database connection...
✅ Database connection: SUCCESS

Testing tickers table...
✅ Found X tickers in database
   Sample: AAPL - Apple Inc.

Testing games table...
✅ Game created/retrieved: ID=1, Status=active

...
```

### Option B: Test via API Health Endpoint

1. **Start the backend server:**
   ```bash
   cd Hedge_FrontEnd_Structure/backend
   python run.py
   # OR
   uvicorn backend.main:app --reload --port 8000
   ```

2. **Test health endpoint:**
   ```bash
   curl http://localhost:8000/health
   ```

   **Expected response:**
   ```json
   {
     "status": "healthy",
     "database": "connected"
   }
   ```

3. **Test tickers endpoint:**
   ```bash
   curl http://localhost:8000/api/tickers
   ```

   **Expected response:**
   ```json
   {
     "success": true,
     "tickers": [
       {
         "id": 1,
         "symbol": "AAPL",
         "name": "Apple Inc.",
         "sector": "Tech"
       },
       ...
     ]
   }
   ```

---

## Step 3: Verify Frontend Connection

1. **Start backend** (if not already running):
   ```bash
   cd Hedge_FrontEnd_Structure/backend
   python run.py
   ```

2. **Start frontend:**
   ```bash
   cd Hedge_FrontEnd_Structure/frontend
   npm run dev
   ```

3. **Check browser console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - You should see: `✅ Tickers loaded successfully` (no errors)
   - If you see `ERR_CONNECTION_REFUSED`, the backend is not running

4. **Test in browser:**
   - Visit `http://localhost:5173`
   - Open Network tab in DevTools
   - Look for requests to `http://localhost:8000/api/tickers`
   - Status should be `200 OK`

---

## Step 4: Verify Data Operations

### Test 1: Create Tickers (if database is empty)

**Via API:**
```bash
curl -X POST http://localhost:8000/api/tickers \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "sector": "Tech"
  }'
```

**Via Python:**
```python
from backend.services.ticker_service import create_ticker

ticker = create_ticker("AAPL", "Apple Inc.", "Tech")
print(f"Created: {ticker.symbol}")
```

### Test 2: Create Game & Round

**Via API:**
```bash
# Create game
curl -X POST http://localhost:8000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "starting_cash": 10000,
    "status": "active"
  }'

# Create round (replace {game_id} with actual ID)
curl -X POST http://localhost:8000/api/games/rounds \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": 1,
    "round_no": 1
  }'
```

### Test 3: Save Round Score

**Via API:**
```bash
curl -X POST http://localhost:8000/api/round-scores \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": 1,
    "round_id": 1,
    "pnl_delta": 204.40,
    "reacted": true,
    "reaction_ms": 1500
  }'
```

### Test 4: Save Price Snapshots

**Via API:**
```bash
curl -X POST http://localhost:8000/api/price-snapshots/batch \
  -H "Content-Type: application/json" \
  -d '{
    "snapshots": [
      {
        "game_id": 1,
        "round_id": 1,
        "ticker_id": 1,
        "price": 151.80
      },
      {
        "game_id": 1,
        "round_id": 1,
        "ticker_id": 2,
        "price": 312.40
      }
    ]
  }'
```

---

## Step 5: Verify Data in Supabase

1. **Go to Supabase Dashboard:**
   - Navigate to your project
   - Go to "Table Editor"

2. **Check tables:**
   - `tickers` - Should have your ticker data
   - `games` - Should have game records
   - `rounds` - Should have round records
   - `round_scores` - Should have score records
   - `price_snapshots` - Should have price snapshot records

3. **Check RLS policies:**
   - Go to "Authentication" → "Policies"
   - Ensure tables have policies that allow API access
   - For testing, you can temporarily disable RLS or add permissive policies

---

## Step 6: End-to-End Test

1. **Start backend:**
   ```bash
   cd backend
   python run.py
   ```

2. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Play the game:**
   - Click "Start" to begin a round
   - Wait for events to appear
   - Make some trades
   - Let the round end

4. **Check database:**
   - Go to Supabase Table Editor
   - Verify:
     - A new game was created in `games` table
     - A new round was created in `rounds` table
     - Price snapshots were saved in `price_snapshots` table
     - Round score was saved in `round_scores` table

---

## Troubleshooting

### Error: `ERR_CONNECTION_REFUSED`
- **Problem:** Backend is not running
- **Solution:** Start backend with `python run.py` or `uvicorn backend.main:app --reload --port 8000`

### Error: `Missing Supabase credentials`
- **Problem:** `.env` file is missing or incomplete
- **Solution:** Create `.env` file in `backend` directory with `SUPABASE_URL` and `SUPABASE_KEY`

### Error: `Database connection: FAILED`
- **Problem:** Invalid credentials or network issue
- **Solution:** 
  1. Verify credentials in Supabase dashboard
  2. Check if tables exist
  3. Check RLS policies

### Error: `Table does not exist`
- **Problem:** Tables not created in Supabase
- **Solution:** Run SQL migrations or create tables manually in Supabase SQL Editor

### Frontend shows "Failed to load tickers, using mock data"
- **Problem:** Backend API call failed
- **Solution:** 
  1. Check if backend is running
  2. Check browser console for errors
  3. Verify CORS is configured correctly
  4. Check Network tab for API request status

---

## Quick Test Checklist

- [ ] `.env` file created with correct credentials
- [ ] Backend starts without errors
- [ ] `curl http://localhost:8000/health` returns `{"status": "healthy", "database": "connected"}`
- [ ] `curl http://localhost:8000/api/tickers` returns ticker data
- [ ] Frontend connects to backend (no `ERR_CONNECTION_REFUSED`)
- [ ] Tickers load in frontend (check Network tab)
- [ ] Game creates successfully when starting a round
- [ ] Round score saves when round ends
- [ ] Price snapshots save during gameplay
- [ ] Data appears in Supabase Table Editor

---

## Next Steps

Once all tests pass:
1. ✅ Database connection verified
2. ✅ API endpoints working
3. ✅ Frontend-backend integration working
4. ✅ Data saving correctly

You're ready to use the application! 🎉

