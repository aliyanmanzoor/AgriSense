"""
Crop Calendar page — crop stage tracking and growth timeline calculation.
"""

from datetime import datetime, date
import streamlit as st
from database import get_connection, get_all_farmers, get_crops_for_farmer

# ---------------------------------------------------------------------------
# Stage definitions (days after planting)
# ---------------------------------------------------------------------------
STAGES_WHEAT = [
    ("Germination / Emergence", 0, 10),
    ("Tillering", 10, 40),
    ("Jointing", 40, 70),
    ("Booting", 70, 85),
    ("Heading / Flowering", 85, 95),
    ("Grain filling", 95, 120),
    ("Maturity / Harvest", 120, 140),
]

STAGES_MAIZE = [
    ("Emergence", 0, 7),
    ("Early vegetative growth", 7, 35),
    ("Rapid vegetative growth", 35, 55),
    ("Tasseling / Silking", 55, 65),
    ("Grain filling", 65, 95),
    ("Maturity", 95, 120),
]

DEFAULT_STAGES = [
    ("Germination / Early Growth", 0, 30),
    ("Vegetative Growth", 30, 60),
    ("Flowering & Grain Development", 60, 90),
    ("Maturity / Harvest Preparation", 90, 120),
]


def calculate_crop_stage(crop_type: str, days_since_planting: int) -> dict:
    """Calculate current stage, days into stage, next stage, and progress."""
    c_norm = crop_type.strip().lower()
    if "wheat" in c_norm:
        stages = STAGES_WHEAT
    elif "maize" in c_norm or "corn" in c_norm:
        stages = STAGES_MAIZE
    else:
        stages = DEFAULT_STAGES

    max_days = stages[-1][2]

    if days_since_planting < 0:
        return {
            "status": "scheduled",
            "days_until_planting": abs(days_since_planting),
            "max_days": max_days,
        }

    if days_since_planting > max_days:
        return {
            "status": "ready_for_harvest",
            "days_past": days_since_planting - max_days,
            "max_days": max_days,
            "progress": 1.0,
        }

    current_stage = None
    next_stage = None
    stage_idx = -1

    for idx, (name, start_d, end_d) in enumerate(stages):
        if start_d <= days_since_planting < end_d or (idx == len(stages) - 1 and days_since_planting == end_d):
            current_stage = (name, start_d, end_d)
            stage_idx = idx
            break

    if current_stage is None:
        current_stage = stages[-1]
        stage_idx = len(stages) - 1

    if stage_idx + 1 < len(stages):
        next_stage = stages[stage_idx + 1]

    days_in_stage = days_since_planting - current_stage[1]
    days_to_next = current_stage[2] - days_since_planting

    progress = min(1.0, max(0.0, days_since_planting / max_days))

    return {
        "status": "in_progress",
        "current_stage": current_stage[0],
        "days_in_stage": days_in_stage,
        "stage_duration": current_stage[2] - current_stage[1],
        "next_stage": next_stage[0] if next_stage else None,
        "days_to_next": days_to_next,
        "progress": progress,
        "max_days": max_days,
        "stages_list": stages,
    }


def render():
    st.header("📅 Crop Calendar")
    conn = get_connection()

    selected_id = st.session_state.get("farmer_id")
    if not selected_id:
        st.error("You must be logged in to view crop calendar data.")
        return

    st.success(f"Showing data for {st.session_state.get('farmer_name')}")

    crops = get_crops_for_farmer(conn, selected_id)
    if not crops:
        st.warning("This farmer has no crops recorded.")
        return

    today = date.today()

    for crop in crops:
        crop_type = crop["crop_type"]
        p_date_str = crop["planting_date"]
        farm_size = crop["farm_size"]

        st.subheader(f"🌱 Crop: {crop_type}")

        if not p_date_str:
            st.info("Planting date is not specified for this crop.")
            continue

        try:
            planting_date = datetime.strptime(p_date_str, "%Y-%m-%d").date()
        except ValueError:
            st.error(f"Invalid planting date format: {p_date_str}")
            continue

        days_since_planting = (today - planting_date).days
        stage_info = calculate_crop_stage(crop_type, days_since_planting)

        # Overview Metrics
        col1, col2, col3 = st.columns(3)
        col1.metric("Planting Date", p_date_str)
        col2.metric("Days Since Planting", f"{days_since_planting} days" if days_since_planting >= 0 else "Scheduled")
        col3.metric("Farm Size", f"{farm_size} acres" if farm_size else "N/A")

        st.markdown("---")

        status = stage_info["status"]

        if status == "scheduled":
            st.info(f"⏳ Planting is scheduled to start in **{stage_info['days_until_planting']} days**.")

        elif status == "ready_for_harvest":
            st.success("🌾 **Crop should be ready for harvest!**")
            st.progress(1.0)
            st.write(
                f"This crop reached full maturity around **{stage_info['max_days']} days** after planting "
                f"({stage_info['days_past']} days ago)."
            )

        elif status == "in_progress":
            # Progress Bar
            st.markdown(f"**Overall Progress to Maturity ({int(stage_info['progress'] * 100)}%)**")
            st.progress(stage_info["progress"])

            # Stage summary callouts
            c1, c2 = st.columns(2)

            with c1:
                st.markdown("### 📍 Current Stage")
                st.markdown(f"**{stage_info['current_stage']}**")
                st.info(f"You are on **day {stage_info['days_in_stage']}** of this stage.")

            with c2:
                st.markdown("### ⏭️ Next Stage")
                if stage_info["next_stage"]:
                    st.markdown(f"**{stage_info['next_stage']}**")
                    st.success(f"Starts in **{stage_info['days_to_next']} days**.")
                else:
                    st.markdown("**Harvest / Full Maturity**")
                    st.success(f"Expected in **{stage_info['days_to_next']} days**.")

            st.markdown("---")

            # Timeline overview breakdown
            with st.expander("Show Stage Timeline", expanded=False):
                for s_name, s_start, s_end in stage_info["stages_list"]:
                    is_current = s_name == stage_info["current_stage"]
                    prefix = "👉 " if is_current else "• "
                    highlight = f"**{s_name}**" if is_current else s_name
                    st.markdown(f"{prefix}{highlight}: Days {s_start} – {s_end}")
