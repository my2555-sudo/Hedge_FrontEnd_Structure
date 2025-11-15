import random
import time
from typing import List, Optional
from backend.models import Event, EventType
from backend.database import get_supabase_client

# Event pools matching the frontend structure
MACRO_POOL = [
    {"id": "macro-1", "type": "MACRO", "title": "Fed hikes rates by 25 bps", "baseImpactPct": -0.012, "icon": "🏦", "tags": ["rates", "fed"]},
    {"id": "macro-2", "type": "MACRO", "title": "CPI cools below expectations", "baseImpactPct": 0.015, "icon": "🧾", "tags": ["inflation", "cpi"]},
    {"id": "macro-3", "type": "MACRO", "title": "Oil jumps on OPEC+ cuts", "baseImpactPct": 0.009, "icon": "🛢️", "tags": ["energy", "opec"]},
]

MICRO_POOL = [
    {"id": "micro-1", "type": "MICRO", "title": "TechCo beats; raises guidance", "baseImpactPct": 0.035, "icon": "💻", "tags": ["earnings", "tech"]},
    {"id": "micro-2", "type": "MICRO", "title": "BioHealth drug fails Phase 3", "baseImpactPct": -0.028, "icon": "🧪", "tags": ["trial", "biotech"]},
    {"id": "micro-3", "type": "MICRO", "title": "AutoCo announces $5B buyback", "baseImpactPct": 0.02, "icon": "🚗", "tags": ["buyback", "auto"]},
]

BLACKSWAN_POOL = [
    {"id": "bs-1", "type": "BLACKSWAN", "title": "Flash Crash: Liquidity Vacuum", "baseImpactPct": -0.12, "icon": "⚠️", "details": "Severe market dislocation detected. Liquidity has evaporated across major exchanges."},
    {"id": "bs-2", "type": "BLACKSWAN", "title": "Geopolitical Shock: Sanctions Escalation", "baseImpactPct": -0.08, "icon": "🛑", "details": "Major geopolitical event triggers widespread market uncertainty."},
    {"id": "bs-3", "type": "BLACKSWAN", "title": "Exchange Outage: Price Discovery Stalls", "baseImpactPct": -0.06, "icon": "🧯", "details": "Critical exchange infrastructure failure disrupts trading operations."},
]

_seq_counter = 0
_bs_seq_counter = 0


def _pick_random(arr: List[dict]) -> dict:
    """Pick a random item from a list."""
    return random.choice(arr)


def _event_to_db_dict(event: Event, round_id: Optional[int] = None, target_ticker_id: Optional[int] = None) -> dict:
    """
    Convert Event model to database dictionary format.
    Maps to existing Supabase table structure:
    - headline (text) <- title
    - description (text) <- details
    - etype/event_type (text) <- type
    - severity (text) <- derived from impact_pct
    - round_id (int8) <- optional, can be None
    - target_ticker_id (int8) <- optional, can be None
    - impulse_pct (numeric) <- baseImpactPct
    - impact_pct (numeric) <- impactPct
    """
    # Determine severity based on impact percentage
    impact_abs = abs(event.impactPct)
    if event.type == "BLACKSWAN":
        severity = "HIGH"
    elif impact_abs >= 0.02:  # >= 2%
        severity = "HIGH"
    elif impact_abs >= 0.01:  # >= 1%
        severity = "NORMAL"
    else:
        severity = "LOW"
    
    db_dict = {
        "headline": event.title,
        "description": event.details or f"{event.title} - Market impact: {event.impactPct * 100:.2f}%",
        "etype": event.type,  # Based on your table structure
        "severity": severity,
        "impulse_pct": float(event.baseImpactPct),  # Base impact percentage
        "impact_pct": float(event.impactPct),  # Calculated impact with jitter
    }
    
    # Only include optional fields if they're provided
    if round_id is not None:
        db_dict["round_id"] = round_id
    
    if target_ticker_id is not None:
        db_dict["target_ticker_id"] = target_ticker_id
    
    return db_dict


