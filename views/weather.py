"""
Weather data fetcher for the FastAPI backend.
"""

import requests

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
API_URL = "https://api.open-meteo.com/v1/forecast"

# ---------------------------------------------------------------------------
# Fetcher
# ---------------------------------------------------------------------------
def fetch_weather(lat: float, lon: float) -> dict:
    """
    Fetch daily + current weather from Open-Meteo.
    (Caching removed since this runs inside FastAPI async routes)
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max",
            "precipitation_sum",
            "weathercode",
            "windspeed_10m_max",
        ],
        "current_weather": True,
        "timezone": "auto",
        "forecast_days": 5,
    }
    resp = requests.get(API_URL, params=params, timeout=10)
    resp.raise_for_status()
    return resp.json()

# ---------------------------------------------------------------------------
# Interpretation helpers
# ---------------------------------------------------------------------------
def _get_warnings(tmax: float, tmin: float, rain_prob: float, code: int) -> list[tuple[str, str]]:
    """
    Return a list of (level, message) warning tuples.
    level is one of: 'error', 'warning', 'info'
    """
    warnings = []
    if tmax >= 42:
        warnings.append(("error", f"Extreme heat alert — high of {tmax:.0f} °C expected. Avoid fieldwork midday and keep livestock cool."))
    elif tmax >= 36:
        warnings.append(("warning", f"Heat advisory — {tmax:.0f} °C expected. Water crops in the early morning or evening."))

    if tmin <= 0:
        warnings.append(("error", f"Frost risk tonight — low of {tmin:.0f} °C. Cover sensitive seedlings and check irrigation pipes."))
    elif tmin <= 4:
        warnings.append(("warning", f"Near-frost tonight — low of {tmin:.0f} °C. Watch tender crops."))

    if code in (65, 82, 95, 96, 99) or rain_prob >= 80:
        warnings.append(("error", "Heavy rain expected — risk of waterlogging and runoff. Ensure drainage channels are clear."))
    elif code in (61, 63, 80, 81) or rain_prob >= 50:
        warnings.append(("warning", "Rain likely — good for soil moisture but delay any fertilizer or pesticide application."))

    return warnings
