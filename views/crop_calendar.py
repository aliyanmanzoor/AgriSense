"""
Crop Calendar logic for the FastAPI backend.
"""

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
