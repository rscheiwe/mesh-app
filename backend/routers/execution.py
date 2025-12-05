"""Execution API Endpoints

Handles graph execution requests from the frontend.
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
import json
from datetime import datetime

from mesh import ReactFlowParser, Executor, ExecutionContext, MemoryBackend
from mesh.nodes import RAGNode, DataHandlerNode, ToolNode
from backend.models.requests import ExecuteRequest, ExecuteSyncRequest
from backend.models.responses import ExecutionResult
from backend.rag_retriever_temp import create_rag_retriever
from backend.database import get_db_session
from backend.loaders.node_loader import load_node_from_db, execute_tool_code


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
        # Create flow loader for subflow expansion
        def create_flow_loader(user_id: int = 129617):
            """Create a flow loader function for subflow expansion."""
            def load_flow(flow_uuid: str, version: int = None):
                """Load flow definition from database."""
                load_session = get_db_session()
                try:
                    from sqlalchemy import text
                    if version:
                        query = text("""
                            SELECT nodes, edges, viewport
                            FROM mosaic_agent_flow
                            WHERE agent_uuid = :flow_uuid
                            AND user_id = :user_id
                            AND version = :version
                        """)
                        result = load_session.execute(query, {
                            "flow_uuid": flow_uuid,
                            "user_id": user_id,
                            "version": version
                        })
                    else:
                        query = text("""
                            SELECT nodes, edges, viewport
                            FROM mosaic_agent_flow
                            WHERE agent_uuid = :flow_uuid
                            AND user_id = :user_id
                            ORDER BY version DESC, id DESC
                            LIMIT 1
                        """)
                        result = load_session.execute(query, {
                            "flow_uuid": flow_uuid,
                            "user_id": user_id
                        })

                    record = result.fetchone()
                    if not record:
                        return None

                    record_dict = dict(record._mapping)

                    # Parse JSON fields
                    nodes = record_dict.get('nodes', '[]')
                    if isinstance(nodes, str):
                        nodes = json.loads(nodes)

                    edges = record_dict.get('edges', '[]')
                    if isinstance(edges, str):
                        edges = json.loads(edges)

                    viewport = record_dict.get('viewport', '{}')
                    if isinstance(viewport, str):
                        viewport = json.loads(viewport)

                    return {
                        "nodes": nodes,
                        "edges": edges,
                        "viewport": viewport,
                    }
                finally:
                    load_session.close()

            return load_flow

        parser = ReactFlowParser(registry, flow_loader=create_flow_loader())
        graph = parser.parse(request.flow)

        # Inject dependencies into special nodes
        try:
            # RAG retriever for RAGNode
            rag_retriever = create_rag_retriever()  # Uses DATABASE_URL and OPENAI_API_KEY from .env
            for node in graph.nodes.values():
                if isinstance(node, RAGNode):
                    node.set_retriever(rag_retriever)
        except Exception as e:
            # Log but don't fail if RAG not configured
            print(f"Warning: RAG retriever not available: {e}")

        # DB session getter for DataHandlerNode
        def get_db_session_for_source(source: str):
            """Get database session for given source."""
            # For now, all sources use the same connection
            # In production, map to different databases
            return get_db_session()

        for node in graph.nodes.values():
            if isinstance(node, DataHandlerNode):
                node.set_db_session_getter(get_db_session_for_source)

        # Load tools from DB and inject into ToolNodes
        # This is where mesh-app backend loads DB-backed tools
        session = get_db_session()
        try:
            for node in graph.nodes.values():
                if isinstance(node, ToolNode):
                    # Check if node has toolUuid in config (needs DB loading)
                    tool_uuid = node.config.get('toolUuid')
                    if tool_uuid:
                        # Load tool from database
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
                                # Use helper to execute tool code and extract function
                                tool_fn = execute_tool_code(
                                    code=record_dict.get('code', ''),
                                    imports=record_dict.get('imports', '[]'),
                                    func_name=record_dict.get('name')
                                )
                                # Inject the tool function
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
                "type": "error",
                "errorText": str(e),
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

    # Inject DB session getter into registry for on-demand tool loading
    registry.db_session_getter = get_db_session

    try:
        # Create flow loader for subflow expansion
        def create_flow_loader_sync(user_id: int = 129617):
            """Create a flow loader function for subflow expansion."""
            def load_flow(flow_uuid: str, version: int = None):
                """Load flow definition from database."""
                load_session = get_db_session()
                try:
                    from sqlalchemy import text
                    if version:
                        query = text("""
                            SELECT nodes, edges, viewport
                            FROM mosaic_agent_flow
                            WHERE agent_uuid = :flow_uuid
                            AND user_id = :user_id
                            AND version = :version
                        """)
                        result = load_session.execute(query, {
                            "flow_uuid": flow_uuid,
                            "user_id": user_id,
                            "version": version
                        })
                    else:
                        query = text("""
                            SELECT nodes, edges, viewport
                            FROM mosaic_agent_flow
                            WHERE agent_uuid = :flow_uuid
                            AND user_id = :user_id
                            ORDER BY version DESC, id DESC
                            LIMIT 1
                        """)
                        result = load_session.execute(query, {
                            "flow_uuid": flow_uuid,
                            "user_id": user_id
                        })

                    record = result.fetchone()
                    if not record:
                        return None

                    record_dict = dict(record._mapping)

                    # Parse JSON fields
                    nodes = record_dict.get('nodes', '[]')
                    if isinstance(nodes, str):
                        nodes = json.loads(nodes)

                    edges = record_dict.get('edges', '[]')
                    if isinstance(edges, str):
                        edges = json.loads(edges)

                    viewport = record_dict.get('viewport', '{}')
                    if isinstance(viewport, str):
                        viewport = json.loads(viewport)

                    return {
                        "nodes": nodes,
                        "edges": edges,
                        "viewport": viewport,
                    }
                finally:
                    load_session.close()

            return load_flow

        # Parse and execute
        parser = ReactFlowParser(registry, flow_loader=create_flow_loader_sync())
        graph = parser.parse(request.flow)

        # Inject dependencies into special nodes
        try:
            # RAG retriever for RAGNode
            rag_retriever = create_rag_retriever()  # Uses DATABASE_URL and OPENAI_API_KEY from .env
            for node in graph.nodes.values():
                if isinstance(node, RAGNode):
                    node.set_retriever(rag_retriever)
        except Exception as e:
            # Log but don't fail if RAG not configured
            print(f"Warning: RAG retriever not available: {e}")

        # DB session getter for DataHandlerNode
        def get_db_session_for_source(source: str):
            """Get database session for given source."""
            # For now, all sources use the same connection
            # In production, map to different databases
            return get_db_session()

        for node in graph.nodes.values():
            if isinstance(node, DataHandlerNode):
                node.set_db_session_getter(get_db_session_for_source)

        # Load tools from DB and inject into ToolNodes
        # This is where mesh-app backend loads DB-backed tools
        session = get_db_session()
        try:
            for node in graph.nodes.values():
                if isinstance(node, ToolNode):
                    # Check if node has toolUuid in config (needs DB loading)
                    tool_uuid = node.config.get('toolUuid')
                    if tool_uuid:
                        # Load tool from database
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
                                # Use helper to execute tool code and extract function
                                tool_fn = execute_tool_code(
                                    code=record_dict.get('code', ''),
                                    imports=record_dict.get('imports', '[]'),
                                    func_name=record_dict.get('name')
                                )
                                # Inject the tool function
                                node.set_tool_function(tool_fn)
                            except Exception as e:
                                print(f"Warning: Failed to load tool '{tool_uuid}': {e}")
                        else:
                            print(f"Warning: Tool {tool_uuid} not found in database")
        finally:
            session.close()

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
