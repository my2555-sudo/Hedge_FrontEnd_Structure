"""
Service layer for round score operations.
"""
from typing import List, Optional
from backend.models import RoundScore
from backend.database import get_supabase_client


def _db_dict_to_round_score(db_dict: dict) -> RoundScore:
    """Convert database dictionary to RoundScore model."""
    return RoundScore(
        id=db_dict["id"],
        participant_id=db_dict["participant_id"],
        round_id=db_dict["round_id"],
        pnl_delta=float(db_dict["pnl_delta"]),
        reacted=db_dict["reacted"],
        reaction_ms=db_dict.get("reaction_ms"),
        created_at=db_dict.get("created_at")
    )


def create_round_score(
    participant_id: int,
    round_id: int,
    pnl_delta: float,
    reacted: bool,
    reaction_ms: Optional[int] = None
) -> Optional[RoundScore]:
    """
    Create a new round score.
    
    Args:
        participant_id: The participant ID
        round_id: The round ID
        pnl_delta: Profit/loss delta for the round
        reacted: Whether the participant reacted to an event
        reaction_ms: Reaction time in milliseconds (optional)
    
    Returns:
        Created RoundScore if successful, None otherwise
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("round_scores").insert({
            "participant_id": participant_id,
            "round_id": round_id,
            "pnl_delta": pnl_delta,
            "reacted": reacted,
            "reaction_ms": reaction_ms
        }).execute()
        
        if result.data and len(result.data) > 0:
            return _db_dict_to_round_score(result.data[0])
        return None
    except Exception as e:
        print(f"Error creating round score in Supabase: {e}")
        return None


def get_round_scores_by_round(round_id: int) -> List[RoundScore]:
    """Get all round scores for a specific round."""
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("round_scores").select("*").eq("round_id", round_id).order("pnl_delta", desc=True).execute()
        return [_db_dict_to_round_score(row) for row in result.data]
    except Exception as e:
        print(f"Error fetching round scores by round from Supabase: {e}")
        return []


def get_round_scores_by_participant(participant_id: int) -> List[RoundScore]:
    """Get all round scores for a specific participant."""
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("round_scores").select("*").eq("participant_id", participant_id).order("round_id", desc=False).execute()
        return [_db_dict_to_round_score(row) for row in result.data]
    except Exception as e:
        print(f"Error fetching round scores by participant from Supabase: {e}")
        return []


def get_round_score_by_id(score_id: int) -> Optional[RoundScore]:
    """Get a round score by its ID."""
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("round_scores").select("*").eq("id", score_id).limit(1).execute()
        if result.data and len(result.data) > 0:
            return _db_dict_to_round_score(result.data[0])
        return None
    except Exception as e:
        print(f"Error fetching round score by ID from Supabase: {e}")
        return None

