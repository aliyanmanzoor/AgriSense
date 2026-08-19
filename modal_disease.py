"""
AgriSense -- Modal disease-detection service.

Deploy:
    modal deploy modal_disease.py
"""

import io
from pathlib import Path

import modal

# ---------------------------------------------------------------------------
# Image definition
# ---------------------------------------------------------------------------
MODEL_LOCAL = str(Path(__file__).parent / "models" / "maize_disease_v2_best.pt")
MODEL_REMOTE = "/app/models/maize_disease_v2_best.pt"

image = (
    modal.Image.debian_slim(python_version="3.11")
    # Install libGL so opencv-python (pulled by ultralytics) can load
    .apt_install("libgl1", "libglib2.0-0")
    .pip_install(
        "ultralytics>=8.0.0",
        "pillow>=10.0.0",
        "python-multipart",
        "fastapi[standard]",
    )
    .add_local_file(MODEL_LOCAL, MODEL_REMOTE)
)

app = modal.App("agrisense-disease-detection", image=image)

# ---------------------------------------------------------------------------
# Inference class -- model loaded once per container via @modal.enter()
# ---------------------------------------------------------------------------
@app.cls()
class DiseaseClassifier:
    @modal.enter()
    def load_model(self):
        """Load the YOLOv8 model once when the container starts."""
        import logging
        from ultralytics import YOLO

        logging.getLogger("ultralytics").setLevel(logging.WARNING)
        self.model = YOLO(MODEL_REMOTE)
        print("[DiseaseClassifier] Model loaded from", MODEL_REMOTE, flush=True)

    @modal.method()
    def predict(self, image_bytes: bytes) -> dict:
        """Run inference on raw image bytes. Returns {class_name, confidence}."""
        from PIL import Image

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        MAX_DIM = 640
        if image.width > MAX_DIM or image.height > MAX_DIM:
            image.thumbnail((MAX_DIM, MAX_DIM), Image.LANCZOS)

        results = self.model(image, verbose=False)
        r = results[0]
        probs = r.probs
        class_name = r.names[probs.top1]
        confidence = float(probs.top1conf)

        return {"class_name": class_name, "confidence": confidence}


# ---------------------------------------------------------------------------
# FastAPI web endpoint
# ---------------------------------------------------------------------------
import fastapi

@app.function()
@modal.fastapi_endpoint(method="POST")
async def detect(request: fastapi.Request) -> dict:
    """
    POST endpoint. Accepts multipart/form-data with field 'file'.
    Returns {"class_name": str, "confidence": float}.
    """
    from fastapi import HTTPException

    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        form = await request.form()
        upload = form.get("file")
        if upload is None:
            raise HTTPException(status_code=400, detail="No 'file' field in form data")
        image_bytes = await upload.read()
    else:
        image_bytes = await request.body()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image body")

    classifier = DiseaseClassifier()
    # Use .aio() for proper async invocation inside an async FastAPI handler
    result = await classifier.predict.remote.aio(image_bytes)
    return result


# ---------------------------------------------------------------------------
# Local entrypoint: modal run modal_disease.py
# ---------------------------------------------------------------------------
@app.local_entrypoint()
def main():
    from PIL import Image as PILImage

    buf = io.BytesIO()
    PILImage.new("RGB", (64, 64), color=(34, 139, 34)).save(buf, format="JPEG")
    image_bytes = buf.getvalue()

    classifier = DiseaseClassifier()
    result = classifier.predict.remote(image_bytes)
    print("Prediction result:", result)
