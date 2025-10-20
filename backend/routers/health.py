"""Health Check Endpoints

Handles health check and status monitoring.
"""

from fastapi import APIRouter, Request
from datetime import datetime

router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    """Health check endpoint.

    Returns:
        Dict with status, timestamp, and registry info
    """
    registry = request.app.state.registry if hasattr(request.app.state, "registry") else None

    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "registry": {
            "agents": len(registry.list_agents()) if registry else 0,
            "tools": len(registry.list_tools()) if registry else 0,
        }
    }
