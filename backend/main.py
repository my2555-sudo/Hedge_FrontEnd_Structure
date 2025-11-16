from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import events, tickers, games, round_scores, price_snapshots
from backend.database import test_connection

app = FastAPI(
    title="Hedge Game Events API",
    description="RESTful API for managing game events (news and blackswan events)",
    version="1.0.0"
)

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default dev server
        "http://localhost:3000",  # Alternative React dev server
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(events.router)
app.include_router(tickers.router)
app.include_router(games.router)
app.include_router(round_scores.router)
app.include_router(price_snapshots.router)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Hedge Game Events API",
        "version": "1.0.0",
        "endpoints": {
            "GET /api/events": "Get all events (with optional filters)",
            "GET /api/events/{id}": "Get a specific event by runtimeId",
            "POST /api/events": "Generate a new event",
            "GET /api/events/blackswan": "Get all blackswan events",
            "GET /api/events/news": "Get all news events (MACRO/MICRO)",
            "GET /api/tickers": "Get all tickers",
            "GET /api/tickers/{id}": "Get a ticker by ID",
            "GET /api/tickers/symbol/{symbol}": "Get a ticker by symbol",
            "POST /api/tickers": "Create a new ticker",
        },
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    db_connected = test_connection()
    return {
        "status": "healthy",
        "database": "connected" if db_connected else "disconnected"
    }


@app.get("/favicon.ico")
async def favicon():
    """Handle favicon requests to prevent 404 errors in logs."""
    return Response(status_code=204)