def _db_dict_to_event(db_dict: dict) -> Event:
    """
    Convert database dictionary to Event model.
    Maps from existing Supabase table structure to Event model.
    """
    # Extract event type (could be "etype" or "event_type")
    event_type = db_dict.get("etype") or db_dict.get("event_type") or db_dict.get("type", "MACRO")
    
    # Extract headline/title
    title = db_dict.get("headline") or db_dict.get("title", "")
    
    # Extract description/details
    details = db_dict.get("description") or db_dict.get("details")
    
    # Generate a runtime ID if not present (for compatibility)
    runtime_id = db_dict.get("runtime_id") or f"event-{db_dict.get('id', 'unknown')}-{int(time.time() * 1000)}"
    
    # Extract timestamp (use created_at if ts not available)
    ts = db_dict.get("ts")
    if not ts and db_dict.get("created_at"):
        # Convert created_at timestamp to milliseconds
        import datetime
        if isinstance(db_dict["created_at"], str):
            dt = datetime.datetime.fromisoformat(db_dict["created_at"].replace('Z', '+00:00'))
        else:
            dt = db_dict["created_at"]
        ts = int(dt.timestamp() * 1000)
    if not ts:
        ts = int(time.time() * 1000)
    
    # Get impact_pct from database (preferred) or estimate from severity
    impact_pct = db_dict.get("impact_pct")
    if impact_pct is None:
        # Estimate impact from severity if not available
        severity = db_dict.get("severity") or db_dict.get("event_severity", "NORMAL")
        if severity == "HIGH":
            impact_pct = -0.05 if event_type == "BLACKSWAN" else -0.02
        elif severity == "LOW":
            impact_pct = -0.005
        else:  # NORMAL
            impact_pct = -0.01
    
    # Get base_impact_pct (impulse_pct) from database or use impact_pct as fallback
    base_impact_pct = db_dict.get("impulse_pct") or db_dict.get("base_impact_pct")
    if base_impact_pct is None:
        base_impact_pct = impact_pct  # Use impact_pct as fallback
    
    # Generate a template ID based on type and title
    event_id = f"{event_type.lower()}-{abs(hash(title)) % 1000}"
    
    return Event(
        id=event_id,
        type=event_type,
        title=title,
        baseImpactPct=float(base_impact_pct),
        impactPct=float(impact_pct),
        icon=db_dict.get("icon", "📰"),  # Default icon if not stored
        tags=db_dict.get("tags", []) or [],
        runtimeId=runtime_id,
        ts=ts,
        details=details,
    )


def generate_event(event_type: Optional[EventType] = None, force_blackswan: bool = False) -> Event:
    """
    Generate a new event and store it in Supabase.
    Matches the frontend's nextEvent() and nextBlackSwan() logic.
    
    Args:
        event_type: If provided, generate this specific type (MACRO or MICRO)
        force_blackswan: If True, generate a blackswan event
    
    Returns:
        Event object with generated data
    """
    global _seq_counter, _bs_seq_counter
    supabase = get_supabase_client()
    
    if force_blackswan or event_type == "BLACKSWAN":
        # Generate blackswan event
        base = _pick_random(BLACKSWAN_POOL)
        jitter = (random.random() - 0.5) * 0.04
        impact_pct = round(base["baseImpactPct"] + jitter, 4)
        runtime_id = f"{base['id']}-{int(time.time() * 1000)}-{_bs_seq_counter}"
        _bs_seq_counter += 1
        
        event = Event(
            id=base["id"],
            type="BLACKSWAN",
            title=base["title"],
            baseImpactPct=base["baseImpactPct"],
            icon=base["icon"],
            tags=base.get("tags", []),
            impactPct=impact_pct,
            ts=int(time.time() * 1000),
            runtimeId=runtime_id,
            details=base.get("details", "Severe market dislocation detected.")
        )
    else:
        # Generate MACRO or MICRO event
        if event_type == "MACRO":
            pool = MACRO_POOL
        elif event_type == "MICRO":
            pool = MICRO_POOL
        else:
            # Randomly choose between MACRO and MICRO (50/50)
            pool = random.choice([MACRO_POOL, MICRO_POOL])
        
        base = _pick_random(pool)
        jitter = (random.random() - 0.5) * 0.008  # ±0.4%
        impact_pct = round(base["baseImpactPct"] + jitter, 4)
        runtime_id = f"{base['id']}-{int(time.time() * 1000)}-{_seq_counter}"
        _seq_counter += 1
        
        event = Event(
            id=base["id"],
            type=base["type"],
            title=base["title"],
            baseImpactPct=base["baseImpactPct"],
            icon=base["icon"],
            tags=base.get("tags", []),
            impactPct=impact_pct,
            ts=int(time.time() * 1000),
            runtimeId=runtime_id
        )
    
    # Store the event in Supabase
    try:
        # Note: round_id and target_ticker_id are optional - set to None if not in a specific round/ticker
        db_dict = _event_to_db_dict(event, round_id=None, target_ticker_id=None)
        result = supabase.table("events").insert(db_dict).execute()
        if not result.data:
            print(f"Warning: Event inserted but no data returned: {runtime_id}")
    except Exception as e:
        print(f"Error storing event in Supabase: {e}")
        # Continue anyway - event is still generated, just not stored
        # In production, you might want to raise this or handle it differently
    
    return event


