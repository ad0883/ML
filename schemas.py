# schemas.py
from pydantic import BaseModel
from typing import List, Optional

class NutritionInfo(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float

class DetectedFood(BaseModel):
    label: str
    confidence: float
    bbox: BoundingBox
    nutrition: Optional[NutritionInfo] = None
    advice: Optional[List[str]] = None

class ScanResponse(BaseModel):
    detections: List[DetectedFood]

class RecommendationRequest(BaseModel):
    food_item: str
    condition: Optional[str] = None

class RecommendationResponse(BaseModel):
    food_item: str
    condition: Optional[str]
    advice: List[str]
