"""
Service layer for game and round operations.
"""
from typing import Optional
from datetime import datetime
from backend.models import Game, Round
from backend.database import get_supabase_client


def _db_dict_to_game(db_dict: dict) -> Game:
    """Convert database dictionary to Game model."""
    return Game(
        id=db_dict["id"],
        code=db_dict.get("code"),
        starting_cash=float(db_dict["starting_cash"]),
        status=db_dict["status"],
        created_at=db_dict.get("created_at")
    )


def _db_dict_to_round(db_dict: dict) -> Round:
    """Convert database dictionary to Round model."""
    return Round(
        id=db_dict["id"],
        game_id=db_dict["game_id"],
        round_no=db_dict["round_no"],
        starts_at=db_dict.get("starts_at"),
        ends_at=db_dict.get("ends_at")
    )


def create_or_get_game(code: Optional[str] = None, starting_cash: float = 10000, status: str = "active") -> Game:
    """
    Create a new game or get existing game by code.
    If code is provided and game exists, return existing game.
    Otherwise, create a new game.
    
    Args:
        code: Optional game code (for multiplayer games)
        starting_cash: Starting cash amount
        status: Game status
    
    Returns:
        Game object
    """
    supabase = get_supabase_client()
    
    try:
        # If code provided, try to find existing game
        if code:
            result = supabase.table("games").select("*").eq("code", code).eq("status", "active").limit(1).execute()
            if result.data and len(result.data) > 0:
                return _db_dict_to_game(result.data[0])
        
        # Create new game
        result = supabase.table("games").insert({
            "code": code,
            "starting_cash": starting_cash,
            "status": status
        }).execute()
        
        if result.data and len(result.data) > 0:
            return _db_dict_to_game(result.data[0])
        
        raise Exception("Failed to create game")
    except Exception as e:
        print(f"Error creating/getting game in Supabase: {e}")
        raise


def get_game_by_id(game_id: int) -> Optional[Game]:
    """Get a game by its ID."""
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("games").select("*").eq("id", game_id).limit(1).execute()
        if result.data and len(result.data) > 0:
            return _db_dict_to_game(result.data[0])
        return None
    except Exception as e:
        print(f"Error fetching game by ID from Supabase: {e}")
        return None


def create_or_get_round(game_id: int, round_no: int) -> Round:
    """
    Create a new round or get existing round for the game and round number.
    
    Args:
        game_id: The game ID
        round_no: The round number (1, 2, 3...)
    
    Returns:
        Round object
    """
    supabase = get_supabase_client()
    
    try:
        # Try to find existing round
        result = supabase.table("rounds").select("*").eq("game_id", game_id).eq("round_no", round_no).limit(1).execute()
        if result.data and len(result.data) > 0:
            return _db_dict_to_round(result.data[0])
        
        # Create new round
        result = supabase.table("rounds").insert({
            "game_id": game_id,
            "round_no": round_no,
            "starts_at": datetime.utcnow().isoformat()
        }).execute()
        
        if result.data and len(result.data) > 0:
            return _db_dict_to_round(result.data[0])
        
        raise Exception("Failed to create round")
    except Exception as e:
        print(f"Error creating/getting round in Supabase: {e}")
        raise


def get_round_by_id(round_id: int) -> Optional[Round]:
    """Get a round by its ID."""
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("rounds").select("*").eq("id", round_id).limit(1).execute()
        if result.data and len(result.data) > 0:
            return _db_dict_to_round(result.data[0])
        return None
    except Exception as e:
        print(f"Error fetching round by ID from Supabase: {e}")
        return None


def end_round(round_id: int) -> Optional[Round]:
    """Mark a round as ended by setting ends_at timestamp."""
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("rounds").update({
            "ends_at": datetime.utcnow().isoformat()
        }).eq("id", round_id).execute()
        
        if result.data and len(result.data) > 0:
            return _db_dict_to_round(result.data[0])
        return None
    except Exception as e:
        print(f"Error ending round in Supabase: {e}")
        return None