def get_all_events(limit: Optional[int] = None, event_type: Optional[EventType] = None) -> List[Event]:
    """
    Get all stored events from Supabase, optionally filtered by type and limited.
    
    Args:
        limit: Maximum number of events to return
        event_type: Filter by event type (MACRO, MICRO, BLACKSWAN)
    
    Returns:
        List of events, most recent first
    """
    supabase = get_supabase_client()
    
    try:
        # Use "created_at" for ordering if "ts" column doesn't exist
        # Try ordering by id (descending) as fallback
        query = supabase.table("events").select("*")
        
        # Order by id (descending for most recent first)
        query = query.order("id", desc=True)
        
        # Filter by type if specified (using "etype" based on your table structure)
        if event_type:
            query = query.eq("etype", event_type)
        
        # Apply limit
        if limit:
            query = query.limit(limit)
        
        result = query.execute()
        
        # Convert database records to Event models
        events = [_db_dict_to_event(row) for row in result.data]
        return events
    except Exception as e:
        print(f"Error fetching events from Supabase: {e}")
        return []


def get_event_by_id(event_id: str) -> Optional[Event]:
    """
    Get a specific event by its ID from Supabase.
    
    Args:
        event_id: The database ID (integer) or runtimeId of the event
    
    Returns:
        Event if found, None otherwise
    """
    supabase = get_supabase_client()
    
    try:
        # Try to find by database ID first (if event_id is numeric)
        if event_id.isdigit():
            result = supabase.table("events").select("*").eq("id", int(event_id)).limit(1).execute()
            if result.data and len(result.data) > 0:
                return _db_dict_to_event(result.data[0])
        
        # Fallback: try to find by runtime_id if that column exists
        try:
            result = supabase.table("events").select("*").eq("runtime_id", event_id).limit(1).execute()
            if result.data and len(result.data) > 0:
                return _db_dict_to_event(result.data[0])
        except:
            pass  # runtime_id column might not exist
        
        return None
    except Exception as e:
        print(f"Error fetching event from Supabase: {e}")
        return None


def get_blackswan_events(limit: Optional[int] = None) -> List[Event]:
    """Get all blackswan events from Supabase."""
    # BLACKSWAN events might be identified by severity="HIGH" or type="BLACKSWAN"
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("events").select("*")
        
        # Filter by BLACKSWAN type (or high severity as fallback)
        # First try to filter by etype="BLACKSWAN", if no results, try severity="HIGH"
        query = query.eq("etype", "BLACKSWAN")
        
        # Order by id (descending for most recent first)
        query = query.order("id", desc=True)
        
        if limit:
            query = query.limit(limit)
        
        result = query.execute()
        events = [_db_dict_to_event(row) for row in result.data]
        
        # If no BLACKSWAN events found by type, try filtering by HIGH severity
        if not events:
            query2 = supabase.table("events").select("*").eq("severity", "HIGH").order("id", desc=True)
            if limit:
                query2 = query2.limit(limit)
            result2 = query2.execute()
            events = [_db_dict_to_event(row) for row in result2.data]
        
        return events
    except Exception as e:
        print(f"Error fetching blackswan events from Supabase: {e}")
        return []


def get_news_events(limit: Optional[int] = None) -> List[Event]:
    """Get all news events (MACRO and MICRO) from Supabase."""
    supabase = get_supabase_client()
    
    try:
        # Try different column name variations
        query = supabase.table("events").select("*")
        
        # Filter for MACRO and MICRO events (using "etype" based on your table structure)
        query = query.in_("etype", ["MACRO", "MICRO"])
        
        # Order by id (descending for most recent first)
        query = query.order("id", desc=True)
        
        if limit:
            query = query.limit(limit)
        
        result = query.execute()
        events = [_db_dict_to_event(row) for row in result.data]
        return events
    except Exception as e:
        print(f"Error fetching news events from Supabase: {e}")
        return []
