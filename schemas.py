from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


# Auth / token schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None


# User schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


# Detection / inference schemas
class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float


class DetectedItem(BaseModel):
    label: str
    confidence: float
    bbox: BoundingBox
    nutrition: Optional[Dict[str, Any]] = None
    estimated_calories: Optional[float] = None
    estimated_protein: Optional[float] = None
    estimated_carbs: Optional[float] = None
    estimated_fat: Optional[float] = None
    estimated_sugar: Optional[float] = None
    estimated_fiber: Optional[float] = None
    estimated_sodium: Optional[float] = None
    advice: Optional[List[str]] = None


class ScanResponse(BaseModel):
    detections: List[DetectedItem]
    total_calories: Optional[float] = None
    total_protein: Optional[float] = None
    total_carbs: Optional[float] = None
    total_fat: Optional[float] = None
    total_sugar: Optional[float] = None
    total_fiber: Optional[float] = None
    total_sodium: Optional[float] = None


# Recommendations
class RecommendationRequest(BaseModel):
    food_item: str
    condition: Optional[str] = None


class RecommendationResponse(BaseModel):
    food_item: str
    condition: Optional[str]
    advice: List[str]

