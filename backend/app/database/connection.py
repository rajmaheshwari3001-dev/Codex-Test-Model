"""
Database connection helper – SQLite setup for persistent data.

WHY SQLITE?
  It's built into Python, needs no external server, and is perfectly
  adequate for a hackathon prototype where one user at a time queries
  saved-route data.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Optional

from app.config import settings

_connection: Optional[sqlite3.Connection] = None


def get_connection() -> sqlite3.Connection:
    """Return the shared SQLite connection, creating it on first call."""
    global _connection
    if _connection is None:
        db_path = settings.database_url
        _connection = sqlite3.connect(db_path, check_same_thread=False)
        _connection.row_factory = sqlite3.Row
        _connection.execute("PRAGMA journal_mode=WAL")
    return _connection


def close_connection() -> None:
    """Cleanly close the database connection."""
    global _connection
    if _connection:
        _connection.close()
        _connection = None
