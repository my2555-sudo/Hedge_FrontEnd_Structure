#!/usr/bin/env python3
"""
Run script for the FastAPI backend server.

Usage:
    # From project root:
    python backend/run.py
    # OR (after making executable):
    ./backend/run.py
    
    # Or using uvicorn directly:
    uvicorn backend.main:app --reload --port 8000
"""
import sys
import os

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[project_root]
    )

