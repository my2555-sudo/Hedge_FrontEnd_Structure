"""
Service layer for price snapshot operations.
"""
from typing import List, Optional
from datetime import datetime
from backend.models import PriceSnapshot
from backend.database import get_supabase_client


def _db_dict_to_price_snapshot(db_dict: dict) -> PriceSnapshot:
    """Convert database dictionary to PriceSnapshot model."""
    return PriceSnapshot(
        id=db_dict["id"],
        game_id=db_dict["game_id"],
        round_id=db_dict["round_id"],
        ticker_id=db_dict["ticker_id"],
        price=float(db_dict["price"]),
        taken_at=db_dict.get("taken_at")
    )


def create_price_snapshot(
    game_id: int,
    round_id: int,
    ticker_id: int,
    price: float
) -> Optional[PriceSnapshot]:
    """
    Create a single price snapshot.
    
    Args:
        game_id: The game ID
        round_id: The round ID
        ticker_id: The ticker ID
        price: The price at snapshot time
    
    Returns:
        Created PriceSnapshot if successful, None otherwise
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("price_snapshots").insert({
            "game_id": game_id,
            "round_id": round_id,
            "ticker_id": ticker_id,
            "price": price
        }).execute()
        
        if result.data and len(result.data) > 0:
            return _db_dict_to_price_snapshot(result.data[0])
        return None
    except Exception as e:
        print(f"Error creating price snapshot in Supabase: {e}")
        return None


def create_price_snapshots_batch(snapshots: List[dict]) -> List[PriceSnapshot]:
    """
    Create multiple price snapshots in a batch.
    
    Args:
        snapshots: List of dicts with {game_id, round_id, ticker_id, price}
    
    Returns:
        List of created PriceSnapshot objects
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("price_snapshots").insert(snapshots).execute()
        return [_db_dict_to_price_snapshot(row) for row in result.data]
    except Exception as e:
        print(f"Error creating price snapshots batch in Supabase: {e}")
        return []


def get_price_snapshots_by_round(round_id: int) -> List[PriceSnapshot]:
    """Get all price snapshots for a specific round."""
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("price_snapshots").select("*").eq("round_id", round_id).order("taken_at", desc=False).execute()
        return [_db_dict_to_price_snapshot(row) for row in result.data]
    except Exception as e:
        print(f"Error fetching price snapshots by round from Supabase: {e}")
        return []


def get_price_history(ticker_id: int, game_id: int, round_id: Optional[int] = None, limit: Optional[int] = None) -> List[PriceSnapshot]:
    """
    Get price history for a ticker.
    
    Args:
        ticker_id: The ticker ID
        game_id: The game ID
        round_id: Optional round ID to filter by
        limit: Optional limit on number of results
    
    Returns:
        List of PriceSnapshot objects
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("price_snapshots").select("*").eq("ticker_id", ticker_id).eq("game_id", game_id)
        
        if round_id:
            query = query.eq("round_id", round_id)
        
        query = query.order("taken_at", desc=False)
        
        if limit:
            query = query.limit(limit)
        
        result = query.execute()
        return [_db_dict_to_price_snapshot(row) for row in result.data]
    except Exception as e:
        print(f"Error fetching price history from Supabase: {e}")
        return []


def get_price_snapshots_by_game(game_id: int) -> List[PriceSnapshot]:
    """Get all price snapshots for a specific game."""
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("price_snapshots").select("*").eq("game_id", game_id).order("taken_at", desc=False).execute()
        return [_db_dict_to_price_snapshot(row) for row in result.data]
    except Exception as e:
        print(f"Error fetching price snapshots by game from Supabase: {e}")
        return []

