"""Mesh Backend API - Main Application Entry Point

This is the FastAPI application that serves as the backend for your Mesh UI.
It manages agent instances, parses React Flow JSON, and executes graphs.

Run:
    uvicorn backend.main:app --reload

Or with Docker:
    docker-compose up backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.registry import create_registry
from backend.routers import agents, tools, execution, health, nodes, chat
from backend.middleware.error_handler import add_error_handlers
from backend.config import settings


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    # Startup
    print("🚀 Starting Mesh Backend API...")

    # Create and populate registry
    app.state.registry = create_registry()
    print(f"✅ Registry initialized: {len(app.state.registry.list_agents())} agents")

    yield

    # Shutdown
    print("👋 Shutting down Mesh Backend API...")


# Create FastAPI application
app = FastAPI(
    title="Mesh Orchestration API",
    description="Multi-agent workflow execution engine with React Flow integration",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom error handlers
add_error_handlers(app)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(tools.router, prefix="/api/tools", tags=["tools"])
app.include_router(execution.router, prefix="/api/execution", tags=["execution"])
app.include_router(nodes.router, prefix="/api/nodes", tags=["nodes"])
app.include_router(chat.router, prefix="/api", tags=["chat"])


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Mesh Orchestration API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
