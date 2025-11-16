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

