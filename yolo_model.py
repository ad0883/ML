from ultralytics import YOLO
from schemas import BoundingBox, DetectedFood, NutritionInfo
from nutrition_db import get_nutrition, generate_advice

model = YOLO("runs/detect/train3/weights/best.pt")

def run_inference(image_path: str, condition: str | None = None):
    results = model(image_path)
    detections = []

    for r in results[0].boxes:
        cls_id = int(r.cls[0])
        label = results[0].names[cls_id].lower()
        conf = float(r.conf[0])
        xyxy = r.xyxy[0].cpu().numpy()  # [x1, y1, x2, y2]

        # Get nutrition info as NutritionInfo
        nut = get_nutrition(label)
        nutrition = NutritionInfo(
            calories=nut.get("calories", 0),
            protein=nut.get("protein", 0),
            carbs=nut.get("carbs", 0),
            fat=nut.get("fat", 0)
        )

        # Get advice as list of strings
        advice = generate_advice(label, condition)

        detections.append(DetectedFood(
            label=label,
            confidence=conf,
            bbox=BoundingBox(
                x1=float(xyxy[0]),
                y1=float(xyxy[1]),
                x2=float(xyxy[2]),
                y2=float(xyxy[3]),
                confidence=conf
            ),
            nutrition=nutrition,
            advice=advice
        ))
    return detections
