"""
AgriSense — PostgreSQL database setup and CRUD helpers.

All functions accept a connection obtained via get_connection().
Tables are created automatically on first import via init_db().
"""

import os
import time
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    """Return a PostgreSQL connection with DictCursor."""
    attempts = 3
    delay = 1
    for i in range(attempts):
        try:
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.DictCursor)
            return conn
        except psycopg2.OperationalError as e:
            if i < attempts - 1:
                time.sleep(delay)
            else:
                raise e

def init_db(conn=None) -> None:
    """Create all tables if they don't already exist."""
    if conn is None:
        conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS farmers (
            id                 SERIAL PRIMARY KEY,
            name               TEXT    NOT NULL,
            phone              TEXT,
            location           TEXT,
            password_hash      TEXT,
            profile_photo      TEXT,
            is_active          INTEGER NOT NULL DEFAULT 1,
            notification_prefs TEXT    NOT NULL DEFAULT '{"weather": true, "disease": true, "general": true}',
            created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS crops (
            id            SERIAL PRIMARY KEY,
            farmer_id     INTEGER NOT NULL REFERENCES farmers(id),
            crop_type     TEXT    NOT NULL,
            planting_date TEXT,
            farm_size     REAL
        );

        CREATE TABLE IF NOT EXISTS locations (
            id          SERIAL PRIMARY KEY,
            farmer_id   INTEGER NOT NULL REFERENCES farmers(id),
            latitude    REAL    NOT NULL,
            longitude   REAL    NOT NULL,
            region_name TEXT
        );

        CREATE TABLE IF NOT EXISTS growth_stages (
            id         SERIAL PRIMARY KEY,
            crop_id    INTEGER NOT NULL REFERENCES crops(id),
            stage_name TEXT    NOT NULL,
            start_date TEXT,
            end_date   TEXT
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id        SERIAL PRIMARY KEY,
            farmer_id INTEGER NOT NULL REFERENCES farmers(id),
            message   TEXT    NOT NULL,
            sent_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            type      TEXT
        );
        """
    )
    
    # Add columns to existing tables if missing
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='farmers'")
    existing = {row[0] for row in cur.fetchall()}
    
    for col, defn in [
        ("password_hash",      "TEXT"),
        ("profile_photo",      "TEXT"),
        ("is_active",          "INTEGER NOT NULL DEFAULT 1"),
        ("notification_prefs", "TEXT NOT NULL DEFAULT '{}'"),
    ]:
        if col not in existing:
            try:
                cur.execute(f"ALTER TABLE farmers ADD COLUMN {col} {defn}")
            except Exception as e:
                print(f"Skipping alter table: {e}")
                conn.rollback()
            else:
                conn.commit()

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
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO farmers (name, phone, location, password_hash, notification_prefs) VALUES (%s, %s, %s, %s, %s) RETURNING id",
        (name, phone, location, password_hash, notification_prefs),
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    return new_id


def get_all_farmers(conn) -> list[dict]:
    cur = conn.cursor()
    cur.execute("SELECT * FROM farmers ORDER BY id")
    return [dict(r) for r in cur.fetchall()]


def get_farmer(conn, farmer_id: int) -> dict | None:
    cur = conn.cursor()
    cur.execute("SELECT * FROM farmers WHERE id = %s", (farmer_id,))
    row = cur.fetchone()
    return dict(row) if row else None


def get_farmer_by_phone(conn, phone: str) -> dict | None:
    cur = conn.cursor()
    cur.execute("SELECT * FROM farmers WHERE phone = %s", (phone,))
    row = cur.fetchone()
    return dict(row) if row else None


def update_farmer_photo(conn, farmer_id: int, photo_path: str) -> None:
    cur = conn.cursor()
    cur.execute(
        "UPDATE farmers SET profile_photo = %s WHERE id = %s",
        (photo_path, farmer_id),
    )
    conn.commit()


def update_farmer_password(conn, farmer_id: int, password_hash: str) -> None:
    cur = conn.cursor()
    cur.execute(
        "UPDATE farmers SET password_hash = %s WHERE id = %s",
        (password_hash, farmer_id),
    )
    conn.commit()


def deactivate_farmer(conn, farmer_id: int) -> None:
    cur = conn.cursor()
    cur.execute(
        "UPDATE farmers SET is_active = 0 WHERE id = %s",
        (farmer_id,),
    )
    conn.commit()


def update_farmer_notification_prefs(conn, farmer_id: int, prefs_json: str) -> None:
    cur = conn.cursor()
    cur.execute(
        "UPDATE farmers SET notification_prefs = %s WHERE id = %s",
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
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO crops (farmer_id, crop_type, planting_date, farm_size) VALUES (%s, %s, %s, %s) RETURNING id",
        (farmer_id, crop_type, planting_date, farm_size),
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    return new_id


def get_crops_for_farmer(conn, farmer_id: int) -> list[dict]:
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM crops WHERE farmer_id = %s ORDER BY id", (farmer_id,)
    )
    return [dict(r) for r in cur.fetchall()]


def update_crop_for_farmer(
    conn,
    farmer_id: int,
    crop_type: str,
    planting_date: str,
    farm_size: float,
) -> None:
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE crops
        SET crop_type = %s, planting_date = %s, farm_size = %s
        WHERE id = (SELECT id FROM crops WHERE farmer_id = %s ORDER BY id LIMIT 1)
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
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO locations (farmer_id, latitude, longitude, region_name) VALUES (%s, %s, %s, %s) RETURNING id",
        (farmer_id, latitude, longitude, region_name),
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    return new_id


def get_locations_for_farmer(conn, farmer_id: int) -> list[dict]:
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM locations WHERE farmer_id = %s ORDER BY id", (farmer_id,)
    )
    return [dict(r) for r in cur.fetchall()]


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
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO growth_stages (crop_id, stage_name, start_date, end_date) VALUES (%s, %s, %s, %s) RETURNING id",
        (crop_id, stage_name, start_date, end_date),
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    return new_id


def get_growth_stages_for_crop(conn, crop_id: int) -> list[dict]:
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM growth_stages WHERE crop_id = %s ORDER BY id", (crop_id,)
    )
    return [dict(r) for r in cur.fetchall()]


# ---------------------------------------------------------------------------
# CRUD — Notifications
# ---------------------------------------------------------------------------

def add_notification(
    conn,
    farmer_id: int,
    message: str,
    notif_type: str = "info",
) -> int:
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO notifications (farmer_id, message, type) VALUES (%s, %s, %s) RETURNING id",
        (farmer_id, message, notif_type),
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    return new_id


def get_notifications_for_farmer(conn, farmer_id: int) -> list[dict]:
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM notifications WHERE farmer_id = %s ORDER BY sent_at DESC",
        (farmer_id,),
    )
    return [dict(r) for r in cur.fetchall()]


# Auto-initialise on import so the DB is always ready.
try:
    init_db()
except Exception as e:
    print(f"Warning: Could not initialize database on import. {e}")
