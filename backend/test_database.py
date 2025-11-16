"""
Test script to verify database connection and data operations.
Run this script to test if Supabase connection is working correctly.
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Check if environment variables are set
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print("=" * 60)
print("Database Connection Test")
print("=" * 60)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: Missing environment variables!")
    print("Please create a .env file in the backend directory with:")
    print("  SUPABASE_URL=your_supabase_url")
    print("  SUPABASE_KEY=your_supabase_key")
    sys.exit(1)

print(f"✅ SUPABASE_URL: {SUPABASE_URL[:30]}...")
print(f"✅ SUPABASE_KEY: {'*' * 20}...{SUPABASE_KEY[-10:]}")
print()

# Test connection
print("Testing database connection...")
try:
    from backend.database import get_supabase_client, test_connection
    
    if test_connection():
        print("✅ Database connection: SUCCESS")
    else:
        print("❌ Database connection: FAILED")
        sys.exit(1)
except Exception as e:
    print(f"❌ Connection error: {e}")
    sys.exit(1)

print()

# Test tickers table
print("Testing tickers table...")
try:
    from backend.services.ticker_service import get_all_tickers, create_ticker, get_ticker_by_symbol
    
    # Get all tickers
    tickers = get_all_tickers()
    print(f"✅ Found {len(tickers)} tickers in database")
    
    if len(tickers) > 0:
        print(f"   Sample: {tickers[0].symbol} - {tickers[0].name}")
    else:
        print("   ⚠️  No tickers found. Creating sample ticker...")
        # Create a test ticker
        test_ticker = create_ticker("AAPL", "Apple Inc.", "Tech")
        if test_ticker:
            print(f"   ✅ Created test ticker: {test_ticker.symbol}")
        else:
            print("   ❌ Failed to create test ticker")
    
    # Test get by symbol
    aapl = get_ticker_by_symbol("AAPL")
    if aapl:
        print(f"✅ Get by symbol works: {aapl.symbol} - {aapl.name}")
    else:
        print("   ⚠️  AAPL not found (this is OK if you haven't created it)")
    
except Exception as e:
    print(f"❌ Tickers test error: {e}")
    import traceback
    traceback.print_exc()

print()

# Test games table
print("Testing games table...")
try:
    from backend.services.game_service import create_or_get_game, get_game_by_id
    
    # Create or get a test game
    test_game = create_or_get_game(starting_cash=10000, status="active")
    print(f"✅ Game created/retrieved: ID={test_game.id}, Status={test_game.status}")
    
    # Get game by ID
    retrieved_game = get_game_by_id(test_game.id)
    if retrieved_game:
        print(f"✅ Get game by ID works: ID={retrieved_game.id}")
    else:
        print("❌ Failed to retrieve game by ID")
    
except Exception as e:
    print(f"❌ Games test error: {e}")
    import traceback
    traceback.print_exc()

print()

# Test round_scores table
print("Testing round_scores table...")
try:
    from backend.services.round_score_service import create_round_score
    
    # This requires a valid participant_id and round_id
    # We'll just test if the function exists and can be called
    print("✅ Round scores service imported successfully")
    print("   (Full test requires valid participant_id and round_id)")
    
except Exception as e:
    print(f"❌ Round scores test error: {e}")

print()

# Test price_snapshots table
print("Testing price_snapshots table...")
try:
    from backend.services.price_snapshot_service import create_price_snapshot
    
    # This requires valid game_id, round_id, and ticker_id
    print("✅ Price snapshots service imported successfully")
    print("   (Full test requires valid game_id, round_id, and ticker_id)")
    
except Exception as e:
    print(f"❌ Price snapshots test error: {e}")

print()
print("=" * 60)
print("Test Summary")
print("=" * 60)
print("✅ If you see all green checkmarks above, your database is connected!")
print("⚠️  If you see errors, check:")
print("   1. Your .env file has correct SUPABASE_URL and SUPABASE_KEY")
print("   2. Your Supabase tables exist (tickers, games, rounds, round_scores, price_snapshots)")
print("   3. Your RLS policies allow API access")
print("=" * 60)

