"""Request Models

Pydantic models for API request validation.
"""

from pydantic import BaseModel
from typing import Dict, Any, Optional


class ExecuteRequest(BaseModel):
    """Request to execute a graph with streaming."""
    flow: Dict[str, Any]  # React Flow JSON
    input: str  # User input message
    session_id: Optional[str] = None


class ExecuteSyncRequest(BaseModel):
    """Request to execute a graph synchronously."""
    flow: Dict[str, Any]  # React Flow JSON
    input: str  # User input message
    session_id: Optional[str] = None
