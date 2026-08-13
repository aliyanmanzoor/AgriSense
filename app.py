"""
AgriSense — Agricultural Advisor Platform
==========================================
Entry point: `streamlit run app.py`

Sidebar navigation drives which page module renders.
"""

import streamlit as st
from database import init_db, get_connection

# Ensure DB tables exist on startup
init_db()

# ---------------------------------------------------------------------------
# Page config
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="AgriSense",
    page_icon="🌾",
    layout="wide",
)

# ---------------------------------------------------------------------------
# Sidebar navigation
# ---------------------------------------------------------------------------
st.sidebar.title("🌾 AgriSense")
st.sidebar.caption("Smart Agricultural Advisor")

logged_in = "farmer_id" in st.session_state

if not logged_in:
    PAGE_OPTIONS = {
        "🔑 Login": "auth",
        "🧑‍🌾 Farmer Onboarding": "onboarding",
    }
else:
    PAGE_OPTIONS = {
        "🌤️ Weather": "weather",
        "🔔 Notifications": "notifications",
        "📅 Crop Calendar": "crop_calendar",
        "🔬 Disease Detection": "disease_detection",
        "📊 Yield Prediction": "yield_prediction",
    }

options = list(PAGE_OPTIONS.keys())

default_index = 0
if "force_nav" in st.session_state and st.session_state["force_nav"] in options:
    default_index = options.index(st.session_state["force_nav"])
    del st.session_state["force_nav"]

selected = st.sidebar.radio("Navigate", options, index=default_index)

st.sidebar.markdown("---")

if logged_in:
    st.sidebar.markdown(f"**User:** {st.session_state.get('farmer_name')}")
    if st.sidebar.button("Logout", type="primary"):
        del st.session_state["farmer_id"]
        del st.session_state["farmer_name"]
        st.rerun()
    st.sidebar.markdown("---")

st.sidebar.info("AgriSense v0.1 — skeleton build")

# ---------------------------------------------------------------------------
# Route to selected page
# ---------------------------------------------------------------------------
page_module = PAGE_OPTIONS[selected]

if page_module == "auth":
    from views.auth import render
elif page_module == "onboarding":
    from views.onboarding import render
elif page_module == "weather":
    from views.weather import render
elif page_module == "notifications":
    from views.notifications import render
elif page_module == "crop_calendar":
    from views.crop_calendar import render
elif page_module == "disease_detection":
    from views.disease_detection import render
elif page_module == "yield_prediction":
    from views.yield_prediction import render

render()