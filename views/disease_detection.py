"""
Disease Detection page — maize leaf disease classification using YOLOv8n.

Model: models/maize_disease_best.pt  (task=classify, 4 classes)
Classes:
  0  Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot
  1  Corn_(maize)___Common_rust_
  2  Corn_(maize)___Northern_Leaf_Blight
  3  Corn_(maize)___healthy
"""

from pathlib import Path
from PIL import Image

import streamlit as st

from database import get_connection, get_all_farmers, get_crops_for_farmer

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
MODEL_PATH = Path(__file__).parent.parent / "models" / "maize_disease_v2_best.pt"

LOW_CONFIDENCE_THRESHOLD = 0.60   # below this → show a clarity tip

# Map raw class names → (friendly name, display level, advice)
CLASS_INFO = {
    "Corn_(maize)___healthy": (
        "Healthy",
        "success",
        "Your maize looks healthy! No disease detected. Keep up the good farming practices.",
    ),
    "Corn_(maize)___Common_rust_": (
        "Common Rust",
        "warning",
        (
            "Common Rust detected. This shows up as small reddish-brown spots on leaves. "
            "Consider fungicide treatment if severe, and remove heavily infected leaves to slow the spread."
        ),
    ),
    "Corn_(maize)___Northern_Leaf_Blight": (
        "Northern Leaf Blight",
        "error",
        (
            "Northern Leaf Blight detected. This causes long grey-green lesions on leaves. "
            "It can spread quickly in humid conditions — apply a recommended fungicide and "
            "avoid overhead irrigation where possible."
        ),
    ),
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": (
        "Gray Leaf Spot",
        "warning",
        (
            "Gray Leaf Spot detected. This causes rectangular tan lesions on leaves and is common "
            "in warm, humid weather. Rotate crops next season and apply fungicide if lesions are widespread."
        ),
    ),
}


# ---------------------------------------------------------------------------
# Cached model loader — only loads once per Streamlit session / worker
# ---------------------------------------------------------------------------
@st.cache_resource(show_spinner="Loading disease detection model…")
def load_model():
    """Load the YOLOv8n classification model from disk. Cached by st.cache_resource."""
    from ultralytics import YOLO  # import here so Streamlit doesn't error if not installed
    return YOLO(str(MODEL_PATH))


# ---------------------------------------------------------------------------
# Prediction helper
# ---------------------------------------------------------------------------
def run_prediction(model, image: Image.Image) -> tuple[str, float]:
    """
    Run the classifier on a PIL image.
    Returns (class_name_raw, confidence_float).
    """
    results = model(image, verbose=False)
    r = results[0]
    probs = r.probs
    class_name = r.names[probs.top1]
    confidence = float(probs.top1conf)
    return class_name, confidence


# ---------------------------------------------------------------------------
# Main render
# ---------------------------------------------------------------------------
def render():
    st.header("🔬 Disease Detection")
    conn = get_connection()

    selected_id = st.session_state.get("farmer_id")
    if not selected_id:
        st.error("You must be logged in to use disease detection.")
        return

    st.success(f"Showing data for {st.session_state.get('farmer_name')}")

    crops = get_crops_for_farmer(conn, selected_id)
    if not crops:
        st.warning("This farmer has no crops recorded. Please add a crop in **Farmer Onboarding**.")
        return

    # Check whether any of the farmer's crops is maize
    has_maize = any("maize" in c["crop_type"].lower() or "corn" in c["crop_type"].lower() for c in crops)

    if not has_maize:
        crop_names = ", ".join(c["crop_type"] for c in crops)
        st.info(
            f"Disease detection currently only supports **Maize**. "
            f"This farmer's crop(s): **{crop_names}**. Wheat support coming soon."
        )
        return

    # Confirm model file exists before offering the uploader
    if not MODEL_PATH.exists():
        st.error(
            f"Model file not found at `{MODEL_PATH}`. "
            "Please place `maize_disease_best.pt` in the `models/` directory."
        )
        return

    st.markdown("---")
    st.subheader("Upload a Leaf Photo")
    st.caption(
        "Take a clear, well-lit photo of a **single maize leaf** and upload it below. "
        "The AI will analyse it and tell you if any disease is detected."
    )

    uploaded = st.file_uploader(
        "Upload a photo of the maize leaf",
        type=["jpg", "jpeg", "png"],
        key="disease_uploader",
    )

    if uploaded is None:
        # No image yet — don't run inference, just show a hint
        st.info("👆 Upload a leaf photo above to get started.")
        return

    # ---- Display uploaded image ----
    image = Image.open(uploaded).convert("RGB")
    col_img, col_res = st.columns([1, 1])

    with col_img:
        st.image(image, caption="Uploaded leaf photo", use_container_width=True)

    # ---- Load model & run inference ----
    with col_res:
        st.subheader("Analysis Result")

        try:
            model = load_model()
        except Exception as exc:
            st.error(f"Failed to load the model: {exc}")
            return

        with st.spinner("Analysing the leaf…"):
            try:
                class_name_raw, confidence = run_prediction(model, image)
            except Exception as exc:
                st.error(f"Prediction failed: {exc}")
                return

        # ---- Look up friendly info ----
        friendly_name, display_level, advice = CLASS_INFO.get(
            class_name_raw,
            ("Unknown", "info", "Result not recognised. Please try another image."),
        )

        confidence_pct = confidence * 100

        # ---- Display result ----
        if display_level == "success":
            st.success(f"**{friendly_name}** — {advice}")
        elif display_level == "warning":
            st.warning(f"**{friendly_name}** — {advice}")
        elif display_level == "error":
            st.error(f"**{friendly_name}** — {advice}")
        else:
            st.info(advice)

        # Confidence bar
        st.markdown(f"**Model Confidence:** {confidence_pct:.1f}%")
        st.progress(confidence)

        if confidence < LOW_CONFIDENCE_THRESHOLD:
            st.caption(
                "⚠️ **Low confidence** — try a clearer, well-lit photo of a single leaf for better results."
            )
