"""
Yield Prediction helper for the FastAPI backend.
"""

import joblib
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
MODEL_PATH = Path(__file__).parent.parent / "models" / "yield_model.pkl"

# ---------------------------------------------------------------------------
# Model loader
# ---------------------------------------------------------------------------
def load_yield_model():
    """Load the Random Forest yield model from disk."""
    return joblib.load(str(MODEL_PATH))
