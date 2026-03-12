import os
from pydantic_settings import BaseSettings


def _fix_db_url(url: str) -> str:
    """
    Supabase (and some cloud providers) give connection strings starting with
    `postgres://` but SQLAlchemy 2.0 only accepts `postgresql://`.
    This auto-fixes the prefix.
    """
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "AI Study Assistant"
    VERSION: str = "2.0.0"

    # Database - SQLite for local dev, PostgreSQL (Supabase) for production
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ai_study.db")

    # Access Token configurations
    # ⚠️ IMPORTANT: Set SECRET_KEY as an env variable in Render — never use the default in production
    SECRET_KEY: str = os.getenv("SECRET_KEY", "b3c5a6d9e0f31dbb809d84c172a5b67e9140902c1f8a848c1e2b5e1a3b90f1d2")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # --- Validation Bounds ---
    MAX_SESSION_DURATION_SECONDS: int = 43200      # 12 hours max per session
    MAX_EXERCISE_REPS: int = 200
    MAX_BATCH_EVENTS: int = 50
    ALLOWED_EVENT_TYPES: list = [
        "fatigue_detected",
        "distraction_detected",
        "focus_restored",
        "pomodoro_work_start",
        "pomodoro_break_start",
        "pomodoro_completed",
        "reaction_game_played",
        "session_summary",
    ]

    # --- Rate Limiting ---
    RATE_LIMIT_PER_MINUTE: int = 60

    # --- AI Cost Control ---
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "gemini-pro")
    AI_ENABLED: bool = os.getenv("AI_ENABLED", "false").lower() == "true"

    class Config:
        env_file = ".env"


_raw_settings = Settings()

# Apply the postgres:// → postgresql:// fix for Supabase
_raw_settings.DATABASE_URL = _fix_db_url(_raw_settings.DATABASE_URL)

settings = _raw_settings

