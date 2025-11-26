# Tools Architecture - mesh-app

**Updated:** November 25, 2025
**Status:** Migrated to dynamic tools pattern

## Overview

mesh-app now uses **dynamic tools** (Vel v0.3.0+) with three distinct patterns for handling tools. The old global registry pattern has been removed.

## Three Tool Patterns

### Pattern 1: Agent Template with Pre-configured Tools

**Use Case:** Reusable agent templates with specialized tools (e.g., research agent with websearch).

**Where:** `backend/agents/research_agent.py`

```python
from vel import Agent as VelAgent
from vel.tools import ToolSpec

# Define tool
def websearch(query: str) -> dict:
    # Implementation
    return {"results": [...]}

# Wrap in ToolSpec
websearch_tool = ToolSpec.from_function(websearch)

# Create agent with tool
research_agent = VelAgent(
    id="research",
    model={"provider": "openai", "model": "gpt-4o"},
    tools=[websearch_tool],  # Tools part of agent config
)

# Register template in backend/registry.py
registry.register_agent("research_agent", research_agent)
```

**React Flow JSON (Frontend):**
```json
{
  "id": "agent_0",
  "type": "agentAgentflow",
  "data": {
    "inputs": {
      "agent": "research_agent"  // References pre-configured template
    }
  }
}
```

**Flow:**
```
User selects "research_agent" template in UI
    ↓
React Flow sends JSON with agent: "research_agent"
    ↓
Backend registry.get_agent("research_agent")
    ↓
AgentNode wraps pre-configured agent (already has tools)
    ↓
Agent uses Vel runtime to execute with tools
```

---

### Pattern 2: Inline Agent with Inline Tools (NEW!)

**Use Case:** User creates custom agent + tools via UI at runtime.

**Where:** React Flow JSON → ReactFlowParser → VelAgent creation

**React Flow JSON (Frontend):**
```json
{
  "id": "agent_0",
  "type": "agentAgentflow",
  "data": {
    "inputs": {
      "provider": "openai",
      "modelName": "gpt-4o-mini",
      "temperature": 0.7,
      "systemPrompt": "You are a helpful assistant with calculator tools.",
      "tools": [
        {
          "code": "def add(x: int, y: int) -> dict:\n    return {'result': x + y}",
          "name": "add",
          "description": "Add two numbers"
        },
        {
          "code": "def multiply(x: int, y: int) -> dict:\n    return {'result': x * y}"
        }
      ]
    }
  }
}
```

**Flow:**
```
User creates agent in UI (model/provider/temp)
    ↓
User adds tools via UI code editor
    ↓
Frontend sends inline tools in JSON
    ↓
ReactFlowParser._create_tools_from_config():
  - Executes tool code
  - Wraps in ToolSpec.from_function()
    ↓
VelAgent created with tools array
    ↓
AgentNode wraps agent
    ↓
Agent executes with inline tools
```

**Backend Code:** `mesh/parsers/react_flow.py:257-363`

**Benefits:**
- No app restart needed
- No DB persistence required (tools defined in flow JSON)
- Perfect for prototyping/testing
- Tools auto-deployed with graph

---

### Pattern 3: Standalone ToolNode from Database

**Use Case:** Shared tools stored in DB, used as separate nodes in graph.

**Where:** Database → `execution.py` → ToolNode injection

**Database Schema:**
```sql
CREATE TABLE mosaic_agent_tool_nodes (
    node_uuid TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    imports TEXT,  -- JSON array
    name TEXT,
    type TEXT,
    active BOOLEAN DEFAULT true
);
```

**React Flow JSON (Frontend):**
```json
{
  "id": "tool_0",
  "type": "toolAgentflow",
  "data": {
    "inputs": {
      "toolUuid": "abc-123-def-456"  // References DB tool
    }
  }
}
```

**Flow:**
```
User drags ToolNode from DB catalog
    ↓
Frontend sends JSON with toolUuid
    ↓
ReactFlowParser creates ToolNode (placeholder function)
    ↓
execution.py (lines 69-104):
  - Detects toolUuid in config
  - Queries DB: SELECT code, imports, name FROM mosaic_agent_tool_nodes
  - Executes code to extract function
  - Injects via node.set_tool_function()
    ↓
Graph executes with DB-loaded tool
```

**Backend Code:** `backend/routers/execution.py:69-104`

**Benefits:**
- Centralized tool management
- Reusable across multiple graphs
- Version control in DB
- Permissions/access control possible

---

## Comparison Matrix

| Feature | Agent Template | Inline Tools | Standalone ToolNode |
|---------|---------------|--------------|---------------------|
| **Configured** | Startup | Runtime | Runtime |
| **Storage** | Code (registry.py) | React Flow JSON | Database |
| **Reusability** | ✅ Across sessions | ❌ Per-graph | ✅ Across graphs |
| **Tool Execution** | Vel runtime (LLM decides) | Vel runtime (LLM decides) | Mesh orchestration |
| **Use Case** | Common templates | Custom/prototype | Shared library |
| **Registry Needed** | ✅ Yes | ❌ No | ❌ No |

