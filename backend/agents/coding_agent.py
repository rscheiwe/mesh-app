"""Coding Agent Configuration

This agent is optimized for code generation and debugging.
"""

from backend.config import settings


def create_coding_agent():
    """Create a coding-focused agent.

    Returns:
        VelAgent or OpenAIAgent: Configured coding agent
    """
    # Try Vel first
    try:
        from vel import Agent as VelAgent

        return VelAgent(
            id="coder",
            model={
                "provider": "openai",
                "model": "gpt-4o",
                "api_key": settings.OPENAI_API_KEY,  # Explicit API key
                "temperature": 0.2,
            },
        )
    except ImportError:
        pass

    # Fallback to OpenAI Agents SDK
    try:
        from agents import Agent as OpenAIAgent

        return OpenAIAgent(
            name="Coding Agent",
            instructions=(
                "You are a coding assistant specializing in writing clean, efficient code. "
                "Always follow best practices and provide clear explanations. "
                "Focus on readability and maintainability."
            ),
        )
    except ImportError:
        raise ImportError("Neither 'vel' nor 'agents' package is available for creating coding agent")
