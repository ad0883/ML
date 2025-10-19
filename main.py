# app/main.py
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pathlib import Path
import tempfile
import json
import logging
import os

# Local imports
import models, schemas, crud, yolo_model, auth
from database import engine, Base, get_db
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)

# Create tables if not present
Base.metadata.create_all(bind=engine)

app = FastAPI(title="YOLO Meal Scanner with USDA Nutrition")

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Serve Static Demo UI ---
static_dir = Path(__file__).parent / "static"
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


# --- USER ROUTES ---

@app.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    created = crud.create_user(db, email=user.email, password=user.password, full_name=user.full_name)
    return created


@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, getattr(user, "hashed_password", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = auth.create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# --- MAIN YOLO + USDA INTEGRATION ROUTE ---

@app.post("/scan-meal", response_model=schemas.ScanResponse)
async def scan_meal(
    file: UploadFile = File(...),
    condition: Optional[str] = Form(None),
    serve_mults: Optional[str] = Form(None),
    user_email: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Upload an image, detect food using YOLO, fetch nutrition data from USDA.
    """
    # --- Save upload temporarily ---
    suffix = Path(file.filename).suffix or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    # --- Parse optional multipliers ---
    serve_mults_map = None
    if serve_mults:
        try:
            serve_mults_map = json.loads(serve_mults)
            if not isinstance(serve_mults_map, dict):
                serve_mults_map = None
        except Exception:
            serve_mults_map = None

    # --- Run YOLO inference ---
    try:
        res = yolo_model.run_inference(tmp_path, serve_mults=serve_mults_map)
        logging.info(f"YOLO inference result: {res}")
    except Exception as e:
        logging.error(f"Error during YOLO inference: {e}", exc_info=True)
        Path(tmp_path).unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")

    # --- Return structured response ---
    return res


@app.get("/")
def home():
    return {"message": "🍽️ YOLO Meal Scanner API (USDA Integrated)"}
