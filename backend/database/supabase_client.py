"""
Supabase client configuration and initialization.
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_KEY "
        "in your .env file or environment variables."
    )

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_supabase_client() -> Client:
    """Get the Supabase client instance."""
    return supabase


def test_connection() -> bool:
    """Test the Supabase connection."""
    try:
        # Try a simple query to test connection
        result = supabase.table("events").select("id").limit(1).execute()
        return True
    except Exception as e:
        print(f"Supabase connection test failed: {e}")
        # Try to get more details about the error
        try:
            # Try to see if table exists by checking structure
            result = supabase.table("events").select("id, etype, headline").limit(1).execute()
            return True
        except Exception as e2:
            print(f"Detailed connection test failed: {e2}")
            return False

