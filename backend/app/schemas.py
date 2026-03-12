from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from .config import settings

# ---- User Schemas ---- #
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

# ---- JWT Token Schemas ---- #
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# ---- Study Session Schemas ---- #
class StudySessionCreate(BaseModel):
    pass

class StudySessionUpdate(BaseModel):
    """Sent when ending a session — with aggregated totals from the frontend."""
    duration_seconds: int = Field(..., ge=0, le=settings.MAX_SESSION_DURATION_SECONDS)
    total_distractions: int = Field(default=0, ge=0, le=9999)
    total_fatigue_events: int = Field(default=0, ge=0, le=9999)
    total_focus_minutes: float = Field(default=0.0, ge=0.0)
    pomodoro_cycles_completed: int = Field(default=0, ge=0, le=999)

class StudySessionResponse(BaseModel):
    id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: int
    total_distractions: int
    total_fatigue_events: int
    total_focus_minutes: float
    pomodoro_cycles_completed: int

    class Config:
        from_attributes = True

class StudySessionListResponse(BaseModel):
    """For dashboard analytics — returns a list of session summaries."""
    sessions: List[StudySessionResponse]
    total_sessions: int
    total_study_seconds: int
    total_distractions: int
    total_exercises_completed: int

# ---- Event Schemas ---- #
class SingleEvent(BaseModel):
    event_type: str
    event_data: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v):
        if v not in settings.ALLOWED_EVENT_TYPES:
            raise ValueError(f"Invalid event_type '{v}'. Allowed: {settings.ALLOWED_EVENT_TYPES}")
        return v

class BatchEventCreate(BaseModel):
    """
    --- Flaw #1 Fix: Batch event submission ---
    Frontend sends an array of events every ~5 minutes instead of per-blink.
    """
    session_id: str
    events: List[SingleEvent] = Field(..., max_length=settings.MAX_BATCH_EVENTS)

class EventResponse(BaseModel):
    id: str
    session_id: str
    event_type: str
    timestamp: datetime
    event_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# ---- Exercise Schemas ---- #
class ExerciseSessionCreate(BaseModel):
    session_id: str
    exercise_type: str

class ExerciseSessionComplete(BaseModel):
    repetition_count: int = Field(..., ge=1, le=settings.MAX_EXERCISE_REPS)

class ExerciseSessionResponse(BaseModel):
    id: str
    session_id: str
    exercise_type: str
    repetition_count: int
    start_time: datetime
    end_time: Optional[datetime] = None

    class Config:
        from_attributes = True

# ---- Intervention Schemas ---- #
class InterventionResponse(BaseModel):
    id: str
    category: str
    suggestion_text: str

    class Config:
        from_attributes = True

# ---- Chat Schemas ---- #
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)

class ChatResponse(BaseModel):
    action: str
    message: str

# ---- Analytics Schemas ---- #
class DashboardAnalytics(BaseModel):
    total_sessions: int
    total_study_hours: float
    total_distractions: int
    total_fatigue_events: int
    total_exercises_done: int
    total_pomodoro_cycles: int
    avg_session_minutes: float
    sessions: List[StudySessionResponse]

class MusicRecommendRequest(BaseModel):
    topic: str
