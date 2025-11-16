from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.models import Event, EventCreate, EventResponse, EventsListResponse, EventType, EventUpdate
from backend.services import event_service
from backend.database import get_supabase_client
import os
import random

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("", response_model=EventsListResponse)
async def get_events(
    limit: Optional[int] = Query(None, ge=1, le=1000, description="Maximum number of events to return"),
    type: Optional[EventType] = Query(None, description="Filter by event type (MACRO, MICRO, BLACKSWAN)")
):
    """
    Get all events with optional filtering.
    
    - **limit**: Maximum number of events to return (default: all)
    - **type**: Filter by event type (MACRO, MICRO, or BLACKSWAN)
    
    Returns the most recent events first.
    """
    events = event_service.get_all_events(limit=limit, event_type=type)
    return EventsListResponse(
        success=True,
        events=events,
        count=len(events)
    )


@router.get("/{event_id}", response_model=EventResponse)
async def get_event_by_id(event_id: str):
    """
    Get a specific event by its runtimeId.
    
    - **event_id**: The runtimeId of the event to retrieve
    """
    event = event_service.get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event with id '{event_id}' not found")
    
    return EventResponse(
        success=True,
        event=event,
        message="Event retrieved successfully"
    )


@router.post("", response_model=EventResponse, status_code=201)
async def create_event(event_data: EventCreate):
    """
    Generate and create a new event.
    
    - **type**: Optional event type (MACRO or MICRO). If not provided, randomly selects between MACRO and MICRO.
    - **forceBlackSwan**: If True, generates a blackswan event instead
    
    The generated event will have:
    - A unique runtimeId
    - Current timestamp
    - Calculated impactPct with random jitter
    """
    try:
        event_type = None
        force_blackswan = False
        
        if event_data.forceBlackSwan:
            force_blackswan = True
        elif event_data.type:
            event_type = event_data.type
        
        event = event_service.generate_event(event_type=event_type, force_blackswan=force_blackswan)
        
        return EventResponse(
            success=True,
            event=event,
            message="Event generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating event: {str(e)}")


@router.get("/blackswan", response_model=EventsListResponse)
async def get_blackswan_events(
    limit: Optional[int] = Query(None, ge=1, le=1000, description="Maximum number of events to return")
):
    """
    Get all blackswan events.
    
    - **limit**: Maximum number of events to return (default: all)
    
    Returns blackswan events sorted by timestamp (most recent first).
    """
    events = event_service.get_blackswan_events(limit=limit)
    return EventsListResponse(
        success=True,
        events=events,
        count=len(events)
    )

@router.put("/{event_id}", response_model=EventResponse)
async def update_event(event_id: str, update: EventUpdate):
    """
    Update an existing event by database ID or runtime_id.
    Only provided fields will be updated.
    """
    updated = event_service.update_event(event_id, update.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail=f"Event with id '{event_id}' not found or not updated")
    return EventResponse(success=True, event=updated, message="Event updated successfully")


@router.delete("/{event_id}", response_model=EventResponse)
async def delete_event(event_id: str):
    """
    Delete an event by database ID or runtime_id.
    """
    ok = event_service.delete_event(event_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Event with id '{event_id}' not found")
    return EventResponse(success=True, event=None, message="Event deleted successfully")

@router.get("/_debug/meta")
async def debug_events_meta():
    """
    Debug endpoint: returns Supabase project info and events table stats seen by the backend.
    """
    supabase = get_supabase_client()
    supabase_url = os.getenv("SUPABASE_URL", "")
    project_ref = ""
    try:
        # Extract project ref from URL like https://<ref>.supabase.co
        host = supabase_url.split("://", 1)[-1]
        project_ref = host.split(".", 1)[0]
    except Exception:
        project_ref = ""
    try:
        count_result = supabase.table("events").select("id", count="exact").limit(1).execute()
        row_count = count_result.count or 0
    except Exception as e:
        row_count = -1
    try:
        sample = supabase.table("events").select("*").order("id", desc=True).limit(3).execute().data
    except Exception:
        sample = []
    return {
        "supabase_url": supabase_url,
        "project_ref": project_ref,
        "row_count": row_count,
        "sample": sample,
    }

@router.post("/_debug/insert-once")
async def debug_insert_once():
    """
    Debug endpoint: directly inserts a minimal row into public.events using legacy columns.
    Returns Supabase response or error message.
    """
    supabase = get_supabase_client()
    import time
    try:
        # Resolve a valid round_id (latest or create default)
        try:
            rid_res = supabase.table("rounds").select("id").order("id", desc=True).limit(1).execute()
            if rid_res.data and len(rid_res.data) > 0 and rid_res.data[0].get("id") is not None:
                round_id = int(rid_res.data[0]["id"])
            else:
                try:
                    supabase.table("rounds").insert({"id": 1, "game_id": 1, "round_no": 1}).execute()
                except Exception:
                    pass
                round_id = 1
        except Exception:
            round_id = 1

        # Use only MACRO/MICRO for enum compatibility; set severity explicitly
        etype = random.choice(["MACRO", "MICRO"])
        payload = {
            "headline": "Debug Insert Headline",
            "description": "Inserted via _debug/insert-once",
            "etype": etype,
            "severity": "HIGH",
            "impulse_pct": 0.01,
            "impact_pct": 0.0123,
            "round_id": round_id,
            "target_ticker_id": None,
        }
        result = supabase.table("events").insert(payload).execute()
        return {"ok": True, "data": result.data}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@router.get("/news", response_model=EventsListResponse)
async def get_news_events(
    limit: Optional[int] = Query(None, ge=1, le=1000, description="Maximum number of events to return")
):
    """
    Get all news events (MACRO and MICRO events).
    
    - **limit**: Maximum number of events to return (default: all)
    
    Returns news events sorted by timestamp (most recent first).
    """
    events = event_service.get_news_events(limit=limit)
    return EventsListResponse(
        success=True,
        events=events,
        count=len(events)
    )

