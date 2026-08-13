"""
Notifications page — view and generate automated alerts for farmers.
"""

from datetime import datetime, date
import streamlit as st

from database import (
    get_connection,
    get_all_farmers,
    get_locations_for_farmer,
    get_crops_for_farmer,
    get_notifications_for_farmer,
    add_notification,
)
from views.weather import fetch_weather, _get_warnings
from views.crop_calendar import calculate_crop_stage

ICON_MAP = {
    "weather": "⚠️",
    "crop_stage": "📅",
    "disease": "🔬",
}


def _notification_exists(conn, farmer_id: int, message: str) -> bool:
    """Check if a notification with identical message already exists for this farmer."""
    row = conn.execute(
        "SELECT 1 FROM notifications WHERE farmer_id = ? AND message = ?",
        (farmer_id, message),
    ).fetchone()
    return row is not None


def generate_notifications(farmer_id: int) -> None:
    """
    Check for weather alerts and crop stage transitions for the given farmer.
    Insert new notification rows while avoiding duplicates.
    """
    conn = get_connection()

    # 1. Weather alerts check
    locations = get_locations_for_farmer(conn, farmer_id)
    if locations:
        loc = locations[0]
        lat, lon = round(loc["latitude"], 4), round(loc["longitude"], 4)
        try:
            data = fetch_weather(lat, lon)
            daily = data.get("daily", {})
            dates = daily.get("time", [])
            if dates:
                tmax = daily.get("temperature_2m_max", [0])[0]
                tmin = daily.get("temperature_2m_min", [20])[0]
                rain_prob = daily.get("precipitation_probability_max", [0])[0]
                codes = daily.get("weathercode", [0])
                code = int(codes[0]) if codes else 0

                warnings = _get_warnings(tmax, tmin, rain_prob, code)
                for _level, msg in warnings:
                    if not _notification_exists(conn, farmer_id, msg):
                        add_notification(conn, farmer_id, msg, notif_type="weather")
        except Exception:
            pass

    # 2. Crop stage transitions check
    crops = get_crops_for_farmer(conn, farmer_id)
    today = date.today()
    for crop in crops:
        crop_type = crop["crop_type"]
        p_date_str = crop["planting_date"]
        if not p_date_str:
            continue
        try:
            planting_date = datetime.strptime(p_date_str, "%Y-%m-%d").date()
        except ValueError:
            continue

        days_since_planting = (today - planting_date).days
        stage_info = calculate_crop_stage(crop_type, days_since_planting)

        if stage_info.get("status") == "in_progress":
            days_in_stage = stage_info.get("days_in_stage", 0)
            current_stage = stage_info.get("current_stage", "")
            if 0 <= days_in_stage <= 3:
                msg = f"Crop update for {crop_type}: Entered stage '{current_stage}'"
                if not _notification_exists(conn, farmer_id, msg):
                    add_notification(conn, farmer_id, msg, notif_type="crop_stage")


def render():
    st.header("🔔 Notifications & Alerts")
    conn = get_connection()

    selected_id = st.session_state.get("farmer_id")
    if not selected_id:
        st.error("You must be logged in to view notifications.")
        return

    st.success(f"Showing data for {st.session_state.get('farmer_name')}")

    # Auto-generate any new alerts for this farmer before loading list
    generate_notifications(selected_id)

    # Retrieve notifications sorted newest first
    notifications = get_notifications_for_farmer(conn, selected_id)

    st.subheader("Alert Log")

    if not notifications:
        st.info("No notifications yet for this farmer.")
        return

    for n in notifications:
        ntype = n.get("type", "info")
        icon = ICON_MAP.get(ntype, "ℹ️")
        sent_at = n.get("sent_at", "")
        msg = n.get("message", "")

        with st.container():
            col_icon, col_content = st.columns([0.08, 0.92])
            with col_icon:
                st.markdown(f"### {icon}")
            with col_content:
                st.markdown(f"**{msg}**")
                st.caption(f"Category: `{ntype}` • Received: {sent_at}")
            st.markdown("---")
