"""
API routes for tickers.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.models import Ticker, TickerCreate, TickerResponse, TickersListResponse
from backend.services import ticker_service

router = APIRouter(prefix="/api/tickers", tags=["tickers"])


@router.get("", response_model=TickersListResponse)
async def get_tickers():
    """
    Get all tickers.
    
    Returns all tickers sorted by symbol.
    """
    tickers = ticker_service.get_all_tickers()
    return TickersListResponse(
        success=True,
        tickers=tickers,
        count=len(tickers)
    )


@router.get("/{ticker_id}", response_model=TickerResponse)
async def get_ticker_by_id(ticker_id: int):
    """
    Get a ticker by its ID.
    
    - **ticker_id**: The ticker ID
    """
    ticker = ticker_service.get_ticker_by_id(ticker_id)
    if not ticker:
        raise HTTPException(status_code=404, detail=f"Ticker with id '{ticker_id}' not found")
    
    return TickerResponse(
        success=True,
        ticker=ticker,
        message="Ticker retrieved successfully"
    )


@router.get("/symbol/{symbol}", response_model=TickerResponse)
async def get_ticker_by_symbol(symbol: str):
    """
    Get a ticker by its symbol.
    
    - **symbol**: The ticker symbol (e.g., "AAPL")
    """
    ticker = ticker_service.get_ticker_by_symbol(symbol)
    if not ticker:
        raise HTTPException(status_code=404, detail=f"Ticker with symbol '{symbol}' not found")
    
    return TickerResponse(
        success=True,
        ticker=ticker,
        message="Ticker retrieved successfully"
    )


@router.post("", response_model=TickerResponse, status_code=201)
async def create_ticker(ticker_data: TickerCreate):
    """
    Create a new ticker.
    
    - **symbol**: The ticker symbol (e.g., "AAPL")
    - **name**: The company name
    - **sector**: The sector
    """
    try:
        # Check if ticker already exists
        existing = ticker_service.get_ticker_by_symbol(ticker_data.symbol)
        if existing:
            raise HTTPException(status_code=400, detail=f"Ticker with symbol '{ticker_data.symbol}' already exists")
        
        ticker = ticker_service.create_ticker(
            symbol=ticker_data.symbol,
            name=ticker_data.name,
            sector=ticker_data.sector
        )
        
        if not ticker:
            raise HTTPException(status_code=500, detail="Failed to create ticker")
        
        return TickerResponse(
            success=True,
            ticker=ticker,
            message="Ticker created successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating ticker: {str(e)}")

