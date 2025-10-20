"""Research Agent Configuration

This agent is optimized for research tasks with web search capabilities.
"""

from backend.config import settings


def create_research_agent():
    """Create a research-focused agent with web search tools.

    Returns:
        VelAgent or OpenAIAgent: Configured research agent
    """
    # Try Vel first
    try:
        from vel import Agent as VelAgent

        return VelAgent(
            id="research",
            model={
                "provider": "openai",
                "model": "gpt-4o",
                "api_key": settings.OPENAI_API_KEY,  # Explicit API key
                "temperature": 0.7,
            },
        )
    except ImportError:
        pass

    # Fallback to OpenAI Agents SDK
    try:
        from agents import Agent as OpenAIAgent

        return OpenAIAgent(
            name="Research Agent",
            instructions=(
                "You are a research assistant specializing in gathering accurate information. "
                "Always cite your sources and provide well-researched answers. "
                "Break down complex topics into clear explanations."
            ),
        )
    except ImportError:
        raise ImportError("Neither 'vel' nor 'agents' package is available for creating research agent")
