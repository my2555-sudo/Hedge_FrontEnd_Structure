"""
Service layer for ticker operations.
"""
from typing import List, Optional
from backend.models import Ticker
from backend.database import get_supabase_client


def _db_dict_to_ticker(db_dict: dict) -> Ticker:
    """Convert database dictionary to Ticker model."""
    return Ticker(
        id=db_dict["id"],
        symbol=db_dict["symbol"],
        name=db_dict["name"],
        sector=db_dict["sector"],
        created_at=db_dict.get("created_at")
    )


def get_all_tickers() -> List[Ticker]:
    """
    Get all tickers from Supabase.
    
    Returns:
        List of Ticker objects
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("tickers").select("*").order("symbol", desc=False).execute()
        return [_db_dict_to_ticker(row) for row in result.data]
    except Exception as e:
        print(f"Error fetching tickers from Supabase: {e}")
        return []


def get_ticker_by_id(ticker_id: int) -> Optional[Ticker]:
    """
    Get a ticker by its ID.
    
    Args:
        ticker_id: The ticker ID
    
    Returns:
        Ticker if found, None otherwise
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("tickers").select("*").eq("id", ticker_id).limit(1).execute()
        if result.data and len(result.data) > 0:
            return _db_dict_to_ticker(result.data[0])
        return None
    except Exception as e:
        print(f"Error fetching ticker by ID from Supabase: {e}")
        return None


def get_ticker_by_symbol(symbol: str) -> Optional[Ticker]:
    """
    Get a ticker by its symbol.
    
    Args:
        symbol: The ticker symbol (e.g., "AAPL")
    
    Returns:
        Ticker if found, None otherwise
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("tickers").select("*").eq("symbol", symbol.upper()).limit(1).execute()
        if result.data and len(result.data) > 0:
            return _db_dict_to_ticker(result.data[0])
        return None
    except Exception as e:
        print(f"Error fetching ticker by symbol from Supabase: {e}")
        return None


def create_ticker(symbol: str, name: str, sector: str) -> Optional[Ticker]:
    """
    Create a new ticker.
    
    Args:
        symbol: The ticker symbol
        name: The company name
        sector: The sector
    
    Returns:
        Created Ticker if successful, None otherwise
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("tickers").insert({
            "symbol": symbol.upper(),
            "name": name,
            "sector": sector
        }).execute()
        
        if result.data and len(result.data) > 0:
            return _db_dict_to_ticker(result.data[0])
        return None
    except Exception as e:
        print(f"Error creating ticker in Supabase: {e}")
        return None

