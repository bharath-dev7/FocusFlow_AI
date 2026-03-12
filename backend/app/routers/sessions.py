from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import schemas, models, auth
from ..database import get_db
from ..config import settings
from datetime import datetime
import uuid

router = APIRouter(
    prefix="/api/v1/sessions",
    tags=["Sessions"]
)


@router.post("/start", response_model=schemas.StudySessionResponse)
def start_session(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Start a new study session. Returns the session object with its ID."""
    new_session = models.StudySession(user_id=current_user.id)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@router.post("/{session_id}/end", response_model=schemas.StudySessionResponse)
def end_session(
    session_id: str,
    session_update: schemas.StudySessionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    End a study session and submit aggregated summary data.
    --- Flaw #1 Fix: The frontend sends totals (not micro-events) ---
    --- Flaw #2 Fix: duration_seconds is capped by MAX_SESSION_DURATION_SECONDS in the schema ---
    """
    db_session = db.query(models.StudySession).filter(
        models.StudySession.id == session_id,
        models.StudySession.user_id == current_user.id
    ).first()

    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    if db_session.end_time is not None:
        raise HTTPException(status_code=400, detail="Session has already ended")

    db_session.end_time = datetime.utcnow()
    db_session.duration_seconds = session_update.duration_seconds
    db_session.total_distractions = session_update.total_distractions
    db_session.total_fatigue_events = session_update.total_fatigue_events
    db_session.total_focus_minutes = session_update.total_focus_minutes
    db_session.pomodoro_cycles_completed = session_update.pomodoro_cycles_completed

    db.commit()
    db.refresh(db_session)
    return db_session


@router.get("/history", response_model=schemas.StudySessionListResponse)
def get_session_history(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get the user's study session history for the dashboard.
    Returns sessions sorted by most recent first, plus aggregated totals.
    """
    sessions = (
        db.query(models.StudySession)
        .filter(models.StudySession.user_id == current_user.id)
        .order_by(models.StudySession.start_time.desc())
        .limit(limit)
        .all()
    )

    total_study_seconds = sum(s.duration_seconds for s in sessions)
    total_distractions = sum(s.total_distractions for s in sessions)

    # Count total exercises completed across all sessions
    total_exercises = (
        db.query(func.count(models.ExerciseSession.id))
        .join(models.StudySession)
        .filter(models.StudySession.user_id == current_user.id)
        .scalar()
    ) or 0

    return schemas.StudySessionListResponse(
        sessions=sessions,
        total_sessions=len(sessions),
        total_study_seconds=total_study_seconds,
        total_distractions=total_distractions,
        total_exercises_completed=total_exercises
    )
