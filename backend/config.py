"""Application Configuration

Manages environment variables and settings.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

# Get the directory where this config.py file lives
BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # API Settings
    API_TITLE: str = "Mesh Orchestration API"
    API_VERSION: str = "1.0.0"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:8000"]

    # OpenAI
    OPENAI_API_KEY: str = ""

    # Anthropic (optional)
    ANTHROPIC_API_KEY: str = ""

    # Database (optional)
    DATABASE_URL: str = "sqlite:///./mesh.db"

    # Redis (optional)
    REDIS_URL: str = "redis://localhost:6379"

    class Config:
        env_file = str(BASE_DIR / ".env")  # Absolute path to .env file
        case_sensitive = True


settings = Settings()

# Set environment variables for Vel's ProviderRegistry
# Vel requires these to be in os.environ, not just in pydantic Settings
if settings.OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY

if settings.ANTHROPIC_API_KEY:
    os.environ["ANTHROPIC_API_KEY"] = settings.ANTHROPIC_API_KEY
