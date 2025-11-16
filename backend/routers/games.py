"""
API routes for games and rounds.
"""
from fastapi import APIRouter, HTTPException
from backend.models import Game, GameCreate, GameResponse, Round, RoundCreate, RoundResponse
from backend.services import game_service

router = APIRouter(prefix="/api/games", tags=["games"])


@router.post("", response_model=GameResponse, status_code=201)
async def create_or_get_game(game_data: GameCreate):
    """
    Create a new game or get existing game by code.
    
    - **code**: Optional game code (for multiplayer games)
    - **starting_cash**: Starting cash amount (default: 10000)
    - **status**: Game status (default: "active")
    """
    try:
        game = game_service.create_or_get_game(
            code=game_data.code,
            starting_cash=game_data.starting_cash,
            status=game_data.status
        )
        
        return GameResponse(
            success=True,
            game=game,
            message="Game created or retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating/getting game: {str(e)}")


@router.get("/{game_id}", response_model=GameResponse)
async def get_game_by_id(game_id: int):
    """
    Get a game by its ID.
    
    - **game_id**: The game ID
    """
    game = game_service.get_game_by_id(game_id)
    if not game:
        raise HTTPException(status_code=404, detail=f"Game with id '{game_id}' not found")
    
    return GameResponse(
        success=True,
        game=game,
        message="Game retrieved successfully"
    )


@router.post("/rounds", response_model=RoundResponse, status_code=201)
async def create_or_get_round(round_data: RoundCreate):
    """
    Create a new round or get existing round for the game and round number.
    
    - **game_id**: The game ID
    - **round_no**: The round number (1, 2, 3...)
    """
    try:
        round_obj = game_service.create_or_get_round(
            game_id=round_data.game_id,
            round_no=round_data.round_no
        )
        
        return RoundResponse(
            success=True,
            round=round_obj,
            message="Round created or retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating/getting round: {str(e)}")


@router.get("/rounds/{round_id}", response_model=RoundResponse)
async def get_round_by_id(round_id: int):
    """
    Get a round by its ID.
    
    - **round_id**: The round ID
    """
    round_obj = game_service.get_round_by_id(round_id)
    if not round_obj:
        raise HTTPException(status_code=404, detail=f"Round with id '{round_id}' not found")
    
    return RoundResponse(
        success=True,
        round=round_obj,
        message="Round retrieved successfully"
    )


@router.put("/rounds/{round_id}/end", response_model=RoundResponse)
async def end_round(round_id: int):
    """
    Mark a round as ended by setting ends_at timestamp.
    
    - **round_id**: The round ID
    """
    round_obj = game_service.end_round(round_id)
    if not round_obj:
        raise HTTPException(status_code=404, detail=f"Round with id '{round_id}' not found")
    
    return RoundResponse(
        success=True,
        round=round_obj,
        message="Round ended successfully"
    )

