import random
import time
from typing import List, Optional
from backend.models import Event, EventType
from backend.database import get_supabase_client

# Event pools - expanded with many more events
MACRO_POOL = [
    {"id": "macro-1", "type": "MACRO", "title": "Fed hikes rates by 25 bps", "baseImpactPct": -0.012, "icon": "🏦", "tags": ["rates", "fed"]},
    {"id": "macro-2", "type": "MACRO", "title": "CPI cools below expectations", "baseImpactPct": 0.015, "icon": "🧾", "tags": ["inflation", "cpi"]},
    {"id": "macro-3", "type": "MACRO", "title": "Oil jumps on OPEC+ cuts", "baseImpactPct": 0.009, "icon": "🛢️", "tags": ["energy", "opec"]},
    {"id": "macro-4", "type": "MACRO", "title": "Unemployment rate drops to 3.5%", "baseImpactPct": 0.011, "icon": "📊", "tags": ["employment", "labor"]},
    {"id": "macro-5", "type": "MACRO", "title": "GDP growth exceeds forecasts", "baseImpactPct": 0.013, "icon": "📈", "tags": ["gdp", "growth"]},
    {"id": "macro-6", "type": "MACRO", "title": "Trade deficit widens unexpectedly", "baseImpactPct": -0.010, "icon": "🌍", "tags": ["trade", "deficit"]},
    {"id": "macro-7", "type": "MACRO", "title": "Housing starts surge 15%", "baseImpactPct": 0.008, "icon": "🏠", "tags": ["housing", "construction"]},
    {"id": "macro-8", "type": "MACRO", "title": "Retail sales decline for third month", "baseImpactPct": -0.009, "icon": "🛒", "tags": ["retail", "consumption"]},
    {"id": "macro-9", "type": "MACRO", "title": "Manufacturing PMI hits 18-month high", "baseImpactPct": 0.012, "icon": "🏭", "tags": ["manufacturing", "pmi"]},
    {"id": "macro-10", "type": "MACRO", "title": "Dollar strengthens against major currencies", "baseImpactPct": -0.007, "icon": "💵", "tags": ["currency", "dollar"]},
    {"id": "macro-11", "type": "MACRO", "title": "Consumer confidence index plummets", "baseImpactPct": -0.011, "icon": "😟", "tags": ["confidence", "consumer"]},
    {"id": "macro-12", "type": "MACRO", "title": "Central bank signals dovish pivot", "baseImpactPct": 0.014, "icon": "🕊️", "tags": ["monetary", "policy"]},
    {"id": "macro-13", "type": "MACRO", "title": "Bond yields spike on inflation fears", "baseImpactPct": -0.013, "icon": "📉", "tags": ["bonds", "yields"]},
    {"id": "macro-14", "type": "MACRO", "title": "Jobless claims hit record low", "baseImpactPct": 0.010, "icon": "✅", "tags": ["employment", "claims"]},
    {"id": "macro-15", "type": "MACRO", "title": "Industrial production falls 2.3%", "baseImpactPct": -0.012, "icon": "⚙️", "tags": ["industrial", "production"]},
]

MICRO_POOL = [
    {"id": "micro-1", "type": "MICRO", "title": "TechCo beats; raises guidance", "baseImpactPct": 0.035, "icon": "💻", "tags": ["earnings", "tech"]},
    {"id": "micro-2", "type": "MICRO", "title": "BioHealth drug fails Phase 3", "baseImpactPct": -0.028, "icon": "🧪", "tags": ["trial", "biotech"]},
    {"id": "micro-3", "type": "MICRO", "title": "AutoCo announces $5B buyback", "baseImpactPct": 0.02, "icon": "🚗", "tags": ["buyback", "auto"]},
    {"id": "micro-4", "type": "MICRO", "title": "RetailGiant misses revenue targets", "baseImpactPct": -0.022, "icon": "🏪", "tags": ["earnings", "retail"]},
    {"id": "micro-5", "type": "MICRO", "title": "EnergyCorp discovers major oil field", "baseImpactPct": 0.025, "icon": "⛽", "tags": ["discovery", "energy"]},
    {"id": "micro-6", "type": "MICRO", "title": "BankInc reports record profits", "baseImpactPct": 0.018, "icon": "🏛️", "tags": ["earnings", "banking"]},
    {"id": "micro-7", "type": "MICRO", "title": "PharmaCo gets FDA approval", "baseImpactPct": 0.030, "icon": "💊", "tags": ["approval", "pharma"]},
    {"id": "micro-8", "type": "MICRO", "title": "Airlines face pilot shortage crisis", "baseImpactPct": -0.015, "icon": "✈️", "tags": ["labor", "airlines"]},
    {"id": "micro-9", "type": "MICRO", "title": "StreamCo adds 10M subscribers", "baseImpactPct": 0.022, "icon": "📺", "tags": ["growth", "media"]},
    {"id": "micro-10", "type": "MICRO", "title": "ChipMaker announces factory expansion", "baseImpactPct": 0.019, "icon": "🔌", "tags": ["expansion", "semiconductors"]},
    {"id": "micro-11", "type": "MICRO", "title": "FoodChain faces supply chain disruption", "baseImpactPct": -0.016, "icon": "🍔", "tags": ["supply", "retail"]},
    {"id": "micro-12", "type": "MICRO", "title": "CloudCo signs $2B enterprise deal", "baseImpactPct": 0.027, "icon": "☁️", "tags": ["contract", "tech"]},
    {"id": "micro-13", "type": "MICRO", "title": "AutoMaker recalls 500K vehicles", "baseImpactPct": -0.024, "icon": "🚙", "tags": ["recall", "auto"]},
    {"id": "micro-14", "type": "MICRO", "title": "SocialMedia launches new ad platform", "baseImpactPct": 0.021, "icon": "📱", "tags": ["product", "tech"]},
    {"id": "micro-15", "type": "MICRO", "title": "ShippingCo reports record losses", "baseImpactPct": -0.020, "icon": "🚢", "tags": ["earnings", "logistics"]},
    {"id": "micro-16", "type": "MICRO", "title": "GamingCo releases blockbuster title", "baseImpactPct": 0.023, "icon": "🎮", "tags": ["product", "gaming"]},
    {"id": "micro-17", "type": "MICRO", "title": "MiningCorp faces environmental lawsuit", "baseImpactPct": -0.017, "icon": "⛏️", "tags": ["legal", "mining"]},
    {"id": "micro-18", "type": "MICRO", "title": "EVMaker doubles production capacity", "baseImpactPct": 0.026, "icon": "🔋", "tags": ["expansion", "ev"]},
]

