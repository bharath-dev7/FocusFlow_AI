from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import schemas, models, auth
from ..database import get_db
from ..config import settings
from datetime import datetime

router = APIRouter(
    prefix="/api/v1/exercises",
    tags=["Exercises"]
)


@router.post("/start", response_model=schemas.ExerciseSessionResponse, status_code=status.HTTP_201_CREATED)
def start_exercise(
    exercise: schemas.ExerciseSessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Start an exercise intervention (squats, pushups, etc.)."""
    # Verify session belongs to user
    db_session = db.query(models.StudySession).filter(
        models.StudySession.id == exercise.session_id,
        models.StudySession.user_id == current_user.id
    ).first()

    if not db_session:
        raise HTTPException(status_code=404, detail="Study session not found")

    new_exercise = models.ExerciseSession(
        session_id=exercise.session_id,
        exercise_type=exercise.exercise_type
    )
    db.add(new_exercise)
    db.commit()
    db.refresh(new_exercise)
    return new_exercise


@router.post("/{exercise_id}/complete", response_model=schemas.ExerciseSessionResponse)
def complete_exercise(
    exercise_id: str,
    completion: schemas.ExerciseSessionComplete,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Mark an exercise as completed with the repetition count.
    --- Flaw #2 Fix: repetition_count is bounded by MAX_EXERCISE_REPS in the schema ---
    """
    exercise = db.query(models.ExerciseSession).filter(
        models.ExerciseSession.id == exercise_id
    ).first()

    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise session not found")

    # Verify ownership through the parent study session
    db_session = db.query(models.StudySession).filter(
        models.StudySession.id == exercise.session_id,
        models.StudySession.user_id == current_user.id
    ).first()

    if not db_session:
        raise HTTPException(status_code=403, detail="Not authorized to modify this exercise")

    if exercise.end_time is not None:
        raise HTTPException(status_code=400, detail="Exercise already completed")

    exercise.repetition_count = completion.repetition_count
    exercise.end_time = datetime.utcnow()

    db.commit()
    db.refresh(exercise)
    return exercise
