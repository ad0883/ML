import os
from typing import Dict, Optional

# Enable/disable USDA via .env (USDA_ENABLED=0 recommended in dev)
USDA_ENABLED = os.getenv("USDA_ENABLED", "0").lower() in ("1", "true", "yes")

# Minimal nutrition DB (per 100g) + typical serving size (+ optional micros)
NUTRITION: Dict[str, Dict[str, float]] = {
    "rasgulla": {
        "cal_per_100g": 200.0,
        "serving_g": 50.0,
        "protein_per_100g": 4.0,
        "carbs_per_100g": 40.0,
        "fat_per_100g": 3.0,
        # optional micros
        "sugar_per_100g": 28.0,
        "fiber_per_100g": 0.2,
        "sodium_mg_per_100g": 100.0,
    },
    "naan": {
        "cal_per_100g": 89.0,
        "serving_g": 118.0,
        "protein_per_100g": 1.1,
        "carbs_per_100g": 22.8,
        "fat_per_100g": 0.3,
        "sugar_per_100g": 12.2,
        "fiber_per_100g": 2.6,
        "sodium_mg_per_100g": 1.0,
    },
    "pizza": {
        "cal_per_100g": 266.0,
        "serving_g": 100.0,
        "protein_per_100g": 11.0,
        "carbs_per_100g": 33.0,
        "fat_per_100g": 10.0,
        "sugar_per_100g": 3.6,
        "fiber_per_100g": 2.3,
        "sodium_mg_per_100g": 640.0,
    },
}


def get_nutrition_for_label(label: str) -> Dict[str, float]:
    """Lookup macros for a detected label; return zeros if unknown."""
    key = (label or "").lower()
    return NUTRITION.get(
        key,
        {
            "cal_per_100g": 0.0,
            "serving_g": 100.0,
            "protein_per_100g": 0.0,
            "carbs_per_100g": 0.0,
            "fat_per_100g": 0.0,
            "sugar_per_100g": 0.0,
            "fiber_per_100g": 0.0,
            "sodium_mg_per_100g": 0.0,
        },
    )


def _portion_multiplier(
    bbox: Dict, image_size: Dict, serving_multiplier: Optional[float]
) -> float:
    """Heuristic multiplier from bbox area vs image area; clamp to sane range."""
    if serving_multiplier is not None:
        try:
            m = float(serving_multiplier)
            return max(0.05, min(m, 4.0))
        except Exception:
            pass

    iw = float(image_size.get("width", 1) or 1)
    ih = float(image_size.get("height", 1) or 1)
    img_area = iw * ih

    x1 = float(bbox.get("x1", 0.0))
    y1 = float(bbox.get("y1", 0.0))
    x2 = float(bbox.get("x2", 0.0))
    y2 = float(bbox.get("y2", 0.0))
    bw = max(0.0, x2 - x1)
    bh = max(0.0, y2 - y1)
    box_area = bw * bh

    area_ratio = box_area / max(1.0, img_area)  # tiny number
    m = area_ratio * 10.0  # heuristic scale-up
    if m < 0.1:
        m = max(m, 0.25 * (area_ratio * 10.0))
    return max(0.05, min(float(m), 4.0))


def estimate_calories(
    label: str, bbox: Dict, image_size: Dict, serving_multiplier: Optional[float] = None
) -> float:
    nut = get_nutrition_for_label(label)
    cal_per_100 = float(nut["cal_per_100g"])
    serving_g = float(nut["serving_g"] or 100.0)
    mult = _portion_multiplier(bbox, image_size, serving_multiplier)
    return round(cal_per_100 * serving_g / 100.0 * mult, 2)


def estimate_macros(
    label: str, bbox: Dict, image_size: Dict, serving_multiplier: Optional[float] = None
) -> Dict[str, float]:
    nut = get_nutrition_for_label(label)
    serving_g = float(nut["serving_g"] or 100.0)
    mult = _portion_multiplier(bbox, image_size, serving_multiplier)
    portion_g = serving_g * mult
    return {
        "protein": round(float(nut["protein_per_100g"]) * portion_g / 100.0, 1),
        "carbs": round(float(nut["carbs_per_100g"]) * portion_g / 100.0, 1),
        "fat": round(float(nut["fat_per_100g"]) * portion_g / 100.0, 1),
    }


def estimate_micros(
    label: str, bbox: Dict, image_size: Dict, serving_multiplier: Optional[float] = None
) -> Dict[str, float]:
    """Estimate sugar, fiber (g) and sodium (mg) for a detected item."""
    nut = get_nutrition_for_label(label)
    serving_g = float(nut["serving_g"] or 100.0)
    mult = _portion_multiplier(bbox, image_size, serving_multiplier)
    portion_g = serving_g * mult
    return {
        "sugar": round(float(nut.get("sugar_per_100g", 0.0)) * portion_g / 100.0, 1),
        "fiber": round(float(nut.get("fiber_per_100g", 0.0)) * portion_g / 100.0, 1),
        "sodium": round(float(nut.get("sodium_mg_per_100g", 0.0)) * portion_g / 100.0, 0),
    }


def simple_advice(label: str, condition: Optional[str] = None) -> Optional[list]:
    """Very lightweight heuristics for demo advice."""
    adv = []
    if condition == "diabetes":
        adv.append("Prefer low sugar options; adjust serving size")
    if condition == "weight_loss":
        adv.append("Favor higher protein and lower fat portions")
    if label.lower() in ("pizza", "burger"):
        adv.append("Consider adding a salad or fruit on the side")
    return adv or None


# Optional USDA lookup for free-form names (not used by YOLO pipeline)
def get_nutrition(food_name: str):
    """Try USDA (if enabled), else quick fallback."""
    if USDA_ENABLED:
        try:
            from usda_api import get_usda_nutrition  # lazy import
            usda_data = get_usda_nutrition(food_name)
            if usda_data:
                return usda_data
        except Exception as e:
            print("USDA lookup failed:", e)

    return {
        "food_name": food_name,
        "calories": 100.0,
        "protein": 2.0,
        "carbs": 20.0,
        "fat": 1.0,
        "source": "fallback",
    }
