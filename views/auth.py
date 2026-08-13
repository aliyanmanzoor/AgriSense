"""Authentication page — Farmer Login."""

import streamlit as st
import bcrypt
from database import get_connection, get_farmer_by_phone

def render():
    st.header("🔑 Farmer Login")
    
    with st.form("login_form"):
        phone = st.text_input("Phone Number")
        password = st.text_input("Password", type="password")
        
        submitted = st.form_submit_button("Login", type="primary")
        
        if submitted:
            if not phone.strip() or not password.strip():
                st.warning("Please enter both phone number and password.")
            else:
                conn = get_connection()
                farmer = get_farmer_by_phone(conn, phone.strip())
                
                if farmer and farmer["password_hash"]:
                    # Verify password against hash
                    if bcrypt.checkpw(password.encode("utf-8"), farmer["password_hash"].encode("utf-8")):
                        st.session_state["farmer_id"] = farmer["id"]
                        st.session_state["farmer_name"] = farmer["name"]
                        st.success(f"Welcome back, {farmer['name']}! Logging you in...")
                        st.rerun()
                    else:
                        st.error("Invalid phone number or password.")
                else:
                    st.error("Invalid phone number or password.")

    st.markdown("---")
    col1, col2 = st.columns([3, 1])
    with col1:
        st.write("New farmer? Create an account to get started.")
    with col2:
        if st.button("Sign Up", type="secondary"):
            st.session_state["force_nav"] = "🧑‍🌾 Farmer Onboarding"
            st.rerun()