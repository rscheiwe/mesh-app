"""Chat API Endpoints for AI SDK Integration

Provides AI SDK compatible streaming endpoints for chat interfaces.
Wraps Mesh graph execution in AI SDK format for useChat hook.
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
import json
from datetime import datetime

from mesh import ReactFlowParser, Executor, ExecutionContext, MemoryBackend
from mesh.nodes import RAGNode, DataHandlerNode, ToolNode
from mesh.core.events import EventType
from backend.models.requests import ExecuteRequest
from backend.rag_retriever_temp import create_rag_retriever
from backend.database import get_db_session
from backend.loaders.node_loader import execute_tool_code


router = APIRouter()


@router.post("/chat/stream")
async def chat_stream(request: ExecuteRequest, req: Request):
    """Execute graph and stream in AI SDK format for useChat hook.

    This endpoint wraps /api/execution/execute and formats events
    for the Vercel AI SDK useChat hook. Events are already AI SDK
    compatible from Mesh, we just ensure proper formatting.

    Args:
        request: ExecuteRequest with flow JSON and input
        req: FastAPI Request object (to access app state)

    Returns:
        StreamingResponse: AI SDK formatted event stream

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

        # Inject dependencies into special nodes
        try:
            rag_retriever = create_rag_retriever()
            for node in graph.nodes.values():
                if isinstance(node, RAGNode):
                    node.set_retriever(rag_retriever)
        except Exception as e:
            print(f"Warning: RAG retriever not available: {e}")

        # DB session getter for DataHandlerNode
        def get_db_session_for_source(source: str):
            return get_db_session()

        for node in graph.nodes.values():
            if isinstance(node, DataHandlerNode):
                node.set_db_session_getter(get_db_session_for_source)

        # Load tools from DB and inject into ToolNodes
        session = get_db_session()
        try:
            for node in graph.nodes.values():
                if isinstance(node, ToolNode):
                    tool_uuid = node.config.get('toolUuid')
                    if tool_uuid:
                        from sqlalchemy import text
                        query = text("""
                            SELECT node_uuid, code, imports, name, type
                            FROM mosaic_agent_tool_nodes
                            WHERE node_uuid = :tool_uuid AND active = true
                        """)
                        result = session.execute(query, {"tool_uuid": tool_uuid})
                        record = result.fetchone()

                        if record:
                            record_dict = dict(record._mapping)
                            try:
                                tool_fn = execute_tool_code(
                                    code=record_dict.get('code', ''),
                                    imports=record_dict.get('imports', '[]'),
                                    func_name=record_dict.get('name')
                                )
                                node.set_tool_function(tool_fn)
                            except Exception as e:
                                print(f"Warning: Failed to load tool '{tool_uuid}': {e}")
                        else:
                            print(f"Warning: Tool {tool_uuid} not found in database")
        finally:
            session.close()

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
        """Stream execution events in AI SDK format.

        Mesh events are already AI SDK compatible:
        - Standard events (text-delta, finish, error, etc.) pass through
        - Mesh-specific events are prefixed with 'data-' for onData callback
        """
        try:
            has_sent_finish = False

            async for event in executor.execute(request.input, context):
                # Convert event to dict
                event_data = event.to_dict()

                # Filter out None values
                event_data = {k: v for k, v in event_data.items() if v is not None}

                event_type = event_data.get('type')

                # Track if agent sent finish
                if event_type == 'finish':
                    has_sent_finish = True

                # Handle execution complete
                elif event_type == 'data-execution-complete':
                    # Send the data event
                    yield f"data: {json.dumps(event_data)}\n\n"
                    # Don't send finish - agent already sent it
                    has_sent_finish = True
                    break

                # Handle errors
                elif event_type in ['data-execution-error', 'data-node-error']:
                    yield f"data: {json.dumps(event_data)}\n\n"
                    error_msg = event_data.get('data', {}).get('errorText', event_data.get('errorText', 'Unknown error'))
                    yield f"data: {json.dumps({'type': 'error', 'errorText': error_msg})}\n\n"
                    has_sent_finish = True
                    break

                # Pass through all events as-is (AI SDK compatible)
                else:
                    yield f"data: {json.dumps(event_data)}\n\n"

            # Send finish event if not already sent (e.g., no agent in graph)
            if not has_sent_finish:
                yield f"data: {json.dumps({'type': 'finish'})}\n\n"

            # Send [DONE] marker
            yield f"data: [DONE]\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'errorText': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
