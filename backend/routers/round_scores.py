"""
API routes for round scores.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.models import (
    RoundScore, RoundScoreCreate, RoundScoreResponse,
    RoundScoresListResponse
)
from backend.services import round_score_service

router = APIRouter(prefix="/api/round-scores", tags=["round-scores"])


@router.post("", response_model=RoundScoreResponse, status_code=201)
async def create_round_score(score_data: RoundScoreCreate):
    """
    Create a new round score.
    
    - **participant_id**: The participant ID
    - **round_id**: The round ID
    - **pnl_delta**: Profit/loss delta for the round
    - **reacted**: Whether the participant reacted to an event
    - **reaction_ms**: Reaction time in milliseconds (optional)
    """
    try:
        score = round_score_service.create_round_score(
            participant_id=score_data.participant_id,
            round_id=score_data.round_id,
            pnl_delta=score_data.pnl_delta,
            reacted=score_data.reacted,
            reaction_ms=score_data.reaction_ms
        )
        
        if not score:
            raise HTTPException(status_code=500, detail="Failed to create round score")
        
        return RoundScoreResponse(
            success=True,
            score=score,
            message="Round score created successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating round score: {str(e)}")


@router.get("", response_model=RoundScoresListResponse)
async def get_round_scores(
    round_id: Optional[int] = Query(None, description="Filter by round ID"),
    participant_id: Optional[int] = Query(None, description="Filter by participant ID")
):
    """
    Get round scores with optional filtering.
    
    - **round_id**: Filter by round ID
    - **participant_id**: Filter by participant ID
    """
    try:
        if round_id:
            scores = round_score_service.get_round_scores_by_round(round_id)
        elif participant_id:
            scores = round_score_service.get_round_scores_by_participant(participant_id)
        else:
            raise HTTPException(status_code=400, detail="Must provide either round_id or participant_id")
        
        return RoundScoresListResponse(
            success=True,
            scores=scores,
            count=len(scores)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching round scores: {str(e)}")


@router.get("/{score_id}", response_model=RoundScoreResponse)
async def get_round_score_by_id(score_id: int):
    """
    Get a round score by its ID.
    
    - **score_id**: The round score ID
    """
    score = round_score_service.get_round_score_by_id(score_id)
    if not score:
        raise HTTPException(status_code=404, detail=f"Round score with id '{score_id}' not found")
    
    return RoundScoreResponse(
        success=True,
        score=score,
        message="Round score retrieved successfully"
    )

