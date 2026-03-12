import sys
import os

# Ensure the root directory and backend directory are in sys.path
root_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, root_dir)

print(f"Python version: {sys.version}")
print(f"Current working directory: {os.getcwd()}")
print(f"Sys path: {sys.path}")

try:
    print("Attempting to import app components...")
    from backend.app import main, models, schemas, database, config
    from backend.app.routers import auth, sessions, events, chat, exercises, analytics
    print("✅ Successfully imported all backend modules.")
except ImportError as e:
    print(f"❌ Import failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"❌ An error occurred: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
