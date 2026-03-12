from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import schemas, models, auth
from ..database import get_db
from ..config import settings
from datetime import datetime
import random
import re

router = APIRouter(
    prefix="/api/v1/chat",
    tags=["Chatbot & Interventions"]
)


# ---- Flaw #3 Fix: Static cached intervention suggestions ---- #
# These are seeded into the database on first run (see seed_interventions below).
# The AI API is ONLY called if AI_ENABLED=true and the user types a unique question.

DEFAULT_INTERVENTIONS = [
    # Fatigue
    {"category": "fatigue", "suggestion_text": "You seem tired! Try 10 jumping jacks to get your blood flowing."},
    {"category": "fatigue", "suggestion_text": "Feeling drowsy? Stand up, stretch your arms above your head, and hold for 15 seconds."},
    {"category": "fatigue", "suggestion_text": "Time for a quick wake-up! Do 5 deep breaths: inhale 4 seconds, hold 4 seconds, exhale 4 seconds."},
    {"category": "fatigue", "suggestion_text": "Your eyes look heavy. Try the 20-20-20 rule: look at something 20 feet away for 20 seconds."},
    {"category": "fatigue", "suggestion_text": "Splash some cold water on your face or drink a glass of water. Dehydration causes fatigue!"},
    {"category": "fatigue", "suggestion_text": "Do 10 squats right now! Physical movement is the fastest way to reset alertness."},
    {"category": "fatigue", "suggestion_text": "Try a quick neck roll: slowly rotate your head in a full circle, 5 times each direction."},
    {"category": "fatigue", "suggestion_text": "Press your palms together firmly for 10 seconds, release, and repeat 3 times. This activates your nervous system."},
    # Distraction
    {"category": "distraction", "suggestion_text": "I noticed you looked away. Try to refocus — what's one thing you want to accomplish in the next 10 minutes?"},
    {"category": "distraction", "suggestion_text": "Getting distracted? Put your phone in another room for the next Pomodoro cycle."},
    {"category": "distraction", "suggestion_text": "Quick tip: Write down the distracting thought on paper to 'park' it, then refocus."},
    {"category": "distraction", "suggestion_text": "Try the 2-minute rule: If the distraction will take less than 2 minutes, do it now. Otherwise, note it for later."},
    # Break
    {"category": "break", "suggestion_text": "Great work! Take a 5-minute break. Walk around, grab a snack, then come back strong."},
    {"category": "break", "suggestion_text": "You've earned a break! Step away from the screen and let your eyes rest."},
    {"category": "break", "suggestion_text": "Break time! Try listening to a favorite song before your next focus block."},
]


@router.post("/", response_model=schemas.ChatResponse)
def analyze_chat(
    request: schemas.ChatRequest,
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Smart rule-based chat handler.
    --- Flaw #3 Fix: Does NOT call an AI API unless AI_ENABLED is True ---
    Uses keyword matching for common intents. Falls back to helpful static responses.
    """
    msg = request.message.lower()

    if re.search(r'\b(exercise|exercises|workout|squat|squats|pushup|push up|wake up|tired|drowsy|sleepy)\b', msg):
        return {"action": "TRIGGER_EXERCISE", "message": "Fatigue or exercise intent detected. Starting an intervention now."}

    elif re.search(r'\b(music|song|playlist|focus|study music|lofi|lo-fi)\b', msg):
        return {"action": "PLAY_MUSIC", "message": "I will load a focus playlist for you based on your topic."}

    elif re.search(r'\b(break|rest|pause|relax|stop)\b', msg):
        return {"action": "SUGGEST_BREAK", "message": "Sounds like you need a break! Step away from the screen for 5 minutes."}

    elif re.search(r'\b(pomodoro|timer|focus time|focus session)\b', msg):
        return {"action": "POMODORO_INFO", "message": "You can customize your Pomodoro timer using the gear icon. Try 25 min focus / 5 min break to start!"}

    elif re.search(r'\b(help|what can you do|commands|features)\b', msg):
        return {
            "action": "HELP",
            "message": "I can help you with:\n• Start an exercise intervention (say 'exercise' or 'wake up')\n• Play focus music (say 'music' or 'lofi')\n• Take a break (say 'break' or 'rest')\n• Pomodoro tips (say 'pomodoro' or 'timer')\n• Or just ask me anything!"
        }

    else:
        return {"action": "NONE", "message": "I understand. Keep studying, and let me know if you need to start an exercise, play music, or take a break. Type 'help' to see what I can do."}


@router.get("/intervention/{category}", response_model=schemas.InterventionResponse)
def get_random_intervention(
    category: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    --- Flaw #3 Fix: Returns a random cached suggestion ---
    Instead of calling GPT/Gemini every time, we pick from pre-loaded suggestions.
    """
    if category not in ("fatigue", "distraction", "break"):
        raise HTTPException(status_code=400, detail="Category must be 'fatigue', 'distraction', or 'break'")

    suggestions = (
        db.query(models.InterventionSuggestion)
        .filter(
            models.InterventionSuggestion.category == category,
            models.InterventionSuggestion.is_active == True
        )
        .all()
    )

    if not suggestions:
        # Fallback: if DB is empty, return a default
        return schemas.InterventionResponse(
            id="fallback",
            category=category,
            suggestion_text=f"Take a quick {category} break! Stand up and stretch for 30 seconds."
        )

    chosen = random.choice(suggestions)
    return chosen


@router.post("/seed-interventions", status_code=status.HTTP_201_CREATED)
def seed_interventions(db: Session = Depends(get_db)):
    """
    One-time seed endpoint to populate the intervention_suggestions table.
    Can be called once during setup. Idempotent — skips if data already exists.
    """
    existing = db.query(models.InterventionSuggestion).count()
    if existing > 0:
        return {"message": f"Already seeded. {existing} suggestions exist.", "count": existing}

    for item in DEFAULT_INTERVENTIONS:
        suggestion = models.InterventionSuggestion(
            category=item["category"],
            suggestion_text=item["suggestion_text"]
        )
        db.add(suggestion)

    db.commit()
    return {"message": f"Successfully seeded {len(DEFAULT_INTERVENTIONS)} intervention suggestions.", "count": len(DEFAULT_INTERVENTIONS)}
