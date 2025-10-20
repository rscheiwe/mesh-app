# Mesh Application - Monorepo

Multi-agent workflow orchestration system with React Flow frontend and FastAPI backend.

## Project Structure

```
mesh-app/
├── backend/          # FastAPI + Mesh orchestration
├── mesh-ui/          # React + Next.js frontend
├── SPEC/             # Architecture documentation
└── .env.example      # Environment variables template
```

## Prerequisites

- **Python 3.11+** for backend
- **Node.js 20+** for frontend (required for Vite 5)
- OpenAI API key (required)
- Anthropic API key (optional)

## Setup

### 1. Clone and Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
# Required: OPENAI_API_KEY
# Optional: ANTHROPIC_API_KEY
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies (includes mesh and vel from GitHub)
pip install -r requirements.txt

# Return to root
cd ..
```

**Note**: The backend installs two frameworks from GitHub:
- **Mesh**: Orchestration framework - https://github.com/rscheiwe/mesh
- **Vel**: Agent framework - https://github.com/rscheiwe/vel

Vel agents require API keys to be set in the `.env` file. The backend will automatically set these as environment variables for Vel's provider system.

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd mesh-ui

# Install dependencies
npm install

# Return to root
cd ..
```

## Running the Application

### Start Backend (Terminal 1)

```bash
cd backend
source venv/bin/activate  # If using virtual environment
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at:
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Start Frontend (Terminal 2)

```bash
cd mesh-ui
npm run dev
```

Frontend will be available at:
- **UI**: http://localhost:5173

**Note**: The frontend will automatically connect to the backend at `http://localhost:8000` and fetch:
- Available agents from `GET /api/agents`
- Available tools from `GET /api/tools`

These will appear in the left sidebar palette under "Available Agents" and "Available Tools".

### VS Code Debugging (Recommended)

If you're using VS Code, you can run the full stack application with debugging support:

1. Open the project in VS Code
2. Press `F5` or go to **Run and Debug** panel
3. Select **"Full Stack: Backend + Frontend"** from the dropdown
4. Click the green play button

This will start both services with debugger attached. You can set breakpoints in both Python and TypeScript code.

**Available launch configurations:**
- **Full Stack: Backend + Frontend** - Run both services (compound)
- **Backend: FastAPI** - Run backend only with debugger
- **Frontend: Next.js** - Run frontend only with debugger
- **Backend: FastAPI (Debug Mode)** - Run backend with verbose logging
- **Backend: pytest** - Debug backend tests

## API Endpoints

### Backend API

- `GET /health` - Health check and registry status
- `GET /api/agents` - List all registered agents
- `GET /api/tools` - List all registered tools
- `POST /api/execution/execute` - Execute graph (SSE streaming)
- `POST /api/execution/execute-sync` - Execute graph (synchronous)

### Available Agents

The backend includes the following pre-configured agents:

- **research_agent** - Research and information gathering
- **coding_agent** - Code generation and debugging
- **qa_agent** - Question answering
- **writer_agent** - Creative writing and content creation

### Available Tools

- **calculate_stats** - Statistical calculations on number arrays
- **sentiment_analyzer** - Text sentiment analysis
- **web_scraper** - Web scraping (placeholder)

## Sample Flows

The UI includes pre-built sample flows to get started quickly:

1. **Simple Writer** - Basic flow with a single writer agent
2. **Research to Writer** - Research a topic then write an article
3. **QA with Tool** - Answer questions using calculation tools
4. **Coding Assistant** - Generate code with a coding agent

Load samples using the dropdown in the header.

**Note**: End nodes are optional in Mesh - execution completes when there are no more nodes to process.

## Development

### Backend Development

```bash
cd backend

# Run with auto-reload
uvicorn backend.main:app --reload

# Run tests
pytest

# View API documentation
open http://localhost:8000/docs
```

### Frontend Development

```bash
cd mesh-ui

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run linting
npm run lint
```

## Adding New Agents

1. Create agent configuration file:
```bash
# Create new agent file
cat > backend/agents/my_agent.py << 'EOF'
from backend.config import settings

def create_my_agent():
    from vel import Agent as VelAgent
    return VelAgent(
        id="my_agent",
        model={"provider": "openai", "model": "gpt-4o"},
        instructions="Your agent instructions here"
    )
EOF
```

2. Register in `backend/agents/__init__.py`:
```python
from .my_agent import create_my_agent
__all__ = [..., "create_my_agent"]
```

3. Register in `backend/registry.py`:
```python
my_agent = create_my_agent()
registry.register_agent("my_agent", my_agent)
```

4. Restart backend - frontend will automatically see the new agent via `/api/agents`

## Adding New Tools

1. Add tool function to `backend/tools/__init__.py`:
```python
def my_custom_tool(input_data: Any) -> Dict[str, Any]:
    """Tool description."""
    # Implementation
    return {"result": "..."}
```

2. Register in `get_all_tools()`:
```python
return {
    # ...existing tools
    "my_custom_tool": my_custom_tool,
}
```

3. Restart backend - frontend will automatically see the new tool via `/api/tools`

## Environment Variables

See `.env.example` for all available configuration options:

```bash
# Backend
OPENAI_API_KEY=sk-...              # Required
ANTHROPIC_API_KEY=sk-ant-...       # Optional
DATABASE_URL=sqlite:///./mesh.db   # Optional
REDIS_URL=redis://localhost:6379   # Optional

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# CORS (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

## Troubleshooting

### Backend won't start

**Error**: `ModuleNotFoundError: No module named 'mesh'` or `No module named 'vel'`

**Solution**:
```bash
cd backend
pip install git+https://github.com/rscheiwe/mesh.git@main
pip install git+https://github.com/rscheiwe/vel.git@main
```

**Error**: `Provider 'openai' not found. Available: []`

**Solution**:
- Ensure you have created a `.env` file with your API keys (see step 1 in Setup)
- Verify `OPENAI_API_KEY` is set in `.env` file
- The backend automatically sets these as environment variables for Vel's provider system
- Check backend logs to confirm: "✓ OpenAI provider registered"

### Frontend can't connect to backend

**Error**: `Failed to fetch: CORS policy`

**Solution**:
- Ensure backend is running on port 8000
- Check `CORS_ORIGINS` in `.env` includes `http://localhost:5173`
- Verify `NEXT_PUBLIC_API_URL` is set correctly

### No agents showing in frontend

**Solution**:
- Check backend logs for agent registration errors
- Ensure at least one agent library is installed (vel-ai or openai-agents-sdk)
- Visit http://localhost:8000/api/agents to verify agents are registered

## Documentation

- **Architecture**: See [SPEC/MONOREPO_ARCHITECTURE.md](SPEC/MONOREPO_ARCHITECTURE.md)
- **API Docs**: http://localhost:8000/docs (when backend is running)

## Tech Stack

### Backend
- **FastAPI** - Web framework
- **Mesh** - Agent orchestration
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **Next.js** - React framework
- **React Flow** - Visual graph editor
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## License

MIT
