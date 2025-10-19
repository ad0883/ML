from ultralytics import YOLO
from schemas import DetectedItem, BoundingBox
from nutrition_db import (
    estimate_calories,
    get_nutrition_for_label,
    estimate_macros,
    estimate_micros,
    simple_advice,
)
from typing import List, Dict, Optional
from PIL import Image
import os

# Path to the YOLO weights (set via env or default path)
YOLO_WEIGHTS = os.environ.get('YOLO_WEIGHTS', './runs/detect/train2/best.pt')

# lazy-loaded model reference
_model = None

def load_model():
    """
    Lazily load the ultralytics YOLO model.
    """
    global _model
    if _model is None:
        # If the file doesn't exist, the YOLO constructor will still accept model names like 'yolov8n.pt'
        _model = YOLO(YOLO_WEIGHTS)
    return _model


def run_inference(
    image_path: str,
    condition: Optional[str] = None,
    serve_mults: Optional[Dict[str, float]] = None
) -> Dict:
    """
    Run YOLO inference on an image, estimate calories/macros/micros, return structured results.
    """
    model = load_model()
    results = model.predict(source=image_path, conf=0.25)

    # Get image dimensions
    img = Image.open(image_path)
    img_size = {'width': img.width, 'height': img.height}

    detections: List[Dict] = []
    total_calories = 0.0
    total_protein = 0.0
    total_carbs = 0.0
    total_fat = 0.0
    total_sugar = 0.0
    total_fiber = 0.0
    total_sodium = 0.0

    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            # Get label name
            label = model.names[cls_id]

            # Build bbox dict
            bbox_dict = {
                'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2,
                'confidence': conf
            }

            # Nutrition base
            nutrition = get_nutrition_for_label(label)
            sm = serve_mults.get(label) if serve_mults else None

            # Estimates
            estimated_cal = estimate_calories(label, bbox_dict, img_size, sm)
            macros = estimate_macros(label, bbox_dict, img_size, sm)
            micros = estimate_micros(label, bbox_dict, img_size, sm)
            advice = simple_advice(label, condition)

            detection = {
                'label': label,
                'confidence': conf,
                'bbox': bbox_dict,
                'nutrition': nutrition,
                'estimated_calories': estimated_cal,
                'estimated_protein': macros['protein'],
                'estimated_carbs': macros['carbs'],
                'estimated_fat': macros['fat'],
                'estimated_sugar': micros['sugar'],
                'estimated_fiber': micros['fiber'],
                'estimated_sodium': micros['sodium'],
                'advice': advice,
            }
            detections.append(detection)

            total_calories += estimated_cal
            total_protein += macros['protein']
            total_carbs += macros['carbs']
            total_fat += macros['fat']
            total_sugar += micros['sugar']
            total_fiber += micros['fiber']
            total_sodium += micros['sodium']

    return {
        'detections': detections,
        'total_calories': round(total_calories, 1),
        'total_protein': round(total_protein, 1),
        'total_carbs': round(total_carbs, 1),
        'total_fat': round(total_fat, 1),
        'total_sugar': round(total_sugar, 1),
        'total_fiber': round(total_fiber, 1),
        'total_sodium': round(total_sodium, 0),
    }
