from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import schemas, models, auth
from ..database import get_db
from ..config import settings
from datetime import datetime

router = APIRouter(
    prefix="/api/v1/events",
    tags=["Events"]
)


@router.post("/batch", response_model=dict, status_code=status.HTTP_201_CREATED)
def record_batch_events(
    batch: schemas.BatchEventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    --- Flaw #1 Fix: Batch event recording ---
    The frontend holds events in memory and sends them as a batch every ~5 minutes.
    This prevents the database from being flooded with per-blink micro-events.

    --- Flaw #2 Fix: Validation ---
    - event_type is validated against ALLOWED_EVENT_TYPES in the schema
    - batch size is capped at MAX_BATCH_EVENTS in the schema
    - session ownership is verified
    """
    # Verify session belongs to user
    db_session = db.query(models.StudySession).filter(
        models.StudySession.id == batch.session_id,
        models.StudySession.user_id == current_user.id
    ).first()

    if not db_session:
        raise HTTPException(status_code=404, detail="Active study session not found for this user")

    created_count = 0
    for event in batch.events:
        new_event = models.Event(
            session_id=batch.session_id,
            event_type=event.event_type,
            event_data=event.event_data,
            timestamp=event.timestamp or datetime.utcnow()
        )
        db.add(new_event)
        created_count += 1

    db.commit()
    return {"message": f"Successfully recorded {created_count} events", "count": created_count}


@router.post("/single", response_model=schemas.EventResponse, status_code=status.HTTP_201_CREATED)
def record_single_event(
    event: schemas.SingleEvent,
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Record a single significant event (e.g., session_summary, reaction_game_played).
    For high-frequency events like fatigue/distraction, use the /batch endpoint instead.
    """
    db_session = db.query(models.StudySession).filter(
        models.StudySession.id == session_id,
        models.StudySession.user_id == current_user.id
    ).first()

    if not db_session:
        raise HTTPException(status_code=404, detail="Active study session not found for this user")

    new_event = models.Event(
        session_id=session_id,
        event_type=event.event_type,
        event_data=event.event_data,
        timestamp=event.timestamp or datetime.utcnow()
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event


@router.get("/{session_id}", response_model=list[schemas.EventResponse])
def get_events_for_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all logged events for a specific study session."""
    db_session = db.query(models.StudySession).filter(
        models.StudySession.id == session_id,
        models.StudySession.user_id == current_user.id
    ).first()

    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    events = (
        db.query(models.Event)
        .filter(models.Event.session_id == session_id)
        .order_by(models.Event.timestamp.desc())
        .all()
    )
    return events
