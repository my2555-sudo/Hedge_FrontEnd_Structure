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

def _get_or_create_round_id() -> int:
    """
    Resolve a valid round_id to satisfy FK:
    - Try latest round id from public.rounds
    - If none exists, create a default one with id=1
    """
    supabase = get_supabase_client()
    try:
        res = supabase.table("rounds").select("id").order("id", desc=True).limit(1).execute()
        if res.data and len(res.data) > 0 and res.data[0].get("id") is not None:
            return int(res.data[0]["id"])
        # Create a default round if table exists but empty
        try:
            create_res = supabase.table("rounds").insert({"id": 1, "game_id": 1, "round_no": 1}).execute()
            # If created, return 1; if conflict, still use 1
            return 1
        except Exception:
            return 1
    except Exception:
        # If rounds table not accessible, fallback to 1
        return 1
def _map_event_type_for_enum(event_type: str) -> str:
    """
    Map internal event type to DB enum expected values.
    If enum doesn't support BLACK SWAN, fall back to MICRO.
    """
    if event_type == "BLACKSWAN":
        return "MICRO"
    return event_type

def _event_to_db_dict(event: Event, round_id: Optional[int] = None, target_ticker_id: Optional[int] = None) -> dict:
    """
    Convert Event model to database dictionary format.
    Maps to schema defined in database/schema.sql:
    - event_id (text)
    - type (text)
    - title (text)
    - base_impact_pct (numeric)
    - impact_pct (numeric)
    - icon (text)
    - tags (text[])
    - runtime_id (text)
    - ts (bigint)
    - details (text)
    """
    mapped_type = _map_event_type_for_enum(event.type)
    # derive severity for legacy schemas
    impact_abs = abs(float(event.impactPct))
    if event.type == "BLACKSWAN":
        severity = "HIGH"
    elif impact_abs >= 0.02:
        severity = "HIGH"
    elif impact_abs >= 0.01:
        severity = "NORMAL"
    else:
        severity = "LOW"
    db_dict = {
        "event_id": event.id,
        "type": event.type,
        "etype": mapped_type,  # compatibility for older schema (enum limited to MACRO/MICRO)
        "severity": severity,
        "title": event.title,
        "headline": event.title,  # compatibility for older schema
        "base_impact_pct": float(event.baseImpactPct),
        "impulse_pct": float(event.baseImpactPct),  # compatibility for older schema
        "impact_pct": float(event.impactPct),
        "icon": event.icon,
        "tags": event.tags or [],
        "runtime_id": event.runtimeId,
        "ts": int(event.ts),
        "details": event.details or f"{event.title} - Market impact: {event.impactPct * 100:.2f}%",
        "description": event.details or f"{event.title} - Market impact: {event.impactPct * 100:.2f}%",  # compatibility
    }
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
    # Extract event type (prefer 'type' per schema)
    event_type = db_dict.get("type") or db_dict.get("etype") or db_dict.get("event_type") or db_dict.get("type", "MACRO")
    # Extract title
    title = db_dict.get("title") or db_dict.get("headline", "")
    # Extract description/details
    details = db_dict.get("details") or db_dict.get("description")
    # Runtime id
    runtime_id = db_dict.get("runtime_id") or f"event-{db_dict.get('id', 'unknown')}-{int(time.time() * 1000)}"
    # Timestamp
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
    
    # Get impact_pct from database (preferred) or estimate
    impact_pct = db_dict.get("impact_pct")
    if impact_pct is None:
        impact_pct = db_dict.get("base_impact_pct") or 0
    
    # Get base_impact_pct
    base_impact_pct = db_dict.get("base_impact_pct") or db_dict.get("impulse_pct")
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
        # Use latest round id (with safe fallback) to satisfy FK/NOT NULL
        resolved_round_id = _get_or_create_round_id()
        db_dict = _event_to_db_dict(event, round_id=resolved_round_id, target_ticker_id=None)
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
        query = supabase.table("events").select("*")
        
        # Order by id (descending for most recent first)
        query = query.order("id", desc=True)
        
        # Filter by type if specified
        if event_type:
            query = query.eq("type", event_type)
        
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
        
        # Filter by BLACKSWAN type
        query = query.eq("type", "BLACKSWAN")
        
        # Order by id (descending for most recent first)
        query = query.order("id", desc=True)
        
        if limit:
            query = query.limit(limit)
        
        result = query.execute()
        events = [_db_dict_to_event(row) for row in result.data]
        
        return events
    except Exception as e:
        print(f"Error fetching blackswan events from Supabase: {e}")
        return []


def get_news_events(limit: Optional[int] = None) -> List[Event]:
    """Get all news events (MACRO and MICRO) from Supabase."""
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("events").select("*")
        
        # Filter for MACRO and MICRO events
        query = query.in_("type", ["MACRO", "MICRO"])
        
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


def update_event(event_id: str, updates: dict) -> Optional[Event]:
    """
    Update an event row in Supabase by database id or runtime_id.
    'updates' should use API model field names; this function maps to DB columns.
    """
    supabase = get_supabase_client()
    try:
        # Map API fields to DB columns
        field_map = {
            "title": "headline",
            "details": "description",
            "impactPct": "impact_pct",
            "baseImpactPct": "impulse_pct",
            "icon": "icon",
            "tags": "tags",
            "type": "etype",
        }
        db_updates = {}
        for k, v in updates.items():
            if v is None:
                continue
            if k in field_map:
                db_updates[field_map[k]] = v
        if not db_updates:
            return get_event_by_id(event_id)

        # Update by numeric id or by runtime_id
        if event_id.isdigit():
            result = supabase.table("events").update(db_updates).eq("id", int(event_id)).execute()
        else:
            result = supabase.table("events").update(db_updates).eq("runtime_id", event_id).execute()

        if not result.data:
            return None
        return _db_dict_to_event(result.data[0])
    except Exception as e:
        print(f"Error updating event in Supabase: {e}")
        return None


def delete_event(event_id: str) -> bool:
    """
    Delete an event row in Supabase by database id or runtime_id.
    Returns True if a row was deleted.
    """
    supabase = get_supabase_client()
    try:
        if event_id.isdigit():
            result = supabase.table("events").delete().eq("id", int(event_id)).execute()
        else:
            result = supabase.table("events").delete().eq("runtime_id", event_id).execute()
        # Supabase python client returns deleted rows in data
        return bool(result.data)
    except Exception as e:
        print(f"Error deleting event from Supabase: {e}")
        return False
