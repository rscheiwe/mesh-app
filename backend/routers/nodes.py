"""API endpoints for custom node management."""

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.database import get_db_session
from backend.loaders.node_loader import get_nodes_for_ui


router = APIRouter(tags=["nodes"])


def get_current_user_id() -> int:
    """Get current user ID from session/auth.

    TODO: Replace with actual auth logic
    For now, hardcode to match seed data
    """
    return 129617


@router.get("/custom", response_model=List[Dict[str, Any]])
async def get_custom_nodes(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
) -> List[Dict[str, Any]]:
    """Get user's custom nodes from database.

    Returns:
        List of node definitions for UI consumption
    """
    try:
        nodes = get_nodes_for_ui(user_id, session)
        return nodes
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load custom nodes: {str(e)}"
        )
    finally:
        session.close()


@router.get("/data-handlers", response_model=List[Dict[str, Any]])
async def get_data_handler_options(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
) -> List[Dict[str, Any]]:
    """Get DataHandler query options for dropdown selection.

    Returns:
        List of options with name (uuid) and label
    """
    try:
        query = text("""
            SELECT
                node_uuid, label, description,
                inputs
            FROM mosaic_agent_tool_nodes
            WHERE user_id = :user_id
            AND type = 'DataHandler'
            AND active = true
            ORDER BY label ASC
        """)

        result = session.execute(query, {"user_id": user_id})
        records = result.fetchall()

        options = []
        for record in records:
            record_dict = dict(record._mapping)
            options.append({
                "name": str(record_dict['node_uuid']),
                "label": record_dict['label'],
                "description": record_dict.get('description', ''),
                "inputs": record_dict.get('inputs', [])
            })

        return options
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load data handlers: {str(e)}"
        )
    finally:
        session.close()


@router.get("/tools", response_model=List[Dict[str, Any]])
async def get_tool_options(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
) -> List[Dict[str, Any]]:
    """Get Tool options for dropdown selection.

    Returns:
        List of options with name (uuid) and label
    """
    try:
        query = text("""
            SELECT
                node_uuid, label, description,
                inputs
            FROM mosaic_agent_tool_nodes
            WHERE user_id = :user_id
            AND type = 'Tool'
            AND active = true
            ORDER BY label ASC
        """)

        result = session.execute(query, {"user_id": user_id})
        records = result.fetchall()

        options = []
        for record in records:
            record_dict = dict(record._mapping)
            options.append({
                "name": str(record_dict['node_uuid']),
                "label": record_dict['label'],
                "description": record_dict.get('description', ''),
                "inputs": record_dict.get('inputs', [])
            })

        return options
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load tools: {str(e)}"
        )
    finally:
        session.close()


@router.get("/custom/{node_uuid}")
async def get_custom_node(
    node_uuid: str,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
) -> Dict[str, Any]:
    """Get specific custom node by UUID.

    Args:
        node_uuid: Node UUID

    Returns:
        Node definition
    """
    try:
        query = text("""
            SELECT
                node_uuid, label, name, type, icon, category,
                description, inputs, outputs
            FROM mosaic_agent_tool_nodes
            WHERE node_uuid = :node_uuid
            AND user_id = :user_id
            AND active = true
        """)

        result = session.execute(query, {
            "node_uuid": node_uuid,
            "user_id": user_id
        })
        record = result.fetchone()

        if not record:
            raise HTTPException(
                status_code=404,
                detail=f"Node {node_uuid} not found"
            )

        import json
        record_dict = dict(record._mapping)

        # Parse JSON fields
        inputs = record_dict.get('inputs', [])
        if isinstance(inputs, str):
            inputs = json.loads(inputs)

        outputs = record_dict.get('outputs', [])
        if isinstance(outputs, str):
            outputs = json.loads(outputs)

        return {
            "node_uuid": str(record_dict['node_uuid']),
            "type": f"{record_dict['type'].lower()}Agentflow",
            "name": record_dict['name'],
            "label": record_dict['label'],
            "description": record_dict.get('description', ''),
            "icon": record_dict.get('icon', 'Tool'),
            "category": record_dict.get('category', 'Custom'),
            "inputs": inputs,
            "outputs": outputs,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load node: {str(e)}"
        )
    finally:
        session.close()
