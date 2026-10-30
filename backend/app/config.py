"""
Application configuration – reads environment variables and provides
sensible defaults for local development.

WHY THIS FILE EXISTS:
  Centralising settings here means no other module needs to know where
  environment variables are stored.  It also makes it easy to switch
  between dev/prod configurations.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """All configurable knobs live here.

    Values come from environment variables or from a `.env` file in the
    project root (loaded automatically by pydantic-settings).
    """

    # -- Server --
    backend_port: int = 8080

    # -- Database --
    database_url: str = str(
        Path("/tmp/aaroh_saarthi.db")
        if os.getenv("VERCEL")
        else Path(__file__).resolve().parent.parent / "aaroh_saarthi.db"
    )

    # -- Data directory --
    data_dir: str = str(Path(__file__).resolve().parent / "data")

    # -- Chat --
    openai_api_key: str = ""
    xai_api_key: str = ""
    xai_model: str = "grok-3-mini"

    # -- CORS --
    frontend_origin: str = "http://localhost:5173"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


# Singleton so every module imports the same instance.
settings = Settings()
