import os
import requests

USDA_API_KEY = os.getenv("USDA_API_KEY")
USDA_ENABLED = os.getenv("USDA_ENABLED", "0").lower() in ("1", "true", "yes")
TIMEOUT = float(os.getenv("USDA_TIMEOUT", "2.0"))

SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"
DETAIL_URL = "https://api.nal.usda.gov/fdc/v1/food/{}"

def _disabled():
    return not USDA_ENABLED or not USDA_API_KEY

def _search_food(food_name: str):
    if _disabled():
        return None
    try:
        params = {
            "query": food_name,
            "pageSize": 1,
            "api_key": USDA_API_KEY,
            "dataType": ["Branded", "Survey (FNDDS)", "Foundation"],
        }
        r = requests.get(SEARCH_URL, params=params, timeout=TIMEOUT)
        r.raise_for_status()
        j = r.json()
        foods = j.get("foods") or []
        return foods[0].get("fdcId") if foods else None
    except requests.RequestException as e:
        print("USDA search error:", e)
        return None

def _get_food_details(fdc_id: int):
    if _disabled():
        return None
    try:
        r = requests.get(DETAIL_URL.format(fdc_id), params={"api_key": USDA_API_KEY}, timeout=TIMEOUT)
        r.raise_for_status()
        data = r.json()
    except requests.RequestException as e:
        print("USDA details error:", e)
        return None

    nutrition = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0}
    for n in data.get("foodNutrients", []):
        name = (n.get("nutrientName") or "").lower()
        val = float(n.get("value") or 0.0)
        if "energy" in name or "calories" in name:
            nutrition["calories"] = val
        elif "protein" in name:
            nutrition["protein"] = val
        elif "carbohydrate" in name:
            nutrition["carbs"] = val
        elif "fat" in name and "saturated" not in name:
            nutrition["fat"] = val
    return nutrition

def get_usda_nutrition(food_name: str):
    if _disabled():
        return None
    fdc_id = _search_food(food_name)
    if not fdc_id:
        return None
    nut = _get_food_details(fdc_id)
    if nut:
        nut["source"] = "USDA"
        nut["food_name"] = food_name
    return nut
