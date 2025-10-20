"""Agent and Tool Registry Configuration

This module creates and populates the NodeRegistry with all your agents
and tools. Agents are instantiated once at startup and reused across requests.

Add new agents:
    1. Create agent config in backend/agents/my_agent.py
    2. Import and register here
    3. Frontend will automatically see it via GET /api/agents
"""

from mesh import NodeRegistry
from backend.agents import (
    create_research_agent,
    create_coding_agent,
    create_qa_agent,
    create_writer_agent,
)
from backend.tools import get_all_tools
from backend.config import settings


def create_registry() -> NodeRegistry:
    """Create and populate registry with all agents and tools.

    Returns:
        NodeRegistry: Configured registry with all agents and tools
    """
    registry = NodeRegistry()

    # Check Vel providers
    print("🔍 Checking Vel providers...")
    try:
        from vel.providers import ProviderRegistry
        vel_registry = ProviderRegistry.default()
        available_providers = vel_registry.available()
        if available_providers:
            for provider in available_providers:
                print(f"  ✓ {provider} provider registered")
        else:
            print("  ⚠️  No Vel providers registered. Check that API keys are set in .env")
    except Exception as e:
        print(f"  ⚠️  Could not check Vel providers: {e}")

    # Register agents
    print("📝 Registering agents...")

    try:
        research_agent = create_research_agent()
        registry.register_agent("research_agent", research_agent)
        print("  ✓ research_agent")
    except Exception as e:
        print(f"  ⚠️  Failed to register research_agent: {e}")

    try:
        coding_agent = create_coding_agent()
        registry.register_agent("coding_agent", coding_agent)
        print("  ✓ coding_agent")
    except Exception as e:
        print(f"  ⚠️  Failed to register coding_agent: {e}")

    try:
        qa_agent = create_qa_agent()
        registry.register_agent("qa_agent", qa_agent)
        print("  ✓ qa_agent")
    except Exception as e:
        print(f"  ⚠️  Failed to register qa_agent: {e}")

    try:
        writer_agent = create_writer_agent()
        registry.register_agent("writer_agent", writer_agent)
        print("  ✓ writer_agent")
    except Exception as e:
        print(f"  ⚠️  Failed to register writer_agent: {e}")

    # Register tools
    print("🔧 Registering tools...")
    tools = get_all_tools()

    for tool_name, tool_fn in tools.items():
        registry.register_tool(tool_name, tool_fn)
        print(f"  ✓ {tool_name}")

    print(f"\n✅ Registry ready: {len(registry.list_agents())} agents, {len(registry.list_tools())} tools\n")

    return registry