---

## Migration Guide

### Old Pattern (Deprecated)
```python
# ❌ OLD: Global tool registry
from vel.tools import register_tool

register_tool(tool_spec)
agent = VelAgent(tools=['tool_name'])
```

### New Patterns

**For Agent Templates:**
```python
# ✅ NEW: Tools part of agent config
tool = ToolSpec.from_function(my_function)
agent = VelAgent(tools=[tool])
registry.register_agent("my_agent", agent)
```

**For Runtime Creation:**
```json
// ✅ NEW: Inline tools in JSON
{
  "tools": [
    {"code": "def my_tool(x): return x"}
  ]
}
```

**For Shared Tools:**
```sql
-- ✅ NEW: Store in DB
INSERT INTO mosaic_agent_tool_nodes (node_uuid, code, name)
VALUES ('uuid', 'def my_tool()...', 'my_tool');
```

---

## What Changed in mesh-app

### Removed
- ❌ `backend/tools.py` imports from `backend/registry.py`
- ❌ `get_all_tools()` calls
- ❌ `registry.register_tool()` calls
- ❌ Global tool registration

### Updated
- ✅ `backend/registry.py` - Now called "Agent Templates Registry"
- ✅ Documentation clarifies registry is for agent templates only
- ✅ Comments explain three tool patterns

### Added (in Mesh core)
- ✅ `ReactFlowParser._create_tools_from_config()` - Parses inline tools
- ✅ `mesh/parsers/react_flow.py:257-273` - Passes tools to VelAgent
- ✅ Support for `tools` array in agent config JSON

### Kept (Still Working)
- ✅ Agent template registration (research_agent, etc.)
- ✅ DB-backed ToolNode loading (execution.py:69-104)
- ✅ All existing functionality

---

## Implementation Checklist

- [x] Remove tool registration from backend/registry.py
- [x] Update registry documentation
- [x] ReactFlowParser supports inline tools (core Mesh)
- [x] DB-backed ToolNode still works (no changes needed)
- [x] Agent templates can have pre-configured tools
- [ ] Frontend UI for adding inline tools to agent config
- [ ] Frontend UI for browsing DB tool catalog
- [ ] API endpoints for CRUD on mosaic_agent_tool_nodes

---

## Next Steps

### For Full Dynamic Tools Support in UI:

1. **Frontend: Agent Config Panel**
   - Add "Tools" section in agent node configuration
   - Code editor for inline tool definitions
   - Preview/test tool schemas

2. **Frontend: Tool Catalog**
   - Browse `mosaic_agent_tool_nodes` table
   - Drag/drop tools into graph as ToolNodes
   - Tool search/filtering

3. **Backend: Tool Management API**
   ```python
   POST /api/tools/create
   GET /api/tools/list
   PUT /api/tools/{uuid}/update
   DELETE /api/tools/{uuid}/delete
   ```

4. **Database Enhancements**
   - Add `user_id` column (multi-tenancy)
   - Add `category`, `tags` for organization
   - Add `version` for tool versioning

---

## FAQs

**Q: When should I use agent templates vs inline agents?**
A: Templates for reusable configs (research_agent), inline for custom/one-off agents.

**Q: When should I use inline tools vs ToolNode?**
A: Inline tools when LLM decides to use them, ToolNode for deterministic orchestration.

**Q: Can I mix patterns?**
A: Yes! An agent template can reference DB tools via inline tools array:
```json
{
  "agent": "research_agent",
  "tools": [
    {"code": "def extra_tool(): ..."}  // Add extra inline tool
  ]
}
```

**Q: Do inline tools persist?**
A: They're stored in the React Flow JSON. If you save the graph, tools are saved too.

**Q: How do I share tools across users?**
A: Use Pattern 3 (DB-backed ToolNode) with proper permissions.

---

## Related Files

**Backend:**
- `backend/registry.py` - Agent template registry
- `backend/routers/execution.py` - Graph execution + tool injection
- `backend/agents/` - Agent template definitions

**Frontend:**
- `mesh-ui/src/components/AgentNodeConfig.tsx` - Agent configuration UI
- `mesh-ui/src/components/ToolNodeConfig.tsx` - ToolNode configuration UI

**Core Mesh:**
- `mesh/parsers/react_flow.py` - ReactFlow parser with inline tools
- `mesh/nodes/agent.py` - AgentNode (wraps pre-configured agents)
- `mesh/nodes/tool.py` - ToolNode (for standalone tools)

**Documentation:**
- `mesh/CLAUDE.md` - Section 8: Dynamic Tools Integration
- `mesh/docs/DYNAMIC_TOOLS_INTEGRATION.md` - Comprehensive guide