BLACKSWAN_POOL = [
    {"id": "bs-1", "type": "BLACKSWAN", "title": "Flash Crash: Liquidity Vacuum", "baseImpactPct": -0.12, "icon": "⚠️", "details": "Severe market dislocation detected. Liquidity has evaporated across major exchanges."},
    {"id": "bs-2", "type": "BLACKSWAN", "title": "Geopolitical Shock: Sanctions Escalation", "baseImpactPct": -0.08, "icon": "🛑", "details": "Major geopolitical event triggers widespread market uncertainty."},
    {"id": "bs-3", "type": "BLACKSWAN", "title": "Exchange Outage: Price Discovery Stalls", "baseImpactPct": -0.06, "icon": "🧯", "details": "Critical exchange infrastructure failure disrupts trading operations."},
    {"id": "bs-4", "type": "BLACKSWAN", "title": "Cyber Attack: Major Bank Breach", "baseImpactPct": -0.10, "icon": "💻", "details": "Sophisticated cyber attack compromises major financial institution's systems."},
    {"id": "bs-5", "type": "BLACKSWAN", "title": "Natural Disaster: Supply Chain Collapse", "baseImpactPct": -0.09, "icon": "🌊", "details": "Catastrophic natural disaster disrupts global supply chains."},
    {"id": "bs-6", "type": "BLACKSWAN", "title": "Regulatory Bombshell: Industry Shakeup", "baseImpactPct": -0.11, "icon": "📜", "details": "Unexpected regulatory changes threaten entire industry sectors."},
    {"id": "bs-7", "type": "BLACKSWAN", "title": "Currency Crisis: Emerging Market Crash", "baseImpactPct": -0.07, "icon": "💸", "details": "Major emerging market currency collapses, triggering global contagion."},
    {"id": "bs-8", "type": "BLACKSWAN", "title": "Commodity Shock: Resource Shortage", "baseImpactPct": -0.085, "icon": "⚡", "details": "Critical resource shortage creates widespread economic disruption."},
]

_seq_counter = 0
_bs_seq_counter = 0

# Track recently used events to avoid repetition
_recently_used_events = []  # List of event IDs used in the last N events
_MAX_RECENT_TRACK = 10  # Track last 10 events to avoid repetition


def _get_recently_used_event_ids(limit: int = 20) -> set:
    """
    Get recently used event IDs from the database to avoid repetition.
    Returns a set of event template IDs (like 'macro-1', 'micro-2') that were recently used.
    """
    supabase = get_supabase_client()
    try:
        # Get recent events from database (last 20 events)
        result = supabase.table("events").select("headline").order("id", desc=True).limit(limit).execute()
        
        # Extract event IDs by matching headlines to our pools
        recent_ids = set()
        for row in result.data:
            headline = row.get("headline", "")
            # Match headline to find the event ID from our pools
            for event in MACRO_POOL + MICRO_POOL + BLACKSWAN_POOL:
                if event["title"] == headline:
                    recent_ids.add(event["id"])
                    break
        return recent_ids
    except Exception as e:
        print(f"Error fetching recent events: {e}")
        return set()


