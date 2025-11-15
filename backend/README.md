# Hedge Game Events API

RESTful API backend for managing game events (news and blackswan events) in the Hedge trading game.

## Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Install dependencies:
```bash
pip install -r ../requirements.txt
```

2. Run the server:
```bash
# Option 1: Using uvicorn directly
uvicorn backend.main:app --reload --port 8000

# Option 2: Using the run script
python backend/run.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- **Interactive API docs (Swagger UI)**: http://localhost:8000/docs
- **Alternative API docs (ReDoc)**: http://localhost:8000/redoc

## Endpoints

### 1. GET /api/events
Get all events with optional filtering.

**Query Parameters:**
- `limit` (optional): Maximum number of events to return (1-1000)
- `type` (optional): Filter by event type (`MACRO`, `MICRO`, or `BLACKSWAN`)

**Example:**
```bash
GET /api/events?limit=10&type=MACRO
```

**Response:**
```json
{
  "success": true,
  "events": [...],
  "count": 10
}
```

### 2. GET /api/events/{event_id}
Get a specific event by its runtimeId.

**Example:**
```bash
GET /api/events/macro-1-1704067200000-0
```

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "macro-1",
    "type": "MACRO",
    "title": "Fed hikes rates by 25 bps",
    "baseImpactPct": -0.012,
    "icon": "🏦",
    "tags": ["rates", "fed"],
    "impactPct": -0.0105,
    "ts": 1704067200000,
    "runtimeId": "macro-1-1704067200000-0"
  },
  "message": "Event retrieved successfully"
}
```

### 3. POST /api/events
Generate and create a new event.

**Request Body:**
```json
{
  "type": "MACRO",  // Optional: "MACRO" or "MICRO". If omitted, randomly selects.
  "forceBlackSwan": false  // Optional: If true, generates a blackswan event
}
```

**Example:**
```bash
POST /api/events
Content-Type: application/json

{
  "type": "MICRO"
}
```

**Response:**
```json
{
  "success": true,
  "event": {...},
  "message": "Event generated successfully"
}
```

### 4. GET /api/events/blackswan
Get all blackswan events.

**Query Parameters:**
- `limit` (optional): Maximum number of events to return (1-1000)

**Example:**
```bash
GET /api/events/blackswan?limit=5
```

### 5. GET /api/events/news
Get all news events (MACRO and MICRO events).

**Query Parameters:**
- `limit` (optional): Maximum number of events to return (1-1000)

**Example:**
```bash
GET /api/events/news?limit=20
```

## Event Types

- **MACRO**: Macroeconomic events (e.g., Fed rate changes, CPI reports)
- **MICRO**: Microeconomic/company-specific events (e.g., earnings, buybacks)
- **BLACKSWAN**: Rare, high-impact events (e.g., flash crashes, geopolitical shocks)

## Event Structure

```json
{
  "id": "macro-1",
  "type": "MACRO",
  "title": "Fed hikes rates by 25 bps",
  "baseImpactPct": -0.012,
  "icon": "🏦",
  "tags": ["rates", "fed"],
  "impactPct": -0.0105,
  "ts": 1704067200000,
  "runtimeId": "macro-1-1704067200000-0",
  "details": "Optional details for blackswan events"
}
```

## Health Check

```bash
GET /health
```

Returns: `{"status": "healthy"}`

## CORS

The API is configured to allow requests from:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (Alternative React dev server)
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

## Database

- Events are stored in **Supabase** database and persist across server restarts
- See `SUPABASE_SETUP.md` for database setup instructions
- The `events` table stores all generated events with full history
- Event generation matches the frontend's logic for consistency
- Each generated event has a unique `runtimeId` and timestamp

## Notes

- Events are persisted in Supabase database (not in-memory)
- All events are queryable via Supabase dashboard
- Event generation matches the frontend's logic for consistency
- Each generated event has a unique `runtimeId` and timestamp

