"""
Database initialisation – creates tables if they don't exist.

Safe to call multiple times (uses CREATE TABLE IF NOT EXISTS).
"""

from __future__ import annotations

from app.database.connection import get_connection


def init_database() -> None:
    """Create all tables needed by Aaroh-Saarthi V1."""
    conn = get_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS saved_routes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            label       TEXT NOT NULL,
            origin_stop_id      TEXT NOT NULL,
            origin_stop_name    TEXT NOT NULL,
            destination_stop_id TEXT NOT NULL,
            destination_stop_name TEXT NOT NULL,
            preferred_departure_time TEXT DEFAULT '',
            preference  TEXT DEFAULT 'fastest',
            created_at  TEXT DEFAULT (datetime('now'))
        )
    """)
    columns = {
        row["name"] for row in conn.execute("PRAGMA table_info(saved_routes)")
    }
    if "service_day" not in columns:
        conn.execute(
            "ALTER TABLE saved_routes "
            "ADD COLUMN service_day TEXT NOT NULL DEFAULT 'weekday'"
        )
    conn.commit()
