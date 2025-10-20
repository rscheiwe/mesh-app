"""Agents API Endpoints

Handles listing available agents.
"""

from fastapi import APIRouter, HTTPException, Request
from backend.models.responses import AgentInfo

router = APIRouter()


@router.get("")
async def list_agents(request: Request):
    """List all registered agents.

    Frontend can use this to populate agent selection dropdowns.

    Returns:
        Dict with list of agent info

    Raises:
        HTTPException: If registry not initialized
    """
    if not hasattr(request.app.state, "registry") or not request.app.state.registry:
        raise HTTPException(status_code=503, detail="Registry not initialized")

    registry = request.app.state.registry
    agents = []

    for agent_id in registry.list_agents():
        agent = registry.get_agent(agent_id)

        # Detect agent type
        agent_module = agent.__class__.__module__.lower()
        if "vel" in agent_module:
            agent_type = "vel"
        elif "agents" in agent_module:
            agent_type = "openai"
        else:
            agent_type = "custom"

        agents.append(
            AgentInfo(
                id=agent_id,
                name=agent_id.replace("_", " ").title(),
                type=agent_type,
                description=f"{agent_type.upper()} agent instance"
            )
        )

    return {"agents": agents}
