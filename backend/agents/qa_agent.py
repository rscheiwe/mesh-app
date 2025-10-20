"""QA Agent Configuration

This agent is optimized for answering questions clearly and concisely.
"""

from backend.config import settings


def create_qa_agent():
    """Create a QA-focused agent.

    Returns:
        VelAgent or OpenAIAgent: Configured QA agent
    """
    # Try Vel first
    try:
        from vel import Agent as VelAgent

        return VelAgent(
            id="qa",
            model={
                "provider": "openai",
                "model": "gpt-4o",
                "api_key": settings.OPENAI_API_KEY,  # Explicit API key
                "temperature": 0.5,
            },
        )
    except ImportError:
        pass

    # Fallback to OpenAI Agents SDK
    try:
        from agents import Agent as OpenAIAgent

        return OpenAIAgent(
            name="QA Agent",
            instructions=(
                "You are a helpful QA assistant that answers questions clearly and concisely. "
                "Provide accurate information and admit when you don't know something."
            ),
        )
    except ImportError:
        raise ImportError("Neither 'vel' nor 'agents' package is available for creating QA agent")
