from sqlalchemy.orm import Session
import models
from auth import get_password_hash, verify_password
from typing import Optional, Dict, Any


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """
    Return user by email or None if not found.
    """
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, email: str, password: str, full_name: Optional[str] = None) -> models.User:
    """
    Create a new user, hashing the provided password.
    """
    hashed = get_password_hash(password)
    user = models.User(email=email, hashed_password=hashed, full_name=full_name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    """
    Verify email/password and return the user if valid, else None.
    """
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_detection(db: Session, image_path: str, result_json: Dict[str, Any], total_calories: Optional[float] = None, user_id: Optional[int] = None) -> models.Detection:
    """
    Persist a detection record. result_json should be a JSON-serializable dict
    containing 'detections' and optionally other metadata.
    """
    det = models.Detection(
        user_id=user_id,
        image_path=image_path,
        result_json=result_json,
        total_calories=total_calories
    )
    db.add(det)
    db.commit()
    db.refresh(det)
    return det


def get_detections_for_user(db: Session, user_id: int, limit: int = 50):
    """
    Return the most recent detections for a user.
    """
    return db.query(models.Detection).filter(models.Detection.user_id == user_id).order_by(models.Detection.created_at.desc()).limit(limit).all()
