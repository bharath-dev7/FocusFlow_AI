import sys
import os
from fastapi.testclient import TestClient

# Ensure we can import from the app module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models import InterventionSuggestion

client = TestClient(app)

def run_tests():
    results = []
    
    # 1. Health Check
    try:
        response = client.get("/api/v1/health")
        if response.status_code == 200 and response.json().get("status") == "ok":
            results.append("✅ Health check passed.")
        else:
            results.append(f"❌ Health check failed: {response.status_code} - {response.text}")
    except Exception as e:
        results.append(f"❌ Health check error: {e}")

    # 2. Verify Root
    try:
        response = client.get("/")
        if response.status_code == 200 and "Hardened Architecture" in response.text:
            results.append("✅ Root endpoint verified.")
        else:
            results.append(f"❌ Root endpoint failed: {response.text}")
    except Exception as e:
        results.append(f"❌ Root endpoint error: {e}")

    # 3. Verify Seeding (Database connection check)
    try:
        db = SessionLocal()
        count = db.query(InterventionSuggestion).count()
        db.close()
        if count > 0:
            results.append(f"✅ Seeding verified: Found {count} interventions in the database.")
        else:
            results.append("❌ Seeding failed: Found 0 interventions in the database.")
    except Exception as e:
        results.append(f"❌ Database verification error: {e}")

    # Write results to file
    with open("backend_test_results.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(results))
    
    print("\n".join(results))

if __name__ == "__main__":
    run_tests()
