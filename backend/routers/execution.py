"""Execution API Endpoints

Handles graph execution requests from the frontend.
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
import json
from datetime import datetime

from mesh import ReactFlowParser, Executor, ExecutionContext, MemoryBackend
from backend.models.requests import ExecuteRequest, ExecuteSyncRequest
from backend.models.responses import ExecutionResult


router = APIRouter()


@router.post("/execute")
async def execute_graph(request: ExecuteRequest, req: Request):
    """Execute a graph from React Flow JSON with SSE streaming.

    Args:
        request: ExecuteRequest with flow JSON and input
        req: FastAPI Request object (to access app state)

    Returns:
        StreamingResponse: SSE stream of execution events

    Raises:
        HTTPException: If parsing or execution fails
    """
    if not hasattr(req.app.state, "registry") or not req.app.state.registry:
        raise HTTPException(status_code=503, detail="Registry not initialized")

    registry = req.app.state.registry

    # Parse React Flow JSON
    try:
        parser = ReactFlowParser(registry)
        graph = parser.parse(request.flow)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse graph: {str(e)}"
        )

    # Create execution context
    session_id = request.session_id or f"session-{datetime.now().timestamp()}"
    context = ExecutionContext(
        graph_id=request.flow.get("id", "react-flow-graph"),
        session_id=session_id,
        chat_history=[],
        variables={},
        state={},
    )

    # Execute with streaming
    executor = Executor(graph, MemoryBackend())

    async def event_stream():
        """Stream execution events as SSE."""
        try:
            async for event in executor.execute(request.input, context):
                # Convert event to dict (use to_dict() method to get all fields)
                event_data = event.to_dict()

                # Filter out None values
                event_data = {k: v for k, v in event_data.items() if v is not None}

                # Yield as SSE
                yield f"data: {json.dumps(event_data)}\n\n"

        except Exception as e:
            error_event = {
                "type": "execution_error",
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
            }
            yield f"data: {json.dumps(error_event)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/execute-sync", response_model=ExecutionResult)
async def execute_graph_sync(request: ExecuteSyncRequest, req: Request):
    """Execute a graph and return complete result (non-streaming).

    Args:
        request: ExecuteSyncRequest with flow JSON and input
        req: FastAPI Request object

    Returns:
        ExecutionResult: Complete execution result with all events

    Raises:
        HTTPException: If parsing or execution fails
    """
    if not hasattr(req.app.state, "registry") or not req.app.state.registry:
        raise HTTPException(status_code=503, detail="Registry not initialized")

    registry = req.app.state.registry

    try:
        # Parse and execute
        parser = ReactFlowParser(registry)
        graph = parser.parse(request.flow)

        session_id = request.session_id or f"session-{datetime.now().timestamp()}"
        context = ExecutionContext(
            graph_id=request.flow.get("id", "react-flow-graph"),
            session_id=session_id,
            chat_history=[],
            variables={},
            state={},
        )

        executor = Executor(graph, MemoryBackend())

        # Collect all events
        events = []
        final_output = None

        async for event in executor.execute(request.input, context):
            # Use to_dict() to get all event fields including raw_event
            event_dict = event.to_dict()
            events.append(event_dict)

            if event.type == "execution_complete":
                final_output = event.output

        return ExecutionResult(
            success=True,
            output=final_output,
            events=events,
            session_id=session_id,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Execution failed: {str(e)}"
        )
