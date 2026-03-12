from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import schemas, models, auth
from ..database import get_db

router = APIRouter(
    prefix="/api/v1/analytics",
    tags=["Analytics & Dashboard"]
)


@router.get("/dashboard", response_model=schemas.DashboardAnalytics)
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Returns comprehensive analytics for the user's dashboard.
    Aggregates all study sessions, distractions, exercises, and pomodoro cycles.
    """
    sessions = (
        db.query(models.StudySession)
        .filter(models.StudySession.user_id == current_user.id)
        .order_by(models.StudySession.start_time.desc())
        .limit(50)
        .all()
    )

    total_sessions = len(sessions)
    total_study_seconds = sum(s.duration_seconds for s in sessions)
    total_study_hours = round(total_study_seconds / 3600, 2)
    total_distractions = sum(s.total_distractions for s in sessions)
    total_fatigue_events = sum(s.total_fatigue_events for s in sessions)
    total_pomodoro_cycles = sum(s.pomodoro_cycles_completed for s in sessions)

    avg_session_minutes = round(
        (total_study_seconds / total_sessions / 60) if total_sessions > 0 else 0, 1
    )

    total_exercises = (
        db.query(func.count(models.ExerciseSession.id))
        .join(models.StudySession)
        .filter(models.StudySession.user_id == current_user.id)
        .scalar()
    ) or 0

    return schemas.DashboardAnalytics(
        total_sessions=total_sessions,
        total_study_hours=total_study_hours,
        total_distractions=total_distractions,
        total_fatigue_events=total_fatigue_events,
        total_exercises_done=total_exercises,
        total_pomodoro_cycles=total_pomodoro_cycles,
        avg_session_minutes=avg_session_minutes,
        sessions=sessions
    )
