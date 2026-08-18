"""
AgriSense — SQLite database setup and CRUD helpers.

All functions accept a connection obtained via get_connection().
Tables are created automatically on first import via init_db().
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "agrisense.db"


def get_connection() -> sqlite3.Connection:
    """Return a SQLite connection with row_factory set for dict-like access."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")   # better concurrent read performance
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db(conn=None) -> None:
    """Create all tables if they don\'t already exist."""
    if conn is None:
        conn = get_connection()
    cur = conn.cursor()

    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS farmers (
            id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            name               TEXT    NOT NULL,
            phone              TEXT,
            location           TEXT,
            password_hash      TEXT,
            profile_photo      TEXT,
            is_active          INTEGER NOT NULL DEFAULT 1,
            notification_prefs TEXT    NOT NULL DEFAULT '{"weather": true, "disease": true, "general": true}',
            created_at         TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS crops (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            farmer_id     INTEGER NOT NULL REFERENCES farmers(id),
            crop_type     TEXT    NOT NULL,
            planting_date TEXT,
            farm_size     REAL
        );

        CREATE TABLE IF NOT EXISTS locations (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            farmer_id   INTEGER NOT NULL REFERENCES farmers(id),
            latitude    REAL    NOT NULL,
            longitude   REAL    NOT NULL,
            region_name TEXT
        );

        CREATE TABLE IF NOT EXISTS growth_stages (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            crop_id    INTEGER NOT NULL REFERENCES crops(id),
            stage_name TEXT    NOT NULL,
            start_date TEXT,
            end_date   TEXT
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            farmer_id INTEGER NOT NULL REFERENCES farmers(id),
            message   TEXT    NOT NULL,
            sent_at   TEXT    NOT NULL DEFAULT (datetime('now')),
            type      TEXT
        );
        """
    )

    # Add columns to existing tables if missing (safe ALTER TABLE approach)
    existing = {row[1] for row in cur.execute("PRAGMA table_info(farmers)")}
    for col, defn in [
        ("password_hash",      "TEXT"),
        ("profile_photo",      "TEXT"),
        ("is_active",          "INTEGER NOT NULL DEFAULT 1"),
        ("notification_prefs", "TEXT NOT NULL DEFAULT '{}'"),
    ]:
        if col not in existing:
            cur.execute(f"ALTER TABLE farmers ADD COLUMN {col} {defn}")

    conn.commit()


# ---------------------------------------------------------------------------
# CRUD — Farmers
# ---------------------------------------------------------------------------

def add_farmer(
    conn,
    name: str,
    phone: str = "",
    location: str = "",
    password_hash: str | None = None,
    notification_prefs: str = '{"weather": true, "disease": true, "general": true}'
) -> int:
    """Insert a new farmer and return the new row id."""
    cur = conn.execute(
        "INSERT INTO farmers (name, phone, location, password_hash, notification_prefs) VALUES (?, ?, ?, ?, ?)",
        (name, phone, location, password_hash, notification_prefs),
    )
    conn.commit()
    return cur.lastrowid


def get_all_farmers(conn) -> list[dict]:
    """Return every farmer as a list of dicts."""
    rows = conn.execute("SELECT * FROM farmers ORDER BY id").fetchall()
    return [dict(r) for r in rows]


def get_farmer(conn, farmer_id: int) -> dict | None:
    """Return a single farmer by id, or None."""
    row = conn.execute("SELECT * FROM farmers WHERE id = ?", (farmer_id,)).fetchone()
    return dict(row) if row else None


def get_farmer_by_phone(conn, phone: str) -> dict | None:
    """Return a single farmer by phone number, or None."""
    row = conn.execute("SELECT * FROM farmers WHERE phone = ?", (phone,)).fetchone()
    return dict(row) if row else None


def update_farmer_photo(conn, farmer_id: int, photo_path: str) -> None:
    """Update the profile_photo path for a farmer."""
    conn.execute(
        "UPDATE farmers SET profile_photo = ? WHERE id = ?",
        (photo_path, farmer_id),
    )
    conn.commit()


def update_farmer_password(conn, farmer_id: int, password_hash: str) -> None:
    """Update the password_hash for a farmer."""
    conn.execute(
        "UPDATE farmers SET password_hash = ? WHERE id = ?",
        (password_hash, farmer_id),
    )
    conn.commit()


def deactivate_farmer(conn, farmer_id: int) -> None:
    """Set is_active to 0 (False) for a farmer."""
    conn.execute(
        "UPDATE farmers SET is_active = 0 WHERE id = ?",
        (farmer_id,),
    )
    conn.commit()


def update_farmer_notification_prefs(conn, farmer_id: int, prefs_json: str) -> None:
    """Update notification_prefs JSON string for a farmer."""
    conn.execute(
        "UPDATE farmers SET notification_prefs = ? WHERE id = ?",
        (prefs_json, farmer_id),
    )
    conn.commit()


# ---------------------------------------------------------------------------
# CRUD — Crops
# ---------------------------------------------------------------------------

def add_crop(
    conn,
    farmer_id: int,
    crop_type: str,
    planting_date: str = "",
    farm_size: float | None = None,
) -> int:
    cur = conn.execute(
        "INSERT INTO crops (farmer_id, crop_type, planting_date, farm_size) VALUES (?, ?, ?, ?)",
        (farmer_id, crop_type, planting_date, farm_size),
    )
    conn.commit()
    return cur.lastrowid


def get_crops_for_farmer(conn, farmer_id: int) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM crops WHERE farmer_id = ? ORDER BY id", (farmer_id,)
    ).fetchall()
    return [dict(r) for r in rows]


def update_crop_for_farmer(
    conn,
    farmer_id: int,
    crop_type: str,
    planting_date: str,
    farm_size: float,
) -> None:
    conn.execute(
        """
        UPDATE crops
        SET crop_type = ?, planting_date = ?, farm_size = ?
        WHERE id = (SELECT id FROM crops WHERE farmer_id = ? ORDER BY id LIMIT 1)
        """,
        (crop_type, planting_date, farm_size, farmer_id),
    )
    conn.commit()


# ---------------------------------------------------------------------------
# CRUD — Locations
# ---------------------------------------------------------------------------

def add_location(
    conn,
    farmer_id: int,
    latitude: float,
    longitude: float,
    region_name: str = "",
) -> int:
    cur = conn.execute(
        "INSERT INTO locations (farmer_id, latitude, longitude, region_name) VALUES (?, ?, ?, ?)",
        (farmer_id, latitude, longitude, region_name),
    )
    conn.commit()
    return cur.lastrowid


def get_locations_for_farmer(conn, farmer_id: int) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM locations WHERE farmer_id = ? ORDER BY id", (farmer_id,)
    ).fetchall()
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# CRUD — Growth Stages
# ---------------------------------------------------------------------------

def add_growth_stage(
    conn,
    crop_id: int,
    stage_name: str,
    start_date: str = "",
    end_date: str = "",
) -> int:
    cur = conn.execute(
        "INSERT INTO growth_stages (crop_id, stage_name, start_date, end_date) VALUES (?, ?, ?, ?)",
        (crop_id, stage_name, start_date, end_date),
    )
    conn.commit()
    return cur.lastrowid


def get_growth_stages_for_crop(conn, crop_id: int) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM growth_stages WHERE crop_id = ? ORDER BY id", (crop_id,)
    ).fetchall()
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# CRUD — Notifications
# ---------------------------------------------------------------------------

def add_notification(
    conn,
    farmer_id: int,
    message: str,
    notif_type: str = "info",
) -> int:
    cur = conn.execute(
        "INSERT INTO notifications (farmer_id, message, type) VALUES (?, ?, ?)",
        (farmer_id, message, notif_type),
    )
    conn.commit()
    return cur.lastrowid


def get_notifications_for_farmer(conn, farmer_id: int) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM notifications WHERE farmer_id = ? ORDER BY sent_at DESC",
        (farmer_id,),
    ).fetchall()
    return [dict(r) for r in rows]


# Auto-initialise on import so the DB is always ready.
try:
    init_db()
except Exception as e:
    print(f"Warning: Could not initialize database on import. {e}")
