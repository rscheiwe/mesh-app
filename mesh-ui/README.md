# Mesh UI

A lightweight Flowise-style graph editor built with ReactFlow, shadcn/ui, and Tailwind CSS.

## Overview

Mesh UI is a minimal, elegant interface for building, visualizing, and executing agent flows. It provides a visual graph editor where nodes represent agents, tools, conditions, and control logic, which can be connected and configured through an intuitive drag-and-drop interface.

## Features

- **Drag & Drop Node Palette**: Add nodes from a categorized sidebar
- **ReactFlow Canvas**: Visual graph editor with zoom, pan, and connection handling
- **Dynamic Node Rendering**: Nodes display handles and configuration based on their schema
- **Schema-Driven Inspector**: Edit node properties with automatically generated forms
- **Flow Execution**: Send graph JSON to backend `/execute/stream` endpoint with SSE streaming
- **Node Types**: LLM, Agent, Tool, Condition, Loop, Start, End

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **State Management**: Zustand
- **UI Components**: shadcn/ui + Tailwind CSS
- **Graph Rendering**: React Flow
- **Styling**: TailwindCSS

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will start at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── main.tsx                  # Entry point
├── App.tsx                   # Main app layout
├── types.ts                  # TypeScript type definitions
├── components/
│   ├── Palette.tsx          # Left sidebar with draggable nodes
│   ├── Canvas.tsx           # Center ReactFlow canvas
│   ├── Inspector.tsx        # Right sidebar for editing nodes
│   ├── Runner.tsx           # Bottom panel for execution
│   ├── nodes/               # Node components
│   │   ├── GenericNode.tsx
│   │   ├── LLMNode.tsx
│   │   ├── ConditionNode.tsx
│   │   └── ToolNode.tsx
│   └── ui/                  # shadcn/ui components
├── registry/
│   └── index.ts             # Node definitions registry
├── store/
│   └── graph.ts             # Zustand state management
└── lib/
    ├── utils.ts             # Utility functions
    ├── mesh/
    │   └── run.ts           # SSE streaming helper
    └── form/
        └── FieldRenderer.tsx # Schema-driven form fields
```

## Usage

1. **Add Nodes**: Drag node types from the left palette onto the canvas
2. **Connect Nodes**: Click and drag from output handles (right) to input handles (left)
3. **Configure Nodes**: Click a node to edit its properties in the right inspector panel
4. **Execute Flow**: Enter input in the bottom runner panel and click "Run"
5. **View Output**: Stream results appear in real-time in the output area

## Node Types

### Control Nodes
- **Start**: Entry point for flows
- **End**: Terminal node with final output
- **Condition**: Conditional branching with true/false paths
- **Loop**: Iteration over collections

### Model Nodes
- **LLM**: Large Language Model with configurable parameters

### Agent Nodes
- **Agent**: Autonomous agents with tool access

### Tool Nodes
- **Tool**: Custom tools for agents (API, Python, Search, etc.)

## Backend Integration

The application expects a backend endpoint at `/execute/stream` that:
- Accepts POST requests with JSON body: `{ flow, input, variables, session_id }`
- Returns Server-Sent Events (SSE) stream of execution output

## License

MIT
