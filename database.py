"""
AgriSense — PostgreSQL database setup and CRUD helpers.

All functions use a shared module-level connection obtained via get_connection().
Tables are created automatically on first import.
"""

import os
import time
import psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    """Return a fresh PostgreSQL connection with DictCursor factory enabled.

    Retries up to 3 times on OperationalError (e.g. Neon cold-start SSL EOF)
    with a 1-second back-off between attempts before finally re-raising.
    """
    _MAX_ATTEMPTS = 3
    _RETRY_DELAY_S = 1

    url = os.environ.get("DATABASE_URL", "postgresql://localhost/agrisense")
    last_exc = None
    for attempt in range(1, _MAX_ATTEMPTS + 1):
        try:
            conn = psycopg2.connect(url, cursor_factory=DictCursor)
            return conn
        except psycopg2.OperationalError as exc:
            last_exc = exc
            if attempt < _MAX_ATTEMPTS:
                print(
                    f"[db] Connection attempt {attempt}/{_MAX_ATTEMPTS} failed "
                    f"({exc!r}). Retrying in {_RETRY_DELAY_S}s…"
                )
                time.sleep(_RETRY_DELAY_S)
    raise last_exc


def init_db(conn=None) -> None:
    """Create all tables if they don't already exist."""
    if conn is None:
        conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS farmers (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT,
                location TEXT,
                password_hash TEXT,
                profile_photo TEXT,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                notification_prefs TEXT NOT NULL DEFAULT '{"weather": true, "disease": true, "general": true}',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS crops (
                id SERIAL PRIMARY KEY,
                farmer_id INTEGER NOT NULL REFERENCES farmers(id),
                crop_type TEXT NOT NULL,
                planting_date TEXT,
                farm_size REAL
            );

            CREATE TABLE IF NOT EXISTS locations (
                id SERIAL PRIMARY KEY,
                farmer_id INTEGER NOT NULL REFERENCES farmers(id),
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                region_name TEXT
            );

            CREATE TABLE IF NOT EXISTS growth_stages (
                id SERIAL PRIMARY KEY,
                crop_id INTEGER NOT NULL REFERENCES crops(id),
                stage_name TEXT NOT NULL,
                start_date TEXT,
                end_date TEXT
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                farmer_id INTEGER NOT NULL REFERENCES farmers(id),
                message TEXT NOT NULL,
                sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                type TEXT
            );
            """
        )

        # Add columns to existing tables if missing
        cur.execute("ALTER TABLE farmers ADD COLUMN IF NOT EXISTS password_hash TEXT;")
        cur.execute("ALTER TABLE farmers ADD COLUMN IF NOT EXISTS profile_photo TEXT;")
        cur.execute("ALTER TABLE farmers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;")
        cur.execute("ALTER TABLE farmers ADD COLUMN IF NOT EXISTS notification_prefs TEXT NOT NULL DEFAULT '{\"weather\": true, \"disease\": true, \"general\": true}';")
        
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
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO farmers (name, phone, location, password_hash, notification_prefs) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (name, phone, location, password_hash, notification_prefs),
        )
        farmer_id = cur.fetchone()['id']
    conn.commit()
    return farmer_id


def get_all_farmers(conn) -> list[dict]:
    """Return every farmer as a list of dicts."""
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM farmers ORDER BY id")
        return [dict(r) for r in cur.fetchall()]


def get_farmer(conn, farmer_id: int) -> dict | None:
    """Return a single farmer by id, or None."""
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM farmers WHERE id = %s", (farmer_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def get_farmer_by_phone(conn, phone: str) -> dict | None:
    """Return a single farmer by phone number, or None."""
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM farmers WHERE phone = %s", (phone,))
        row = cur.fetchone()
        return dict(row) if row else None


def update_farmer_photo(conn, farmer_id: int, photo_path: str) -> None:
    """Update the profile_photo path for a farmer."""
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE farmers SET profile_photo = %s WHERE id = %s",
            (photo_path, farmer_id),
        )
    conn.commit()


def update_farmer_password(conn, farmer_id: int, password_hash: str) -> None:
    """Update the password_hash for a farmer."""
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE farmers SET password_hash = %s WHERE id = %s",
            (password_hash, farmer_id),
        )
    conn.commit()


def deactivate_farmer(conn, farmer_id: int) -> None:
    """Set is_active to FALSE for a farmer."""
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE farmers SET is_active = FALSE WHERE id = %s",
            (farmer_id,),
        )
    conn.commit()


def update_farmer_notification_prefs(conn, farmer_id: int, prefs_json: str) -> None:
    """Update notification_prefs JSON string for a farmer."""
    with conn.cursor() as cur:
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
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO crops (farmer_id, crop_type, planting_date, farm_size) VALUES (%s, %s, %s, %s) RETURNING id",
            (farmer_id, crop_type, planting_date, farm_size),
        )
        crop_id = cur.fetchone()['id']
    conn.commit()
    return crop_id


def get_crops_for_farmer(conn, farmer_id: int) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM crops WHERE farmer_id = %s ORDER BY id", (farmer_id,)
        )
        return [dict(r) for r in cur.fetchall()]


def update_crop_for_farmer(
    conn,
    farmer_id: int,
    crop_type: str,
    planting_date: str,
    farm_size: float
) -> None:
    with conn.cursor() as cur:
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
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO locations (farmer_id, latitude, longitude, region_name) VALUES (%s, %s, %s, %s) RETURNING id",
            (farmer_id, latitude, longitude, region_name),
        )
        loc_id = cur.fetchone()['id']
    conn.commit()
    return loc_id


def get_locations_for_farmer(conn, farmer_id: int) -> list[dict]:
    with conn.cursor() as cur:
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
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO growth_stages (crop_id, stage_name, start_date, end_date) VALUES (%s, %s, %s, %s) RETURNING id",
            (crop_id, stage_name, start_date, end_date),
        )
        stage_id = cur.fetchone()['id']
    conn.commit()
    return stage_id


def get_growth_stages_for_crop(conn, crop_id: int) -> list[dict]:
    with conn.cursor() as cur:
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
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO notifications (farmer_id, message, type) VALUES (%s, %s, %s) RETURNING id",
            (farmer_id, message, notif_type),
        )
        notif_id = cur.fetchone()['id']
    conn.commit()
    return notif_id


def get_notifications_for_farmer(conn, farmer_id: int) -> list[dict]:
    with conn.cursor() as cur:
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
