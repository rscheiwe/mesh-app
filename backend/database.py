"""Database connection utilities for mesh-app backend."""

from typing import Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool

from backend.config import settings


class DatabaseConfig:
    """Database configuration from environment variables."""

    def __init__(self):
        self.database_url = settings.DATABASE_URL
        if not self.database_url:
            raise ValueError("DATABASE_URL not set in environment")

    @property
    def engine(self):
        """Get SQLAlchemy engine."""
        return create_engine(
            self.database_url,
            pool_pre_ping=True,
            poolclass=NullPool,  # Don't pool connections for now
        )

    def get_session(self) -> Session:
        """Get database session."""
        SessionLocal = sessionmaker(bind=self.engine)
        return SessionLocal()


# Global database config instance
_db_config: Optional[DatabaseConfig] = None


def get_db_config() -> DatabaseConfig:
    """Get or create database config singleton."""
    global _db_config
    if _db_config is None:
        _db_config = DatabaseConfig()
    return _db_config


def get_db_session() -> Session:
    """Get database session for dependency injection."""
    config = get_db_config()
    return config.get_session()
