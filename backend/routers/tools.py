"""Tools API Endpoints

Handles listing available tools from the database.
"""

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import text
from backend.models.responses import ToolInfo
from backend.database import get_db_session

router = APIRouter()


@router.get("")
async def list_tools(request: Request):
    """List all available tools from database.

    Tools are loaded from mosaic_agent_tool_nodes table.
    Frontend can use this to populate tool selection in agent config.

    Returns:
        Dict with list of tool info including uuid, name, code, description

    Raises:
        HTTPException: If database query fails
    """
    session = get_db_session()

    try:
        # Query all active tools from database
        query = text("""
            SELECT node_uuid, code, imports, name, type, description
            FROM mosaic_agent_tool_nodes
            WHERE active = true
            ORDER BY name
        """)
        result = session.execute(query)
        records = result.fetchall()

        tools = []
        for record in records:
            record_dict = dict(record._mapping)

            # Extract description from docstring if not provided
            description = record_dict.get('description')
            if not description:
                # Try to extract from code docstring
                code = record_dict.get('code', '')
                if '"""' in code or "'''" in code:
                    try:
                        # Simple docstring extraction
                        doc_start = code.find('"""') or code.find("'''")
                        if doc_start >= 0:
                            doc_end = code.find('"""', doc_start + 3) or code.find("'''", doc_start + 3)
                            if doc_end > doc_start:
                                description = code[doc_start + 3:doc_end].strip()
                    except:
                        pass

            # Normalize imports field
            imports_value = record_dict.get('imports')
            # If it's a list/array, convert to JSON string
            if isinstance(imports_value, list):
                import json
                imports_value = json.dumps(imports_value)

            tools.append(
                ToolInfo(
                    id=record_dict['node_uuid'],
                    name=record_dict.get('name') or 'Unnamed Tool',
                    description=description or 'No description available',
                    code=record_dict.get('code'),
                    imports=imports_value,
                )
            )

        return {"tools": tools}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load tools from database: {str(e)}"
        )
    finally:
        session.close()
