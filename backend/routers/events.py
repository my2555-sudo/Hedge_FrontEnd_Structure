from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.models import Event, EventCreate, EventResponse, EventsListResponse, EventType
from backend.services import event_service

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

