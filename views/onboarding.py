"""Farmer Onboarding page — register new farmers and view existing ones."""

import re
import requests
import bcrypt
import streamlit as st
from database import get_connection, add_farmer, get_all_farmers, add_crop, add_location


def render():
    st.header("🧑‍🌾 Farmer Onboarding")
    conn = get_connection()

    with st.expander("Register a new farmer", expanded=True):
        with st.form("onboarding_form", clear_on_submit=False):
            name = st.text_input("Full Name", key="ob_name")
            phone = st.text_input("Phone Number", key="ob_phone")
            password = st.text_input("Password", type="password", key="ob_password")
            confirm_password = st.text_input("Confirm Password", type="password", key="ob_confirm_password")
            location = st.text_input("Enter your city, town, or village name", key="ob_location")

            st.markdown("---")
            st.subheader("Initial Crop")
            crop_type = st.text_input("Crop Type (e.g. Wheat, Rice)", key="ob_crop")
            planting_date = st.date_input("Planting Date", key="ob_date")
            farm_size = st.number_input("Farm Size (acres)", min_value=0.0, step=0.25, key="ob_size")

            submitted = st.form_submit_button("Register Farmer")

        if submitted:
            if (
                not name.strip()
                or not phone.strip()
                or not password.strip()
                or not confirm_password.strip()
                or not location.strip()
                or not crop_type.strip()
                or not planting_date
                or farm_size <= 0
            ):
                st.warning("Please fill all fields")
            elif password != confirm_password:
                st.warning("Passwords do not match.")
            else:
                search_query = (
                    f"{location.strip()}, Pakistan"
                    if "pakistan" not in location.strip().lower()
                    else location.strip()
                )
                headers = {
                    "User-Agent": "AgriSenseApp/1.0 (contact@agrisense.org)",
                    "Accept-Language": "en",
                }
                params = {"q": search_query, "format": "json"}

                geo_data = []
                try:
                    res = requests.get(
                        "https://nominatim.openstreetmap.org/search",
                        params=params,
                        headers=headers,
                        timeout=10,
                    )
                    if res.status_code == 200:
                        geo_data = res.json()
                except Exception:
                    geo_data = []

                if geo_data and isinstance(geo_data, list) and len(geo_data) > 0:
                    lat = float(geo_data[0]["lat"])
                    lon = float(geo_data[0]["lon"])
                    display_name = geo_data[0].get("display_name", "").lower()

                    typed_words = [
                        w.lower()
                        for w in re.findall(r"\w+", location)
                        if w.lower() != "pakistan"
                    ]
                    name_matched = any(w in display_name for w in typed_words)
                    country_part = display_name.split(",")[-1].strip()
                    is_pakistan = country_part == "pakistan"

                    if not name_matched or not is_pakistan:
                        st.warning(
                            "Could not confidently match this location inside Pakistan. "
                            "Please check the spelling, or try a nearby larger town/city name."
                        )
                    else:
                        # Hash password
                        pwd_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                        farmer_id = add_farmer(conn, name.strip(), phone.strip(), location.strip(), password_hash=pwd_hash)
                        add_crop(conn, farmer_id, crop_type.strip(), str(planting_date), farm_size)
                        add_location(conn, farmer_id, lat, lon, location.strip())

                        st.success(
                            f"✅ Farmer **{name.strip()}** registered (ID {farmer_id}). "
                            f"Location coordinates for **{location.strip()}** resolved automatically ({lat:.4f}, {lon:.4f})."
                        )
                else:
                    st.warning(
                        "Could not find location coordinates for this place. "
                        "Please check the spelling or try a nearby bigger town name instead."
                    )

    st.subheader("Registered Farmers")
    farmers = get_all_farmers(conn)
    if farmers:
        st.dataframe(farmers, use_container_width=True)
    else:
        st.info("No farmers registered yet. Use the form above to add one.")