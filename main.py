import json
from fastapi import FastAPI, UploadFile, File, Form
from schemas import ScanResponse, RecommendationResponse, RecommendationRequest
from yolo_model import run_inference
import tempfile
from pathlib import Path

app = FastAPI(title="YOLO Meal Scanner API", version="1.0")

latest_detection = None  # store the last scan result

# Dummy implementation of generate_advice
def generate_advice(food_item, condition):
    return [f"Advice for {food_item} with {condition}."]

# Helper to serialize detection object
def serialize_detection(d):
    return {
        "label": d.label,
        "confidence": d.confidence,
        "bbox": {
            "x1": d.bbox.x1,
            "y1": d.bbox.y1,
            "x2": d.bbox.x2,
            "y2": d.bbox.y2,
            "confidence": d.bbox.confidence
        },
        "nutrition": {
            "calories": d.nutrition.calories,
            "protein": d.nutrition.protein,
            "carbs": d.nutrition.carbs,
            "fat": d.nutrition.fat
        } if d.nutrition else None,
        "advice": d.advice or []
    }

@app.post("/scan-meal", response_model=ScanResponse)
async def scan_meal(file: UploadFile = File(...), condition: str = Form(None)):
    global latest_detection

    # Save uploaded file temporarily
    suffix = Path(file.filename).suffix or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    # Run YOLO inference on the temp file
    detections = run_inference(tmp_path, condition)

    # Store latest detection in memory
    latest_detection = {"detections": [serialize_detection(d) for d in detections]}

    # Optional: print to terminal for debug
    print(json.dumps(latest_detection, indent=2))

    return latest_detection

@app.get("/latest-detection")
async def get_latest_detection():
    return latest_detection or {"detections": []}

@app.post("/recommendations", response_model=RecommendationResponse)
async def recommendations(req: RecommendationRequest):
    tips = generate_advice(req.food_item, req.condition)
    return {"food_item": req.food_item, "condition": req.condition, "advice": tips}
