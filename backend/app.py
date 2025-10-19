# Expose FastAPI app for Uvicorn by importing from common locations
# Prefer relative imports when executed as part of the 'backend' package.
try:
    from .main import app as app  # backend/main.py
except Exception:
    try:
        from main import app as app  # repo-root main.py
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
                            from .main import create_app  # type: ignore
                            app = create_app()
                        except Exception:
                            try:
                                from main import create_app  # type: ignore
                                app = create_app()
                            except Exception as e:
                                raise ImportError(
                                    "Could not locate FastAPI 'app' in main.py (relative or root), app/main.py, api/main.py, src/main.py, application/main.py, or via create_app()"
                                ) from e
