from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import bcrypt
import requests
import re
from datetime import datetime, date
from pathlib import Path
from PIL import Image
import io

from database import (
    get_connection,
    add_farmer,
    add_crop,
    add_location,
    get_farmer_by_phone,
    get_farmer,
    get_locations_for_farmer,
    get_crops_for_farmer,
    get_notifications_for_farmer,
    add_notification,
    update_farmer_photo,
    update_crop_for_farmer,
    update_farmer_password
)

from views.weather import fetch_weather, _get_warnings
from views.crop_calendar import calculate_crop_stage
from views.disease_detection import load_model, run_prediction, CLASS_INFO
from views.yield_prediction import load_yield_model

app = FastAPI(title="AgriSense API")

# ---------------------------------------------------------------------------
# Disease-detection model singleton — lazy-loaded on first request, then
# reused for every subsequent call. Avoids loading the model at boot time
# (which can exhaust memory on constrained hosts before any request arrives).
# ---------------------------------------------------------------------------
_disease_model = None

def _get_disease_model():
    """Return the cached YOLOv8 model, loading from disk on the very first call."""
    global _disease_model
    if _disease_model is None:
        from views.disease_detection import MODEL_PATH
        from ultralytics import YOLO
        import logging
        logging.getLogger("ultralytics").setLevel(logging.WARNING)
        _disease_model = YOLO(str(MODEL_PATH))
    return _disease_model

# Allow CORS for local dev (React, etc)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Static file serving — uploaded profile photos
# ---------------------------------------------------------------------------
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
PROFILE_PHOTOS_DIR = UPLOADS_DIR / "profile_photos"
PROFILE_PHOTOS_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

def clean_disease_label(raw_label: str) -> str:
    if raw_label in CLASS_INFO:
        return CLASS_INFO[raw_label][0]
    import re
    clean = re.sub(r"^.+?___", "", raw_label)
    clean = clean.replace("_", " ")
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean.title()

import json

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    name: str
    phone: str
    location: str
    crop_type: str
    password: str
    planting_date: str = ""
    farm_size: float = 0.0

class LoginRequest(BaseModel):
    phone: str
    password: str

class YieldPredictionRequest(BaseModel):
    crop_type: str
    rainfall: float
    pesticides: float
    avg_temp: float

class CropUpdateRequest(BaseModel):
    crop_type: str
    planting_date: str
    farm_size: float

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class NotificationPrefsRequest(BaseModel):
    weather: bool
    disease: bool
    general: bool

