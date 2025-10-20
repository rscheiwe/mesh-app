"""Response Models

Pydantic models for API response serialization.
"""

from pydantic import BaseModel
from typing import Dict, Any, List, Optional


class AgentInfo(BaseModel):
    """Information about a registered agent."""
    id: str
    name: str
    type: str  # "vel", "openai", or "custom"
    description: Optional[str] = None


class ToolInfo(BaseModel):
    """Information about a registered tool."""
    id: str
    name: str
    description: Optional[str] = None


class ExecutionEvent(BaseModel):
    """Execution event from graph execution."""
    type: str
    node_id: Optional[str] = None
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ExecutionResult(BaseModel):
    """Complete execution result for synchronous execution."""
    success: bool
    output: Optional[Any] = None
    events: List[Dict[str, Any]] = []
    session_id: str
