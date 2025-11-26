# Temporary RAG Setup for Mesh-App

This guide shows how to enable RAG functionality in mesh-app for testing purposes.

## Files

- `rag_retriever_temp.py` - Standalone RAG retriever implementation (temporary, can be deleted after testing)

## Setup

### 1. Install Dependencies

```bash
pip install sqlalchemy psycopg2-binary openai
```

### 2. Set Environment Variables

Create a `.env` file or export:

```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
export OPENAI_API_KEY="sk-..."
```

### 3. Modify `backend/routers/execution.py`

Add RAG retriever injection after parsing:

```python
# At the top of execution.py, add import:
from mesh.nodes import RAGNode
from backend.rag_retriever_temp import create_rag_retriever

# In execute_graph() function, after parsing (line ~41):
try:
    parser = ReactFlowParser(registry)
    graph = parser.parse(request.flow)

    # === ADD THIS BLOCK ===
    # Inject RAG retriever into RAG nodes
    try:
        rag_retriever = create_rag_retriever()  # Uses env vars
        for node in graph.nodes.values():
            if isinstance(node, RAGNode):
                node.set_retriever(rag_retriever)
    except Exception as e:
        # Log but don't fail if RAG not configured
        print(f"Warning: RAG retriever not available: {e}")
    # === END BLOCK ===

except Exception as e:
    raise HTTPException(...)
```

Do the same in `execute_graph_sync()` function around line 115.

### 4. Test RAG Node

1. Start the backend: `uvicorn backend.main:app --reload`
2. In the mesh-app UI:
   - Drag a RAG node from the left palette (Tools section)
   - Configure it in the right panel:
     - Query Template: `{{$question}}`
     - Top K: `5`
     - File ID: `<your-file-uuid>`
     - Similarity Threshold: `0.7`
   - Connect: START → RAG → LLM
   - Set LLM system prompt: `Answer using this context: {{rag_0.output.formatted}}`
3. Execute the graph with a question

## Example Graph

```
START
  ↓
RAG (retrieves documents)
  ↓
LLM (uses {{rag_0.output.formatted}} in prompt)
```

## Cleanup

When done testing:

1. Remove the import and injection code from `execution.py`
2. Delete `backend/rag_retriever_temp.py`
3. Delete this file (`RAG_SETUP.md`)

## Database Requirements

Your postgres database must have:

- `pgvector` extension installed
- Tables: `mosaic_kc_files`, `mosaic_kc_file_chunks`
- Function: `match_document_chunks_by_file(vector(1536), uuid, float, int)`

This matches the taboolabot-api schema.