# ---------------------------------------------------------------------------
# Helpers for notification preference checking
# ---------------------------------------------------------------------------
def should_send_notification(conn, farmer_id: int, category: str) -> bool:
    """Helper to check if a farmer has enabled notifications for a specific category."""
    farmer = get_farmer(conn, farmer_id)
    if not farmer:
        return False
    prefs_str = farmer.get("notification_prefs")
    if not prefs_str:
        return True # Default to True if column is empty
    try:
        prefs = json.loads(prefs_str)
        return prefs.get(category, True)
    except Exception:
        return True

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/auth/register")
def register(req: RegisterRequest):
    conn = get_connection()
    
    # Check location via Nominatim (reusing logic pattern from onboarding)
    search_query = (
        f"{req.location.strip()}, Pakistan"
        if "pakistan" not in req.location.strip().lower()
        else req.location.strip()
    )
    headers = {
        "User-Agent": "AgriSenseAPI/1.0 (contact@agrisense.org)",
        "Accept-Language": "en",
    }
    params = {"q": search_query, "format": "json"}
    
    try:
        res = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params=params,
            headers=headers,
            timeout=10,
        )
        geo_data = res.json() if res.status_code == 200 else []
    except Exception:
        geo_data = []

    if not geo_data or not isinstance(geo_data, list) or len(geo_data) == 0:
        raise HTTPException(status_code=400, detail="Could not find location coordinates.")

    lat = float(geo_data[0]["lat"])
    lon = float(geo_data[0]["lon"])
    display_name = geo_data[0].get("display_name", "").lower()

    typed_words = [
        w.lower() for w in re.findall(r"\w+", req.location) if w.lower() != "pakistan"
    ]
    name_matched = any(w in display_name for w in typed_words)
    country_part = display_name.split(",")[-1].strip()
    
    if not name_matched or country_part != "pakistan":
        raise HTTPException(status_code=400, detail="Location not found in Pakistan.")

    pwd_hash = bcrypt.hashpw(req.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    
    farmer_id = add_farmer(conn, req.name.strip(), req.phone.strip(), req.location.strip(), password_hash=pwd_hash)
    add_crop(conn, farmer_id, req.crop_type.strip(), req.planting_date, req.farm_size)
    add_location(conn, farmer_id, lat, lon, req.location.strip())
    
    # Log registration notification (general update category)
    if should_send_notification(conn, farmer_id, "general"):
        add_notification(
            conn,
            farmer_id,
            f"Welcome to AgriSense, {req.name.strip()}! Your {req.crop_type.strip()} crop has been registered.",
            "info"
        )
    
    return {"farmer_id": farmer_id, "message": "Registered successfully"}


@app.post("/auth/login")
def login(req: LoginRequest):
    conn = get_connection()
    farmer = get_farmer_by_phone(conn, req.phone)
    if not farmer or not farmer.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    
    # Reject login if the account is deactivated
    if not farmer.get("is_active", 1):
        raise HTTPException(status_code=403, detail="This account has been deactivated.")
        
    if bcrypt.checkpw(req.password.encode("utf-8"), farmer["password_hash"].encode("utf-8")):
        return {"farmer_id": farmer["id"], "farmer_name": farmer["name"]}
    else:
        raise HTTPException(status_code=401, detail="Invalid phone number or password")


@app.get("/farmer/{farmer_id}")
def get_farmer_profile(farmer_id: int):
    conn = get_connection()
    farmer = get_farmer(conn, farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    # Remove password hash from response
    farmer.pop("password_hash", None)
    return farmer


@app.post("/farmer/{farmer_id}/change-password")
def change_password(farmer_id: int, req: ChangePasswordRequest):
    conn = get_connection()
    farmer = get_farmer(conn, farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    stored_hash = farmer.get("password_hash")
    if not stored_hash or not bcrypt.checkpw(req.current_password.encode("utf-8"), stored_hash.encode("utf-8")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    new_hash = bcrypt.hashpw(req.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    update_farmer_password(conn, farmer_id, new_hash)
    return {"message": "Password updated successfully"}


@app.post("/farmer/{farmer_id}/photo")
async def upload_profile_photo(farmer_id: int, file: UploadFile = File(...)):
    conn = get_connection()
    farmer = get_farmer(conn, farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Always save as JPEG so filename, on-disk file, and static URL all agree.
    timestamp = int(datetime.utcnow().timestamp() * 1000)
    filename = f"{farmer_id}_{timestamp}.jpg"
    save_path = PROFILE_PHOTOS_DIR / filename

    print(f"[photo upload] saving to: {save_path.resolve()}")
    print(f"[photo upload] static dir: {UPLOADS_DIR.resolve()}")

    contents = await file.read()
    try:
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        img.save(str(save_path), "JPEG", quality=85)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {exc}")

    if not save_path.exists():
        raise HTTPException(status_code=500, detail="File was not saved to disk")

    relative_path = f"uploads/profile_photos/{filename}"
    update_farmer_photo(conn, farmer_id, relative_path)
    return {"profile_photo": relative_path}


@app.post("/farmer/{farmer_id}/deactivate")
def deactivate_farmer_endpoint(farmer_id: int):
    from database import deactivate_farmer
    conn = get_connection()
    farmer = get_farmer(conn, farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    deactivate_farmer(conn, farmer_id)
    return {"message": "Account deactivated successfully"}


@app.patch("/farmer/{farmer_id}/notification-prefs")
def update_notification_prefs_endpoint(farmer_id: int, req: NotificationPrefsRequest):
    from database import update_farmer_notification_prefs
    conn = get_connection()
    farmer = get_farmer(conn, farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    prefs_str = json.dumps({
        "weather": req.weather,
        "disease": req.disease,
        "general": req.general
    })
    update_farmer_notification_prefs(conn, farmer_id, prefs_str)
    return {"message": "Notification preferences updated successfully"}


@app.get("/weather/{farmer_id}")
def get_weather(farmer_id: int):
    conn = get_connection()
    locations = get_locations_for_farmer(conn, farmer_id)
    if not locations:
        raise HTTPException(status_code=404, detail="Location not found for farmer")
    
    loc = locations[0]
    try:
        data = fetch_weather(loc["latitude"], loc["longitude"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather: {e}")
        
    cw = data.get("current_weather", {})
    daily = data.get("daily", {})
    
    tmax = daily.get("temperature_2m_max", [None])[0]
    tmin = daily.get("temperature_2m_min", [None])[0]
    rain_prob = daily.get("precipitation_probability_max", [None])[0]
    code = cw.get("weathercode", 0)
    
    warnings = []
    if tmax is not None and tmin is not None and rain_prob is not None:
        raw_warnings = _get_warnings(tmax, tmin, rain_prob, code)
        warnings = [{"level": w[0], "message": w[1]} for w in raw_warnings]
        
        # Log weather warnings if they aren't duplicate and weather alerts are enabled
        if should_send_notification(conn, farmer_id, "weather"):
            for w in warnings:
                already_sent = conn.execute(
                        "SELECT 1 FROM notifications WHERE farmer_id = ? AND message = ? AND type = 'warning' AND sent_at > datetime('now', '-4 hours') LIMIT 1",
                        (farmer_id, w["message"])
                    ).fetchone()
                if not already_sent:
                    add_notification(conn, farmer_id, w["message"], "warning")
        
    return {
        "current_weather": cw,
        "daily_forecast": daily,
        "warnings": warnings
    }


@app.get("/crop-calendar/{farmer_id}")
def get_crop_calendar(farmer_id: int):
    conn = get_connection()
    crops = get_crops_for_farmer(conn, farmer_id)
    if not crops:
        return {"crops": []}
        
    today = date.today()
    results = []
    
    for crop in crops:
        p_date_str = crop["planting_date"]
        if not p_date_str:
            continue
            
        try:
            planting_date = datetime.strptime(p_date_str, "%Y-%m-%d").date()
        except ValueError:
            continue
            
        days_since_planting = (today - planting_date).days
        stage_info = calculate_crop_stage(crop["crop_type"], days_since_planting)
        
        results.append({
            "crop_id": crop["id"],
            "crop_type": crop["crop_type"],
            "planting_date": p_date_str,
            "days_since_planting": days_since_planting,
            "stage_info": stage_info,
            "farm_size": crop["farm_size"]
        })
        
    return {"crops": results}

@app.patch("/farmer/{farmer_id}/crop")
def update_crop(farmer_id: int, req: CropUpdateRequest):
    conn = get_connection()
    farmer = get_farmer(conn, farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
        
    update_crop_for_farmer(conn, farmer_id, req.crop_type, req.planting_date, req.farm_size)
    return {"message": "Crop updated successfully"}


@app.post("/disease-detection")
async def detect_disease(farmer_id: int | None = None, file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Only images are allowed")

    # Read the upload bytes in async context (non-blocking).
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Resize to YOLOv8's standard input size before inference to reduce peak
    # memory during the forward pass. Keeps the aspect ratio intact.
    MAX_DIM = 640
    if image.width > MAX_DIM or image.height > MAX_DIM:
        image.thumbnail((MAX_DIM, MAX_DIM), Image.LANCZOS)

    # Model inference is CPU-bound; offload to a thread-pool so the event
    # loop stays free for other requests (e.g. GET /farmer/{id}).
    from starlette.concurrency import run_in_threadpool

    def _run_inference():
        return run_prediction(_get_disease_model(), image)

    class_name, confidence = await run_in_threadpool(_run_inference)

    if farmer_id is not None:
        conn = get_connection()
        # Log disease alerts if enabled
        if should_send_notification(conn, farmer_id, "disease"):
            friendly_name = clean_disease_label(class_name)
            is_healthy = "healthy" in class_name.lower()

            if is_healthy:
                msg = "Leaf scan complete: no disease detected"
                notif_type = "info"
            else:
                confidence_pct = int(confidence * 100) if confidence <= 1.0 else int(confidence)
                msg = f"Disease detected: {friendly_name} ({confidence_pct}% confidence)"
                notif_type = "warning"

            add_notification(conn, farmer_id, msg, notif_type)

    return {
        "class_name": class_name,
        "confidence": confidence
    }


@app.post("/yield-prediction")
def predict_yield(req: YieldPredictionRequest):
    crop_encoded = 0 if req.crop_type.strip().lower() == "wheat" else 1
    area_encoded = 72
    year = 2026
    
    features = [[
        crop_encoded,
        area_encoded,
        year,
        req.rainfall,
        req.pesticides,
        req.avg_temp
    ]]
    
    model = load_yield_model()
    raw_yield_hg_ha = model.predict(features)[0]
    yield_kg_ha = raw_yield_hg_ha * 0.1
    
    return {
        "yield_kg_ha": yield_kg_ha
    }



@app.get("/notifications/{farmer_id}")
def get_notifications(farmer_id: int):
    conn = get_connection()
    notifications = get_notifications_for_farmer(conn, farmer_id)
    return {"notifications": notifications}

@app.get("/health")
def health_check():
    return {"status": "ok"}
