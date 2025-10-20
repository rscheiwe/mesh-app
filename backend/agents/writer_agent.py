"""Writer Agent Configuration

This agent is optimized for creative writing and content creation.
"""

from backend.config import settings


def create_writer_agent():
    """Create a writer-focused agent.

    Returns:
        VelAgent or OpenAIAgent: Configured writer agent
    """
    # Try Vel first
    try:
        from vel import Agent as VelAgent

        return VelAgent(
            id="writer",
            model={
                "provider": "openai",
                "model": "gpt-4o",
                "api_key": settings.OPENAI_API_KEY,  # Explicit API key
                "temperature": 0.8,
            },
        )
    except ImportError:
        pass

    # Fallback to OpenAI Agents SDK
    try:
        from agents import Agent as OpenAIAgent

        return OpenAIAgent(
            name="Writer",
            instructions=(
                "You are a creative writer who crafts engaging content. "
                "Focus on storytelling, clarity, and engaging the reader."
            ),
        )
    except ImportError:
        raise ImportError("Neither 'vel' nor 'agents' package is available for creating writer agent")
