import sys
from pathlib import Path

# Add backend directory to sys.path so app module is discoverable on Vercel
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app

# Vercel serves the FastAPI application through this catch-all function.
app = app
