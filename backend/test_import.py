import sys
import os

# Make sure we're in the right directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.main import app
    print("SUCCESS: Backend loaded without errors!")
    print(f"App title: {app.title}")
    print(f"App version: {app.version}")
    print(f"\nRegistered Routes:")
    for route in app.routes:
        if hasattr(route, 'methods'):
            print(f"  {', '.join(route.methods):8s} {route.path}")
    print("\nAll systems nominal. Backend is ready to run.")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