def _pick_random(arr: List[dict], avoid_recent: bool = True) -> dict:
    """
    Pick a random item from a list, avoiding recently used events.
    
    Args:
        arr: List of event dictionaries
        avoid_recent: If True, avoid events that were recently used
    
    Returns:
        Random event dictionary
    """
    if not arr:
        raise ValueError("Cannot pick from empty array")
    
    if not avoid_recent or len(arr) <= 1:
        return random.choice(arr)
    
    # Get recently used event IDs
    recent_ids = _get_recently_used_event_ids()
    
    # Filter out recently used events
    available = [e for e in arr if e["id"] not in recent_ids]
    
    # If all events were recently used, use the full pool anyway (to avoid infinite loop)
    if not available:
        available = arr
    
    return random.choice(available)

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
    Maps to the ACTUAL Supabase schema:
    - id (auto-generated)
    - round_id (int8)
    - etype (event_type enum: MACRO, MICRO)
    - severity (event_severity enum)
    - headline (text)
    - description (text)
    - target_ticker_id (int8, nullable)
    - impulse_pct (numeric) - base impact percentage
    - impact_pct (numeric) - actual impact with jitter
    - created_at (auto-generated)
    """
    # Map event type to etype (BLACKSWAN -> MICRO for enum compatibility)
    mapped_type = _map_event_type_for_enum(event.type)
    
    # Calculate severity based on impact
    impact_abs = abs(float(event.impactPct))
    if event.type == "BLACKSWAN":
        severity = "HIGH"
    elif impact_abs >= 0.02:
        severity = "HIGH"
    elif impact_abs >= 0.01:
        severity = "NORMAL"
    else:
        severity = "LOW"
    
    # Build dictionary matching actual schema
    db_dict = {
        "etype": mapped_type,
        "severity": severity,
        "headline": event.title,
        "description": event.details or f"{event.title} - Market impact: {event.impactPct * 100:.2f}%",
        "impulse_pct": float(event.baseImpactPct),
        "impact_pct": float(event.impactPct),
    }
    
    # Add optional fields if provided
    if round_id is not None:
        db_dict["round_id"] = round_id
    if target_ticker_id is not None:
        db_dict["target_ticker_id"] = target_ticker_id
    
    return db_dict


def _db_dict_to_event(db_dict: dict) -> Event:
    """
    Convert database dictionary to Event model.
    Maps from ACTUAL Supabase table structure to Event model.
    """
    # Extract event type from etype (actual column name)
    event_type = db_dict.get("etype") or db_dict.get("type", "MACRO")
    # If stored as MICRO but severity is HIGH, it might be a BLACKSWAN
    if event_type == "MICRO" and db_dict.get("severity") == "HIGH" and abs(float(db_dict.get("impact_pct", 0))) > 0.05:
        event_type = "BLACKSWAN"
    
    # Extract title from headline (actual column name)
    title = db_dict.get("headline") or db_dict.get("title", "")
    # Extract description/details
    details = db_dict.get("description") or db_dict.get("details")
    
    # Generate runtime id from database id and timestamp
    db_id = db_dict.get("id", "unknown")
    runtime_id = f"event-{db_id}-{int(time.time() * 1000)}"
    
    # Timestamp from created_at
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
    
    # Get impact_pct from database
    impact_pct = db_dict.get("impact_pct", 0)
    
    # Get base_impact_pct from impulse_pct (actual column name)
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
        icon="📰",  # Default icon (not stored in actual schema)
        tags=[],  # Tags not stored in actual schema
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
        # Generate blackswan event (avoid recent ones)
        base = _pick_random(BLACKSWAN_POOL, avoid_recent=True)
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
        
        # Pick random event avoiding recently used ones
        base = _pick_random(pool, avoid_recent=True)
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
        # Use latest round id (with safe fallback) to satisfy FK/NOT NULL if round_id is required
        resolved_round_id = _get_or_create_round_id()
        db_dict = _event_to_db_dict(event, round_id=resolved_round_id, target_ticker_id=None)
        result = supabase.table("events").insert(db_dict).execute()
        if not result.data:
            print(f"Warning: Event inserted but no data returned: {runtime_id}")
        else:
            print(f"Successfully stored event: {runtime_id} (id: {result.data[0].get('id', 'unknown')})")
    except Exception as e:
        print(f"Error storing event in Supabase: {e}")
        print(f"Event data that failed to insert: {db_dict}")
        import traceback
        traceback.print_exc()
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
        
        # Filter by type if specified (use etype column)
        if event_type:
            # Map BLACKSWAN to MICRO for query (since BLACKSWAN is stored as MICRO in etype)
            mapped_type = _map_event_type_for_enum(event_type)
            query = query.eq("etype", mapped_type)
            # If looking for BLACKSWAN, also filter by severity
            if event_type == "BLACKSWAN":
                query = query.eq("severity", "HIGH")
        
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
    # BLACKSWAN events are stored as etype="MICRO" with severity="HIGH"
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("events").select("*")
        
        # Filter by HIGH severity (BLACKSWAN events are stored as MICRO with HIGH severity)
        query = query.eq("etype", "MICRO").eq("severity", "HIGH")
        
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
        
        # Filter for MACRO and MICRO events (use etype column)
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
