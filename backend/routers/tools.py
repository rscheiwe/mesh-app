"""Tools API Endpoints

Handles listing available tools.
"""

from fastapi import APIRouter, HTTPException, Request
from backend.models.responses import ToolInfo

router = APIRouter()


@router.get("")
async def list_tools(request: Request):
    """List all registered tools.

    Frontend can use this to populate tool selection dropdowns.

    Returns:
        Dict with list of tool info

    Raises:
        HTTPException: If registry not initialized
    """
    if not hasattr(request.app.state, "registry") or not request.app.state.registry:
        raise HTTPException(status_code=503, detail="Registry not initialized")

    registry = request.app.state.registry
    tools = []

    for tool_id in registry.list_tools():
        tool_fn = registry.get_tool(tool_id)

        tools.append(
            ToolInfo(
                id=tool_id,
                name=tool_id.replace("_", " ").title(),
                description=tool_fn.__doc__ or "No description available"
            )
        )

    return {"tools": tools}
