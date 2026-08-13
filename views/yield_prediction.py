"""Yield Prediction page — estimate yield based on historical patterns."""

import streamlit as st
import joblib
from pathlib import Path
from database import get_connection, get_all_farmers

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
MODEL_PATH = Path(__file__).parent.parent / "models" / "yield_model.pkl"

# ---------------------------------------------------------------------------
# Cached model loader
# ---------------------------------------------------------------------------
@st.cache_resource(show_spinner="Loading yield prediction model...")
def load_yield_model():
    """Load the Random Forest yield model from disk."""
    return joblib.load(str(MODEL_PATH))

# ---------------------------------------------------------------------------
# Main render
# ---------------------------------------------------------------------------
def render():
    st.header("📊 Yield Prediction")
    conn = get_connection()

    st.info("Estimate expected yield based on crop type and environmental factors.")

    selected_id = st.session_state.get("farmer_id")
    if not selected_id:
        st.error("You must be logged in to view yield prediction data.")
        return

    st.success(f"Showing data for {st.session_state.get('farmer_name')}")

    st.markdown("---")
    st.subheader("Input Farm Data")
    
    # Input fields
    crop_type_str = st.selectbox("Crop Type", options=["Wheat", "Maize"], key="yield_crop")
    avg_rain = st.number_input("Expected Rainfall (mm/year)", min_value=0.0, value=500.0, step=10.0, key="yield_rain")
    pesticides = st.number_input("Pesticide Use (tonnes)", min_value=0.0, value=10.0, step=0.1, key="yield_pest")
    avg_temp = st.number_input("Average Temperature (°C)", min_value=-10.0, value=25.0, step=0.5, key="yield_temp")

    # Fixed inputs for this context
    area_encoded = 72  # Pakistan
    year = 2026

    # Encode crop type as expected by the model
    crop_encoded = 0 if crop_type_str == "Wheat" else 1

    if st.button("Predict Yield", type="primary"):
        if not MODEL_PATH.exists():
            st.error(
                f"Model file not found at `{MODEL_PATH}`. "
                "Please place `yield_model.pkl` in the `models/` directory."
            )
            return

        try:
            model = load_yield_model()
            
            # Feature vector matches the exact order requested:
            # [crop_encoded, area_encoded, Year, average_rain_fall_mm_per_year, pesticides_tonnes, avg_temp]
            features = [[
                crop_encoded, 
                area_encoded, 
                year, 
                avg_rain, 
                pesticides, 
                avg_temp
            ]]
            
            # Run prediction
            raw_yield_hg_ha = model.predict(features)[0]
            
            # Multiply by 100 for a farmer-friendly unit (kg/ha) as per requirements
            yield_kg_ha = raw_yield_hg_ha * 0.1
            
            st.success(f"**Estimated Yield:** {yield_kg_ha:,.2f} kg per hectare")
            st.caption("Note: This is a statistical estimate based on historical patterns, not a guarantee.")
            
        except Exception as e:
            st.error(f"An error occurred during prediction: {e}")
