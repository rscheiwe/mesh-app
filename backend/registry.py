"""Agent Templates Registry

This module creates and populates the NodeRegistry with pre-configured agent templates.
These templates provide quick-start agents that users can select in the UI.

Users can also:
- Create inline agents via React Flow (provider/modelName/tools config)
- Attach tools dynamically:
  * Via inline tools array in agent config
  * Via standalone ToolNode loaded from database
- Configure agents at runtime without using templates

Add new agent templates:
    1. Create agent config in backend/agents/my_agent.py
    2. Import and register here
    3. Frontend will automatically see it via GET /api/agents

Note: Tools are NO LONGER registered here. Instead:
- Agent tools: Configured on agent creation or via inline tools array
- Standalone tools: Loaded from DB when ToolNode is used (see execution.py)
"""

from mesh import NodeRegistry
from backend.agents import (
    create_research_agent,
    create_coding_agent,
    create_qa_agent,
    create_writer_agent,
)


def create_registry() -> NodeRegistry:
    """Create registry with pre-configured agent templates.

    This registry stores reusable agent templates only. Tools are handled separately:
    - Agent-attached tools: Part of VelAgent configuration
    - Standalone tools: Loaded from DB on-demand (see execution.py)
    - Inline tools: Defined in React Flow JSON, parsed by ReactFlowParser

    Returns:
        NodeRegistry: Configured registry with agent templates
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

    # Register agent templates
    print("📝 Registering agent templates...")

    try:
        research_agent = create_research_agent()
        registry.register_agent("research_agent", research_agent)
        print("  ✓ research_agent template")
    except Exception as e:
        print(f"  ⚠️  Failed to register research_agent: {e}")

    try:
        coding_agent = create_coding_agent()
        registry.register_agent("coding_agent", coding_agent)
        print("  ✓ coding_agent template")
    except Exception as e:
        print(f"  ⚠️  Failed to register coding_agent: {e}")

    try:
        qa_agent = create_qa_agent()
        registry.register_agent("qa_agent", qa_agent)
        print("  ✓ qa_agent template")
    except Exception as e:
        print(f"  ⚠️  Failed to register qa_agent: {e}")

    try:
        writer_agent = create_writer_agent()
        registry.register_agent("writer_agent", writer_agent)
        print("  ✓ writer_agent template")
    except Exception as e:
        print(f"  ⚠️  Failed to register writer_agent: {e}")

    print(f"\n✅ Registry ready: {len(registry.list_agents())} agent templates")
    print("   Tools are handled dynamically (inline or DB-loaded)\n")

    return registry
