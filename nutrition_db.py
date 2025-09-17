food_db = {
    "naan": {"calories": 260, "protein": 8, "carbs": 48, "fat": 7},
    "rasgulla": {"calories": 106, "protein": 4, "carbs": 22, "fat": 2},
    "paneer butter masala": {"calories": 350, "protein": 12, "carbs": 14, "fat": 26},
    "cham cham": {"calories": 150, "protein": 4, "carbs": 25, "fat": 3},
}

def get_nutrition(food_name):
    return food_db.get(food_name.lower(), {"calories":0, "protein":0, "carbs":0, "fat":0})

def generate_advice(food_name, condition=None):
    # simple tips for demo
    tips = []
    if condition == "diabetes":
        tips.append("Eat in moderation; low GI foods are preferred.")
    elif condition == "hypertension":
        tips.append("Watch sodium content.")
    else:
        tips.append("Maintain a balanced diet.")
    return tips
