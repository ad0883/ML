# Expose FastAPI app for Uvicorn by importing from common locations
# Tries a few typical modules and an app factory pattern.
try:
    from main import app as app  # backend/main.py
except Exception:
    try:
        from app.main import app as app  # backend/app/main.py
    except Exception:
        try:
            from api.main import app as app  # backend/api/main.py
        except Exception:
            try:
                from src.main import app as app  # backend/src/main.py
            except Exception:
                try:
                    from application.main import app as app  # backend/application/main.py
                except Exception:
                    # App factory fallbacks
                    try:
                        from main import create_app  # type: ignore
                        app = create_app()
                    except Exception as e:
                        raise ImportError(
                            "Could not locate FastAPI 'app' in main.py, app/main.py, api/main.py, src/main.py, application/main.py, or via create_app()"
                        ) from e
