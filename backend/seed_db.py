import sys
import os

# Ensure we can import from the app module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.database import SessionLocal, engine, Base
from backend.app.models import InterventionSuggestion

def seed_data():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if we already have data
    if db.query(InterventionSuggestion).count() > 0:
        print("Database already contains intervention suggestions. Skipping seed.")
        db.close()
        return

    suggestions = [
        # Fatigue Category
        InterventionSuggestion(
            category="fatigue",
            suggestion_text="You've been studying for a while. Try the 20-20-20 rule: look at something 20 feet away for 20 seconds."
        ),
        InterventionSuggestion(
            category="fatigue",
            suggestion_text="Fatigue detected. Stand up and stretch your arms and back for 30 seconds."
        ),
        InterventionSuggestion(
            category="fatigue",
            suggestion_text="Your focus is dipping. Drink a glass of water to refresh your brain."
        ),
        
        # Distraction Category
        InterventionSuggestion(
            category="distraction",
            suggestion_text="It looks like you're losing focus. Try to clear your workspace of phones or non-study materials."
        ),
        InterventionSuggestion(
            category="distraction",
            suggestion_text="Frequent distractions detected. Taking a quick 5-minute 'reset' break can help you regain focus."
        ),
        
        # Break Category
        InterventionSuggestion(
            category="break",
            suggestion_text="Time for a Pomodoro break! Close your eyes for 5 minutes and step away from the screen."
        ),
        InterventionSuggestion(
            category="break",
            suggestion_text="Session complete! Great job maintaining focus. Do a quick 2-minute breathing exercise before your next task."
        ),
    ]

    try:
        db.add_all(suggestions)
        db.commit()
        print(f"Successfully seeded {len(suggestions)} intervention suggestions.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
