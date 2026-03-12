from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from .database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sessions = relationship("StudySession", back_populates="user")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)

    # --- Flaw #1 Fix: Aggregated summary fields (not micro-events) ---
    total_distractions = Column(Integer, default=0)
    total_fatigue_events = Column(Integer, default=0)
    total_focus_minutes = Column(Float, default=0.0)
    pomodoro_cycles_completed = Column(Integer, default=0)

    # Relationships
    user = relationship("User", back_populates="sessions")
    events = relationship("Event", back_populates="session")
    exercises = relationship("ExerciseSession", back_populates="session")


class Event(Base):
    """
    Stores BATCHED event summaries, NOT per-blink micro-events.
    The frontend aggregates events in memory and sends a summary every ~5 min.
    """
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("study_sessions.id"), nullable=False)
    event_type = Column(String, nullable=False, index=True)
    event_data = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    session = relationship("StudySession", back_populates="events")


class ExerciseSession(Base):
    __tablename__ = "exercise_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("study_sessions.id"), nullable=False)
    exercise_type = Column(String, nullable=False)
    repetition_count = Column(Integer, default=0)
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)

    # Relationships
    session = relationship("StudySession", back_populates="exercises")


class InterventionSuggestion(Base):
    """
    --- Flaw #3 Fix: Static intervention suggestions ---
    Pre-loaded suggestions to avoid calling expensive AI APIs on every fatigue trigger.
    The AI API is ONLY called when a user explicitly types a unique chat question.
    """
    __tablename__ = "intervention_suggestions"

    id = Column(String, primary_key=True, default=generate_uuid)
    category = Column(String, nullable=False, index=True)  # "fatigue", "distraction", "break"
    suggestion_text = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
