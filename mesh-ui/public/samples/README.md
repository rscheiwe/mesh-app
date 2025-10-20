# Sample Flows

This directory contains pre-built example flows to demonstrate Mesh's capabilities.

## Available Samples

### 01_simple_writer.json
Basic flow demonstrating a single agent workflow.
- **Flow**: Start → Writer Agent
- **Use case**: Simple content generation
- **Try with**: "Write a short story about a robot learning to paint"

### 02_research_to_writer.json
Multi-agent workflow with data passing between agents.
- **Flow**: Start → Research Agent → Writer Agent
- **Use case**: Research-driven content creation
- **Variable passing**: `{{research_0.output}}` is passed to the writer
- **Try with**: "Quantum computing"

### 03_qa_with_tool.json
Demonstrates tool integration with agents.
- **Flow**: Start → Calculate Stats Tool → QA Agent
- **Use case**: Tool-augmented question answering
- **Tool used**: `calculate_stats` function
- **Try with**: "What do these statistics tell us?"

### 04_coding_assistant.json
Code generation workflow.
- **Flow**: Start → Coding Agent
- **Use case**: Programming assistance
- **Try with**: "Write a Python function to reverse a string"

**Note**: End nodes are optional in Mesh. Execution completes when there are no more nodes to process.

## Creating Custom Samples

To add your own sample:

1. Create a new JSON file following the structure:
```json
{
  "id": "unique-id",
  "name": "Display Name",
  "description": "Short description",
  "nodes": [...],
  "edges": [...]
}
```

2. Add an entry to `index.json`:
```json
{
  "id": "05_my_sample",
  "name": "My Sample",
  "description": "Description",
  "file": "05_my_sample.json"
}
```

## Node Structure

Each node follows this format:
```json
{
  "id": "unique_node_id",
  "type": "agentAgentflow|toolAgentflow|etc",
  "position": { "x": 100, "y": 200 },
  "data": {
    "defName": "agent|tool|etc",
    "config": {
      "id": "node_id",
      // ... node-specific config
    }
  }
}
```

## Variable Resolution

Use `{{variable}}` syntax to reference:
- `{{$input}}` - User input
- `{{node_id.output}}` - Another node's output
- `{{$vars.key}}` - Global variables
