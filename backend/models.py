from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime

EventType = Literal["MACRO", "MICRO", "BLACKSWAN"]


class EventBase(BaseModel):
    id: str
    type: EventType
    title: str
    baseImpactPct: float
    icon: str
    tags: Optional[List[str]] = None


class Event(EventBase):
    impactPct: float
    ts: int  # timestamp in milliseconds
    runtimeId: str
    details: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "macro-1",
                "type": "MACRO",
                "title": "Fed hikes rates by 25 bps",
                "baseImpactPct": -0.012,
                "icon": "🏦",
                "tags": ["rates", "fed"],
                "impactPct": -0.0105,
                "ts": 1704067200000,
                "runtimeId": "macro-1-1704067200000-0"
            }
        }


class EventCreate(BaseModel):
    type: Optional[EventType] = None  # If None, randomly select MACRO or MICRO
    forceBlackSwan: Optional[bool] = False  # Force blackswan event


class EventResponse(BaseModel):
    success: bool
    event: Optional[Event] = None
    message: Optional[str] = None


class EventsListResponse(BaseModel):
    success: bool
    events: List[Event]
    count: int


class EventUpdate(BaseModel):
    """
    Partial update model for events stored in Supabase.
    All fields are optional; only provided fields will be updated.
    """
    title: Optional[str] = None
    details: Optional[str] = None
    impactPct: Optional[float] = None
    baseImpactPct: Optional[float] = None
    icon: Optional[str] = None
    tags: Optional[List[str]] = None
    type: Optional[EventType] = None


# Ticker Models
class Ticker(BaseModel):
    id: int
    symbol: str
    name: str
    sector: str
    created_at: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "symbol": "AAPL",
                "name": "Apple Inc.",
                "sector": "Tech",
                "created_at": "2024-01-01T00:00:00Z"
            }
        }


class TickerCreate(BaseModel):
    symbol: str
    name: str
    sector: str


class TickerResponse(BaseModel):
    success: bool
    ticker: Optional[Ticker] = None
    message: Optional[str] = None


class TickersListResponse(BaseModel):
    success: bool
    tickers: List[Ticker]
    count: int


# Game Models
class Game(BaseModel):
    id: int
    code: Optional[str] = None
    starting_cash: float
    status: str
    created_at: Optional[datetime] = None


class GameCreate(BaseModel):
    code: Optional[str] = None
    starting_cash: float = 10000
    status: str = "active"


class GameResponse(BaseModel):
    success: bool
    game: Optional[Game] = None
    message: Optional[str] = None


# Round Models
class Round(BaseModel):
    id: int
    game_id: int
    round_no: int
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class RoundCreate(BaseModel):
    game_id: int
    round_no: int


class RoundResponse(BaseModel):
    success: bool
    round: Optional[Round] = None
    message: Optional[str] = None


# Round Score Models
class RoundScore(BaseModel):
    id: int
    participant_id: int
    round_id: int
    pnl_delta: float
    reacted: bool
    reaction_ms: Optional[int] = None
    created_at: Optional[datetime] = None


class RoundScoreCreate(BaseModel):
    participant_id: int
    round_id: int
    pnl_delta: float
    reacted: bool
    reaction_ms: Optional[int] = None


class RoundScoreResponse(BaseModel):
    success: bool
    score: Optional[RoundScore] = None
    message: Optional[str] = None


class RoundScoresListResponse(BaseModel):
    success: bool
    scores: List[RoundScore]
    count: int


# Price Snapshot Models
class PriceSnapshot(BaseModel):
    id: int
    game_id: int
    round_id: int
    ticker_id: int
    price: float
    taken_at: Optional[datetime] = None


class PriceSnapshotCreate(BaseModel):
    game_id: int
    round_id: int
    ticker_id: int
    price: float


class PriceSnapshotBatchCreate(BaseModel):
    snapshots: List[PriceSnapshotCreate]


class PriceSnapshotResponse(BaseModel):
    success: bool
    snapshot: Optional[PriceSnapshot] = None
    message: Optional[str] = None


class PriceSnapshotsListResponse(BaseModel):
    success: bool
    snapshots: List[PriceSnapshot]
    count: int

