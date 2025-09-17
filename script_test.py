import cv2
import requests
from PIL import Image
import io

cap = cv2.VideoCapture(0)
ret, frame = cap.read()
cap.release()

if ret:
    image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    buf = io.BytesIO()
    image.save(buf, format="JPEG")
    buf.seek(0)

    response = requests.post(
        "http://127.0.0.1:8000/scan-meal",
        files={"file": ("meal.jpg", buf, "image/jpeg")},
        data={"condition": "diabetes"}
    )

    print(response.json())
