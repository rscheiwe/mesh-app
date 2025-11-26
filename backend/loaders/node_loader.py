"""Node loader for loading custom nodes from database."""

from typing import Dict, Any, List, Optional
import json
from sqlalchemy import text
from sqlalchemy.orm import Session

from mesh.nodes import DataHandlerNode, ToolNode


def load_nodes_from_database(user_id: int, session: Session) -> Dict[str, Any]:
    """Load user's custom nodes from database.

    Args:
        user_id: User ID to filter nodes
        session: Database session

    Returns:
        Dictionary mapping node_uuid to node instances
    """
    # Query all active nodes for user
    query = text("""
        SELECT
            node_uuid, user_id, code, imports, label, name, version,
            type, icon, category, description, base_classes,
            inputs, outputs, credential, file_path, active,
            is_used, is_public, language, is_verified, args
        FROM mosaic_agent_tool_nodes
        WHERE user_id = :user_id
        AND active = true
        ORDER BY created_at DESC
    """)

    result = session.execute(query, {"user_id": user_id})
    records = result.fetchall()

    nodes = {}
    for record in records:
        record_dict = dict(record._mapping)
        try:
            node = load_node_from_db(record_dict)
            nodes[record_dict['node_uuid']] = node
        except Exception as e:
            print(f"Warning: Failed to load node {record_dict['name']}: {e}")

    return nodes


def load_node_from_db(record: Dict[str, Any]):
    """Load node from mosaic_agent_tool_nodes record.

    Args:
        record: Database record dict

    Returns:
        DataHandlerNode or ToolNode instance
    """
    node_type = record.get('type', 'Tool')
    node_uuid = str(record['node_uuid'])

    if node_type == 'DataHandler':
        return _load_data_handler(record)
    elif node_type == 'Tool':
        return _load_tool(record)
    else:
        raise ValueError(f"Unknown node type: {node_type}")


def _load_data_handler(record: Dict[str, Any]) -> DataHandlerNode:
    """Load DataHandlerNode from DB record."""
    inputs = record.get('inputs', [])
    if isinstance(inputs, str):
        inputs = json.loads(inputs)

    # Extract config from inputs
    db_source = None
    query = None
    params = {}

    for inp in inputs:
        name = inp.get('name')
        default = inp.get('default')

        if name == 'db_source':
            db_source = default
        elif name == 'query':
            query = default
        elif name == 'params':
            if isinstance(default, str):
                try:
                    params = json.loads(default) if default else {}
                except json.JSONDecodeError:
                    params = {}
            else:
                params = default or {}

    if not db_source or not query:
        raise ValueError(
            f"DataHandler '{record['name']}' missing db_source or query"
        )

    return DataHandlerNode(
        id=record['node_uuid'],
        db_source=db_source,
        query=query,
        params=params,
    )


def execute_tool_code(code: str, imports: Any, func_name: str):
    """Execute Python code to extract tool function.

    Args:
        code: Python code defining the tool function
        imports: List of import statements (or JSON string)
        func_name: Name of the function to extract

    Returns:
        Callable tool function

    Raises:
        ValueError: If function not found in code
    """
    if isinstance(imports, str):
        imports = json.loads(imports)

    # Import dependencies
    for imp in imports:
        exec(imp)

    # Execute code to get function
    namespace = {}
    exec(code, namespace)

    # Find the function
    if func_name not in namespace:
        raise ValueError(f"Function '{func_name}' not found in code")

    return namespace[func_name]


def _load_tool(record: Dict[str, Any]) -> ToolNode:
    """Load regular ToolNode from DB record."""
    code = record.get('code', '')
    imports = record.get('imports', '[]')
    func_name = record['name']

    tool_fn = execute_tool_code(code, imports, func_name)

    return ToolNode(
        id=record['node_uuid'],
        tool_fn=tool_fn,
    )


def get_nodes_for_ui(user_id: int, session: Session) -> List[Dict[str, Any]]:
    """Get nodes formatted for UI consumption.

    Args:
        user_id: User ID to filter nodes
        session: Database session

    Returns:
        List of node definitions for UI
    """
    query = text("""
        SELECT
            node_uuid, label, name, type, icon, category,
            description, inputs, outputs
        FROM mosaic_agent_tool_nodes
        WHERE user_id = :user_id
        AND active = true
        ORDER BY created_at DESC
    """)

    result = session.execute(query, {"user_id": user_id})
    records = result.fetchall()

    nodes = []
    for record in records:
        record_dict = dict(record._mapping)

        # Parse JSON fields
        inputs = record_dict.get('inputs', [])
        if isinstance(inputs, str):
            inputs = json.loads(inputs)

        outputs = record_dict.get('outputs', [])
        if isinstance(outputs, str):
            outputs = json.loads(outputs)

        node_def = {
            "node_uuid": str(record_dict['node_uuid']),
            "type": f"{record_dict['type'].lower()}Agentflow",  # dataHandlerAgentflow, toolAgentflow
            "name": record_dict['name'],
            "label": record_dict['label'],
            "description": record_dict.get('description', ''),
            "icon": record_dict.get('icon', 'Tool'),
            "category": record_dict.get('category', 'Custom'),
            "inputs": inputs,
            "outputs": outputs,
        }

        nodes.append(node_def)

    return nodes
