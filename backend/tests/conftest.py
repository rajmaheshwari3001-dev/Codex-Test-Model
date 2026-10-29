"""
Shared test fixtures.

The TestClient for FastAPI triggers the lifespan context manager,
but we need to ensure the data directory is accessible from the
test working directory.
"""

import os
import sys
from pathlib import Path

# Ensure the backend package is importable.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Set the data directory explicitly for tests so data_loader can find CSVs.
os.environ["DATA_DIR"] = str(
    Path(__file__).resolve().parent.parent / "app" / "data"
)
os.environ["DATABASE_URL"] = ":memory:"
