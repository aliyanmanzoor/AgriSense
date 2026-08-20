"""
Disease Detection constants for the FastAPI backend.
"""

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
