"""
Weather page — live weather + 5-day forecast via Open-Meteo (no API key needed).

Data is cached per (lat, lon) pair for 30 minutes so page interactions
don't trigger repeated network requests.
"""

import math
from datetime import datetime, timedelta

import requests
import streamlit as st

from database import get_connection, get_all_farmers, get_locations_for_farmer

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
API_URL = "https://api.open-meteo.com/v1/forecast"

CACHE_TTL_SECONDS = 1800  # 30 minutes

DAY_LABELS = ["Today", "Tomorrow", "Day 3", "Day 4", "Day 5"]

WEATHER_CODE_MAP = {
    0: ("Clear sky", "☀️"),
    1: ("Mostly clear", "🌤️"),
    2: ("Partly cloudy", "⛅"),
    3: ("Overcast", "☁️"),
    45: ("Foggy", "🌫️"),
    48: ("Icy fog", "🌫️"),
    51: ("Light drizzle", "🌦️"),
    53: ("Drizzle", "🌦️"),
    55: ("Heavy drizzle", "🌧️"),
    61: ("Light rain", "🌧️"),
    63: ("Rain", "🌧️"),
    65: ("Heavy rain", "🌧️"),
    71: ("Light snow", "🌨️"),
    73: ("Snow", "❄️"),
    75: ("Heavy snow", "❄️"),
    77: ("Snow grains", "🌨️"),
    80: ("Rain showers", "🌦️"),
    81: ("Heavy showers", "🌧️"),
    82: ("Violent showers", "⛈️"),
    85: ("Snow showers", "🌨️"),
    86: ("Heavy snow showers", "❄️"),
    95: ("Thunderstorm", "⛈️"),
    96: ("Thunderstorm w/ hail", "⛈️"),
    99: ("Severe thunderstorm", "⛈️"),
}


