"""
API routes for price snapshots.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.models import (
    PriceSnapshot, PriceSnapshotCreate, PriceSnapshotBatchCreate,
    PriceSnapshotResponse, PriceSnapshotsListResponse
)
from backend.services import price_snapshot_service

router = APIRouter(prefix="/api/price-snapshots", tags=["price-snapshots"])


@router.post("", response_model=PriceSnapshotResponse, status_code=201)
async def create_price_snapshot(snapshot_data: PriceSnapshotCreate):
    """
    Create a single price snapshot.
    
    - **game_id**: The game ID
    - **round_id**: The round ID
    - **ticker_id**: The ticker ID
    - **price**: The price at snapshot time
    """
    try:
        snapshot = price_snapshot_service.create_price_snapshot(
            game_id=snapshot_data.game_id,
            round_id=snapshot_data.round_id,
            ticker_id=snapshot_data.ticker_id,
            price=snapshot_data.price
        )
        
        if not snapshot:
            raise HTTPException(status_code=500, detail="Failed to create price snapshot")
        
        return PriceSnapshotResponse(
            success=True,
            snapshot=snapshot,
            message="Price snapshot created successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating price snapshot: {str(e)}")


@router.post("/batch", response_model=PriceSnapshotsListResponse, status_code=201)
async def create_price_snapshots_batch(batch_data: PriceSnapshotBatchCreate):
    """
    Create multiple price snapshots in a batch.
    
    - **snapshots**: Array of {game_id, round_id, ticker_id, price}
    """
    try:
        snapshots_dict = [snapshot.dict() for snapshot in batch_data.snapshots]
        snapshots = price_snapshot_service.create_price_snapshots_batch(snapshots_dict)
        
        return PriceSnapshotsListResponse(
            success=True,
            snapshots=snapshots,
            count=len(snapshots)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating price snapshots batch: {str(e)}")


@router.get("", response_model=PriceSnapshotsListResponse)
async def get_price_snapshots(
    game_id: Optional[int] = Query(None, description="Filter by game ID"),
    round_id: Optional[int] = Query(None, description="Filter by round ID"),
    ticker_id: Optional[int] = Query(None, description="Filter by ticker ID"),
    limit: Optional[int] = Query(None, ge=1, le=1000, description="Maximum number of snapshots to return")
):
    """
    Get price snapshots with optional filtering.
    
    - **game_id**: Filter by game ID
    - **round_id**: Filter by round ID
    - **ticker_id**: Filter by ticker ID (requires game_id)
    - **limit**: Maximum number of snapshots to return
    """
    try:
        if ticker_id and game_id:
            snapshots = price_snapshot_service.get_price_history(
                ticker_id=ticker_id,
                game_id=game_id,
                round_id=round_id,
                limit=limit
            )
        elif round_id:
            snapshots = price_snapshot_service.get_price_snapshots_by_round(round_id)
        elif game_id:
            snapshots = price_snapshot_service.get_price_snapshots_by_game(game_id)
        else:
            raise HTTPException(status_code=400, detail="Must provide at least game_id or round_id")
        
        return PriceSnapshotsListResponse(
            success=True,
            snapshots=snapshots,
            count=len(snapshots)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching price snapshots: {str(e)}")