# ---------------------------------------------------------------------------
# Caching helper
# ---------------------------------------------------------------------------
@st.cache_data(ttl=CACHE_TTL_SECONDS, show_spinner="Fetching weather data...")
def fetch_weather(lat: float, lon: float) -> dict:
    """
    Fetch daily + current weather from Open-Meteo.
    Cached for CACHE_TTL_SECONDS seconds per (lat, lon) pair.
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
def _code_to_label(code: int) -> tuple[str, str]:
    """Return (description, emoji) for a WMO weather code."""
    return WEATHER_CODE_MAP.get(code, ("Unknown", "🌡️"))


def _temp_plain(temp_c: float) -> str:
    return f"{temp_c:.0f} °C"


def _rain_plain(prob: float) -> str:
    if prob >= 80:
        return f"Very likely to rain ({prob:.0f}% chance)"
    elif prob >= 50:
        return f"Possible rain ({prob:.0f}% chance)"
    elif prob >= 20:
        return f"Small chance of rain ({prob:.0f}%)"
    else:
        return "Dry — unlikely to rain"


def _wind_plain(speed_kmh: float) -> str:
    if speed_kmh >= 62:
        return f"Very strong winds ({speed_kmh:.0f} km/h) — secure crops"
    elif speed_kmh >= 40:
        return f"Strong winds ({speed_kmh:.0f} km/h)"
    elif speed_kmh >= 20:
        return f"Moderate winds ({speed_kmh:.0f} km/h)"
    else:
        return f"Light winds ({speed_kmh:.0f} km/h)"


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


def _day_label(date_str: str, idx: int) -> str:
    """Human-friendly day label: Today / Tomorrow / Weekday name."""
    if idx == 0:
        return "Today"
    if idx == 1:
        return "Tomorrow"
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%A, %d %b")
    except ValueError:
        return date_str


# ---------------------------------------------------------------------------
# Main render
# ---------------------------------------------------------------------------
def render():
    st.header("🌤️ Weather Dashboard")

    conn = get_connection()
    selected_id = st.session_state.get("farmer_id")
    if not selected_id:
        st.error("You must be logged in to view weather data.")
        return

    st.success(f"Showing data for {st.session_state.get('farmer_name')}")

    locations = get_locations_for_farmer(conn, selected_id)
    if not locations:
        st.warning(
            "This farmer has no GPS location saved. "
            "Go to **Farmer Onboarding**, register a location, then come back here."
        )
        return

    loc = locations[0]  # Use the primary (first) location
    lat, lon = loc["latitude"], loc["longitude"]
    region = loc["region_name"] or f"{lat:.4f}, {lon:.4f}"

    st.caption(f"Showing weather for **{region}** (lat {lat:.4f}, lon {lon:.4f})")

    # ---- Fetch (cached) ----
    try:
        data = fetch_weather(round(lat, 4), round(lon, 4))
    except requests.RequestException as exc:
        st.error(f"Could not reach the weather service. Please check your internet connection.\n\n_({exc})_")
        return

    current = data.get("current_weather", {})
    daily = data.get("daily", {})

    current_temp = current.get("temperature", None)
    current_code = int(current.get("weathercode", 0))
    current_desc, current_emoji = _code_to_label(current_code)
    current_wind = current.get("windspeed", 0)

    dates = daily.get("time", [])
    tmax_list = daily.get("temperature_2m_max", [])
    tmin_list = daily.get("temperature_2m_min", [])
    rain_prob_list = daily.get("precipitation_probability_max", [])
    rain_sum_list = daily.get("precipitation_sum", [])
    codes = daily.get("weathercode", [])
    wind_list = daily.get("windspeed_10m_max", [])

    # ---- Current conditions ----
    st.subheader("Current Conditions")
    c1, c2, c3 = st.columns(3)
    c1.metric(
        "Temperature",
        f"{current_temp:.0f} °C" if current_temp is not None else "—",
        help="Measured at 2 metres above ground",
    )
    c2.metric("Conditions", f"{current_emoji} {current_desc}")
    c3.metric("Wind Speed", f"{current_wind:.0f} km/h", help=_wind_plain(current_wind))

    st.markdown("---")

    # ---- Active warnings ----
    if dates:
        today_tmax = tmax_list[0] if tmax_list else 0
        today_tmin = tmin_list[0] if tmin_list else 20
        today_rain = rain_prob_list[0] if rain_prob_list else 0
        today_code = int(codes[0]) if codes else 0

        warnings = _get_warnings(today_tmax, today_tmin, today_rain, today_code)
        if warnings:
            st.subheader("⚠️ Alerts for Today")
            for level, msg in warnings:
                if level == "error":
                    st.error(msg)
                elif level == "warning":
                    st.warning(msg)
                else:
                    st.info(msg)
        else:
            st.success("No weather alerts today — conditions look safe for fieldwork.")

    st.markdown("---")

    # ---- 5-day forecast ----
    st.subheader("5-Day Forecast")

    cols = st.columns(min(5, len(dates)))
    for i, col in enumerate(cols):
        if i >= len(dates):
            break
        date_str = dates[i]
        tmax = tmax_list[i] if i < len(tmax_list) else None
        tmin = tmin_list[i] if i < len(tmin_list) else None
        rain_prob = rain_prob_list[i] if i < len(rain_prob_list) else 0
        rain_sum = rain_sum_list[i] if i < len(rain_sum_list) else 0
        code = int(codes[i]) if i < len(codes) else 0
        wind = wind_list[i] if i < len(wind_list) else 0
        desc, emoji = _code_to_label(code)
        day_warn = _get_warnings(tmax or 0, tmin or 20, rain_prob or 0, code)

        with col:
            st.markdown(f"**{_day_label(date_str, i)}**")
            st.markdown(f"### {emoji}")
            st.caption(desc)
            if tmax is not None and tmin is not None:
                st.markdown(f"🌡️ **{tmax:.0f} °C** / {tmin:.0f} °C")
            if rain_prob is not None:
                rain_bar = int(rain_prob / 10)
                st.markdown(f"🌧️ {rain_prob:.0f}% rain")
                if rain_sum:
                    st.caption(f"~{rain_sum:.1f} mm expected")
            st.caption(_wind_plain(wind))

            if day_warn:
                st.markdown("⚠️ " + day_warn[0][1][:60] + "…")

    st.markdown("---")

    # ---- Farmer-friendly summary ----
    st.subheader("What This Means for Your Farm")

    if dates and tmax_list and rain_prob_list:
        lines = []
        for i in range(min(5, len(dates))):
            label = _day_label(dates[i], i)
            tmax = tmax_list[i]
            tmin = tmin_list[i] if i < len(tmin_list) else None
            rain = rain_prob_list[i]
            code = int(codes[i]) if i < len(codes) else 0
            _, emoji = _code_to_label(code)

            parts = [f"**{label}** {emoji}"]
            parts.append(f"High of {_temp_plain(tmax)}")
            if tmin is not None:
                parts.append(f"low of {_temp_plain(tmin)}")
            parts.append(_rain_plain(rain))
            lines.append(" · ".join(parts))

        st.markdown("\n\n".join(lines))

    st.markdown("---")
    fetched_at = datetime.now().strftime("%H:%M on %d %b %Y")
    st.caption(
        f"Data from [Open-Meteo](https://open-meteo.com/) · "
        f"Fetched at {fetched_at} · Refreshes every 30 minutes"
    )
