import type { NodeDefinition } from "@/types";

// Node Definitions matching Mesh Python backend
export const NODE_DEFS: NodeDefinition[] = [
  // Start Node
  {
    type: "startAgentflow",
    name: "start",
    label: "Start",
    description: "Entry point to the graph",
    icon: "Play",
    category: "Control",
    color: "#10b981", // green
    inputs: [
      {
        name: "id",
        type: "string",
        label: "Node ID (auto-generated)",
        default: "START",
        optional: true,
        showInNode: true,
        description: "Used for variable resolution. Auto-generated but editable.",
      },
      {
        name: "eventMode",
        type: "options",
        label: "Event Mode",
        default: "full",
        optional: true,
        showInNode: false,
        options: [
          { name: "full", label: "Full Streaming" },
          { name: "status_only", label: "Status Only" },
          { name: "transient_events", label: "Transient Events" },
          { name: "silent", label: "Silent" },
        ],
        description: "Full: streams to chat. Status Only: progress indicators. Transient Events: all events prefixed with data-start-node-*. Silent: no events.",
      },
    ],
    outputs: ["output"],
  },

  // LLM Node
  {
    type: "llmAgentflow",
    name: "llm",
    label: "LLM",
    description: "Direct LLM calls with streaming",
    icon: "Brain",
    category: "Models",
    color: "#3b82f6", // blue
    inputs: [
      {
        name: "id",
        type: "string",
        label: "Node ID (auto-generated)",
        placeholder: "llm_0",
        showInNode: true,
        description: "Used for variable resolution (e.g., {{llm_0.output}}). Auto-generated but editable.",
      },
      {
        name: "model",
        type: "options",
        label: "Model",
        default: "gpt-4",
        showInNode: true,
        options: [
          { name: "gpt-4", label: "GPT-4" },
          { name: "gpt-4-turbo", label: "GPT-4 Turbo" },
          { name: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
          { name: "claude-3-opus-20240229", label: "Claude 3 Opus" },
          { name: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet" },
        ],
      },
      {
        name: "provider",
        type: "options",
        label: "Provider",
        default: "openai",
        showInNode: true,
        options: [
          { name: "openai", label: "OpenAI" },
          { name: "anthropic", label: "Anthropic" },
        ],
      },
      {
        name: "systemPrompt",
        type: "string",
        label: "System Prompt",
        rows: 4,
        optional: true,
        placeholder: "You are a helpful assistant...",
        acceptVariable: true,
        description: "Optional system prompt. Supports variable resolution like {{node_id.output}}",
      },
      {
        name: "temperature",
        type: "number",
        label: "Temperature",
        default: 0.7,
        optional: true,
        description: "Controls randomness (0.0-2.0)",
      },
      {
        name: "maxTokens",
        type: "number",
        label: "Max Tokens",
        optional: true,
        description: "Maximum tokens to generate",
      },
      {
        name: "eventMode",
        type: "options",
        label: "Event Mode",
        default: "full",
        optional: true,
        showInNode: false,
        options: [
          { name: "full", label: "Full Streaming" },
          { name: "status_only", label: "Status Only" },
          { name: "transient_events", label: "Transient Events" },
          { name: "silent", label: "Silent" },
        ],
        description: "Full: streams to chat. Status Only: progress indicators. Transient Events: all events prefixed with data-llm-node-*. Silent: no events.",
      },
    ],
    outputs: ["output"],
  },

  // Agent Node
  {
    type: "agentAgentflow",
    name: "agent",
    label: "Agent",
    description: "Vel agent with optional tool support",
    icon: "Bot",
    category: "Agents",
    color: "#8b5cf6", // purple
    inputs: [
      {
        name: "id",
        type: "string",
        label: "Node ID (auto-generated)",
        placeholder: "agent_0",
        showInNode: true,
        description: "Used for variable resolution (e.g., {{agent_0.content}}). Auto-generated but editable.",
      },
      {
        name: "agent",
        type: "asyncOptions",
        label: "Pre-configured Agent (Optional)",
        placeholder: "Leave empty to configure inline...",
        showInNode: false,
        optional: true,
        description: "Select a pre-configured agent, or leave empty to configure model settings below",
        dataSource: "agents",
      },
      {
        name: "provider",
        type: "options",
        label: "Provider",
        default: "openai",
        optional: true,
        showInNode: true,
        options: [
          { name: "openai", label: "OpenAI" },
          { name: "anthropic", label: "Anthropic" },
          { name: "gemini", label: "Google Gemini" },
        ],
        description: "LLM provider to use",
        show: { agent: [undefined, null, ""] }, // Only show if no pre-configured agent selected
      },
      {
        name: "modelName",
        type: "string",
        label: "Model Name",
        default: "gpt-4o-mini",
        optional: true,
        showInNode: true,
        placeholder: "gpt-4o-mini, claude-3-5-sonnet-20241022, etc.",
        description: "Model to use for this agent",
        show: { agent: [undefined, null, ""] },
      },
      {
        name: "temperature",
        type: "number",
        label: "Temperature",
        default: 0.7,
        optional: true,
        placeholder: "0.7",
        description: "Sampling temperature (0.0 - 2.0)",
        show: { agent: [undefined, null, ""] },
      },
      {
        name: "maxTokens",
        type: "number",
        label: "Max Tokens",
        optional: true,
        placeholder: "Leave empty for model default",
        description: "Maximum tokens to generate",
        show: { agent: [undefined, null, ""] },
      },
      {
        name: "systemPrompt",
        type: "string",
        label: "System Prompt",
        rows: 4,
        optional: true,
        placeholder: "You are a helpful agent...",
        acceptVariable: true,
        description: "System prompt for the agent",
      },
      {
        name: "tools",
        type: "multiAsyncSelect",
        label: "Tools (Optional)",
        optional: true,
        showInNode: false,
        dataSource: "tools",
        description: "Select tools from database for this agent to use. Tools will be embedded as inline tool definitions.",
      },
      {
        name: "useNativeEvents",
        type: "boolean",
        label: "Use Native Events",
        default: false,
        optional: true,
        description: "If true, use provider's native events",
      },
      {
        name: "eventMode",
        type: "options",
        label: "Event Mode",
        default: "full",
        optional: true,
        showInNode: false,
        options: [
          { name: "full", label: "Full Streaming" },
          { name: "status_only", label: "Status Only" },
          { name: "transient_events", label: "Transient Events" },
          { name: "silent", label: "Silent" },
        ],
        description: "Full: streams to chat. Status Only: progress indicators. Transient Events: all events prefixed with data-agent-node-*. Silent: no events.",
      },
    ],
    outputs: ["content"],
  },

  // Tool Node
  {
    type: "toolAgentflow",
    name: "tool",
    label: "Tool",
    description: "Execute Python functions from database",
    icon: "Wrench",
    category: "Tools",
    color: "#f59e0b", // amber
    inputs: [
      {
        name: "id",
        type: "string",
        label: "Node ID (auto-generated)",
        placeholder: "tool_0",
        showInNode: true,
        description: "Used for variable resolution (e.g., {{tool_0.output}}). Auto-generated but editable.",
      },
      {
        name: "toolUuid",
        type: "asyncOptions",
        label: "Select Tool",
        placeholder: "Choose a tool...",
        showInNode: true,
        description: "Select a tool from the database",
        fetchUrl: "/api/nodes/tools",
      },
      {
        name: "functionDoc",
        type: "string",
        label: "Function Description",
        rows: 3,
        optional: true,
        placeholder: "What does this tool do?",
        description: "Documentation for the tool function",
      },
      {
        name: "bindings",
        type: "code",
        label: "Parameter Bindings (JSON)",
        rows: 4,
        optional: true,
        placeholder: '{"param_name": "value"}',
        acceptVariable: true,
        description: "JSON object with parameter bindings. Supports variable resolution like {{node_id.output}}",
      },
      {
        name: "eventMode",
        type: "options",
        label: "Event Mode",
        default: "full",
        optional: true,
        showInNode: false,
        options: [
          { name: "full", label: "Full Streaming" },
          { name: "status_only", label: "Status Only" },
          { name: "transient_events", label: "Transient Events" },
          { name: "silent", label: "Silent" },
        ],
        description: "Full: streams to chat. Status Only: progress indicators. Transient Events: all events prefixed with data-tool-node-*. Silent: no events.",
      },
    ],
    outputs: ["output"],
  },

  // RAG Node
  {
    type: "ragAgentflow",
    name: "rag",
    label: "RAG",
    description: "Retrieve documents from vector stores for context enrichment",
    icon: "Database",
    category: "Tools",
    color: "#06b6d4", // cyan
    inputs: [
      {
        name: "id",
        type: "string",
        label: "Node ID (auto-generated)",
        placeholder: "rag_0",
        showInNode: true,
        description: "Used for variable resolution (e.g., {{rag_0.output.formatted}}). Auto-generated but editable.",
      },
      {
        name: "queryTemplate",
        type: "string",
        label: "Query Template",
        default: "{{$question}}",
        rows: 3,
        optional: true,
        acceptVariable: true,
        placeholder: "{{$question}}",
        description: "Template for search query. Supports variable resolution like {{node_id.output}}",
      },
      {
        name: "topK",
        type: "number",
        label: "Top K Results",
        default: 5,
        optional: true,
        showInNode: true,
        description: "Number of documents to retrieve",
      },
      {
        name: "similarityThreshold",
        type: "number",
        label: "Similarity Threshold",
        default: 0.7,
        optional: true,
        description: "Minimum similarity score (0.0-1.0)",
      },
      {
        name: "fileId",
        type: "string",
        label: "File ID",
        optional: true,
        placeholder: "uuid-of-file",
        description: "Search within specific file (leave empty for folder search)",
      },
      {
        name: "folderUuid",
        type: "string",
        label: "Folder UUID",
        optional: true,
        placeholder: "uuid-of-folder",
        description: "Search across folder (leave empty for file search)",
      },
      {
        name: "retrieverType",
        type: "options",
        label: "Retriever Type",
        default: "postgres",
        optional: true,
        showInNode: false,
        options: [
          { name: "postgres", label: "PostgreSQL (pgvector)" },
          { name: "chroma", label: "ChromaDB" },
        ],
        description: "Type of vector store backend",
      },
      {
        name: "eventMode",
        type: "options",
        label: "Event Mode",
        default: "full",
        optional: true,
        showInNode: false,
        options: [
          { name: "full", label: "Full Streaming" },
          { name: "status_only", label: "Status Only" },
          { name: "silent", label: "Silent" },
        ],
        description: "Full: streams to chat. Status Only: progress indicators. Silent: no events.",
      },
    ],
    outputs: ["output"],
  },

  // Data Handler Node
  {
    type: "dataHandlerAgentflow",
    name: "data_handler",
    label: "Data Handler",
    description: "Execute SQL queries against database sources",
    icon: "Database",
    category: "Tools",
    color: "#10b981", // green
    inputs: [
      {
        name: "id",
        type: "string",
        label: "Node ID (auto-generated)",
        placeholder: "data_handler_0",
        showInNode: true,
        description: "Used for variable resolution (e.g., {{data_handler_0.output.rows}} or {{data_handler_0.output.count}}). Auto-generated but editable.",
      },
      {
        name: "dataHandlerUuid",
        type: "asyncOptions",
        label: "Query Selection",
        optional: false,
        showInNode: true,
        fetchUrl: "/api/nodes/data-handlers",
        description: "Select a pre-configured database query to execute",
      },
      {
        name: "dbSource",
        type: "options",
        label: "Database Source",
        default: "postgres",
        optional: true,
        showInNode: true,
        options: [
          { name: "postgres", label: "PostgreSQL" },
          { name: "mysql", label: "MySQL" },
          { name: "vertica", label: "Vertica" },
        ],
        description: "Database connection to use (loaded from selected query)",
      },
      {
        name: "query",
        type: "code",
        label: "SQL Query (Read-Only)",
        rows: 8,
        optional: true,
        readOnly: true,
        placeholder: "SELECT * FROM table WHERE column = :param",
        description: "Shows the SQL query with parameters (e.g., :val means you need to provide a 'val' parameter below)",
      },
      {
        name: "params",
        type: "code",
        label: "Parameters",
        rows: 4,
        optional: true,
        placeholder: '{"val": false}',
        description: "Set parameter values here (e.g., {\"val\": false} for :val in query above). Leave empty for AI to fill from previous nodes.",
      },
      {
        name: "eventMode",
        type: "options",
        label: "Event Mode",
        default: "full",
        optional: true,
        showInNode: false,
        options: [
          { name: "full", label: "Full Streaming" },
          { name: "status_only", label: "Status Only" },
          { name: "silent", label: "Silent" },
        ],
        description: "Full: streams to chat. Status Only: progress indicators. Silent: no events.",
      },
    ],
    outputs: ["rows", "count"],
  },

  // Condition Node
  {
    type: "conditionflow",
    name: "condition",
    label: "Condition",
    description: "Unified conditional branching - deterministic or AI-driven",
    icon: "GitBranch",
    category: "Control",
    color: "#ec4899", // pink
    inputs: [
      {
        name: "id",
        type: "string",
        label: "Node ID (auto-generated)",
        placeholder: "condition_0",
        showInNode: true,
        description: "Used for variable resolution. Auto-generated but editable.",
      },
      {
        name: "conditionRouting",
        type: "options",
        label: "Routing Mode",
        default: "deterministic",
        showInNode: false,
        options: [
          { name: "deterministic", label: "Deterministic (Rules)" },
          { name: "ai", label: "AI (LLM)" },
        ],
        description: "Choose between rule-based routing or LLM-driven classification",
      },
      {
        name: "input",
        type: "string",
        label: "Input Data",
        optional: true,
        rows: 4,
        acceptVariable: true,
        acceptNodeOutputAsVariable: true,
        placeholder: "{{previous_node.output}}",
        description: "Input data to evaluate. Supports variable resolution like {{node_id.output}}",
      },
      {
        name: "defaultTarget",
        type: "string",
        label: "Default Target Node",
        optional: true,
        placeholder: "node_id",
        description: "Node ID to route to if no conditions/scenarios match",
      },
      // Deterministic mode fields
      {
        name: "conditions",
        type: "code",
        label: "Conditions (JSON)",
        rows: 12,
        optional: true,
        show: { conditionRouting: "deterministic" },
        placeholder: `[
  {
    "name": "high_score",
    "operation": "greater_than",
    "field": "score",
    "value": 80,
    "target_node": "success_path"
  },
  {
    "name": "contains_error",
    "operation": "contains",
    "field": "message",
    "value": "error",
    "target_node": "error_path"
  }
]`,
        description: "Array of conditions. Operations: equals, not_equal, contains, not_contains, greater_than, less_than, is_empty",
      },
      // AI mode fields
      {
        name: "model",
        type: "options",
        label: "LLM Model",
        optional: true,
        show: { conditionRouting: "ai" },
        options: [
          { name: "gpt-4", label: "GPT-4" },
          { name: "gpt-4-turbo", label: "GPT-4 Turbo" },
          { name: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
          { name: "claude-3-opus-20240229", label: "Claude 3 Opus" },
        ],
        description: "LLM model for AI-driven routing",
      },
      {
        name: "instructions",
        type: "string",
        label: "Task Instructions",
        rows: 4,
        optional: true,
        show: { conditionRouting: "ai" },
        placeholder: "Classify the user's request into sales, support, or billing",
        description: "Natural language description of the classification task",
      },
      {
        name: "scenarios",
        type: "code",
        label: "Scenarios (JSON)",
        rows: 12,
        optional: true,
        show: { conditionRouting: "ai" },
        placeholder: `[
  {
    "name": "sales",
    "description": "Questions about products or purchasing",
    "target": "sales_handler"
  },
  {
    "name": "support",
    "description": "Technical issues or help",
    "target": "support_handler"
  },
  {
    "name": "billing",
    "description": "Payment or invoice questions",
    "target": "billing_handler"
  }
]`,
        description: "Array of scenarios for LLM classification. Each must have name, description, and target",
      },
      {
        name: "eventMode",
        type: "options",
        label: "Event Mode",
        default: "full",
        optional: true,
        showInNode: false,
        options: [
          { name: "full", label: "Full Streaming" },
          { name: "status_only", label: "Status Only" },
          { name: "transient_events", label: "Transient Events" },
          { name: "silent", label: "Silent" },
        ],
        description: "Full: streams to chat. Status Only: progress indicators. Transient Events: all events prefixed with data-condition-node-*. Silent: no events.",
      },
    ],
    outputs: [], // Dynamic outputs based on conditions or scenarios
  },

  // ForEach Node (formerly Loop)
  {
    type: "foreachAgentflow",
    name: "foreach",
    label: "ForEach",
    description: "Iterate over arrays",
    icon: "ListTree",
    category: "Control",
    color: "#06b6d4", // cyan
    inputs: [
      {
        name: "id",
        type: "string",
        label: "Node ID (auto-generated)",
        placeholder: "foreach_0",
        showInNode: true,
        description: "Used for variable resolution. Auto-generated but editable.",
      },
      {
        name: "input",
        type: "string",
        label: "Input Data",
        optional: true,
        rows: 4,
        acceptVariable: true,
        acceptNodeOutputAsVariable: true,
        placeholder: "{{previous_node.output}}",
        description: "Input data containing array to iterate. Supports variable resolution like {{node_id.output}}",
      },
      {
        name: "arrayPath",
        type: "string",
        label: "Array Path (JSONPath)",
        default: "$.items",
        optional: true,
        placeholder: "$.items",
        description: "JSONPath to extract array from input",
      },
      {
        name: "maxIterations",
        type: "number",
        label: "Max Iterations",
        default: 100,
        optional: true,
        description: "Safety limit to prevent infinite loops",
      },
      {
        name: "eventMode",
        type: "options",
        label: "Event Mode",
        default: "full",
        optional: true,
        showInNode: false,
        options: [
          { name: "full", label: "Full Streaming" },
          { name: "status_only", label: "Status Only" },
          { name: "transient_events", label: "Transient Events" },
          { name: "silent", label: "Silent" },
        ],
        description: "Full: streams to chat. Status Only: progress indicators. Transient Events: all events prefixed with data-foreach-node-*. Silent: no events.",
      },
    ],
    outputs: ["item", "complete"],
  },

  // Loop Node (backward jump)
  {
    type: "loopAgentflow",
    name: "loop",
    label: "Loop",
    description: "Jump back to a previously executed node",
    icon: "IterationCw",
    category: "Control",
    color: "#8b5cf6", // purple
    inputs: [
      {
        name: "id",
        type: "string",
        label: "Node ID (auto-generated)",
        placeholder: "loop_0",
        showInNode: true,
        description: "Used for variable resolution. Auto-generated but editable.",
      },
      {
        name: "input",
        type: "string",
        label: "Input Data",
        optional: true,
        rows: 4,
        acceptVariable: true,
        acceptNodeOutputAsVariable: true,
        placeholder: "{{previous_node.output}}",
        description: "Input data to pass to target node. Supports variable resolution like {{node_id.output}}",
      },
      {
        name: "loopBackTo",
        type: "nodeOptions",
        label: "Loop Back To (Node ID)",
        placeholder: "Select node...",
        showInNode: true,
        description: "ID of the previously executed node to jump back to",
      },
      {
        name: "maxLoopCount",
        type: "number",
        label: "Max Loop Count",
        default: 5,
        optional: true,
        description: "Maximum number of times to loop (default: 5)",
      },
      {
        name: "eventMode",
        type: "options",
        label: "Event Mode",
        default: "full",
        optional: true,
        showInNode: false,
        options: [
          { name: "full", label: "Full Streaming" },
          { name: "status_only", label: "Status Only" },
          { name: "transient_events", label: "Transient Events" },
          { name: "silent", label: "Silent" },
        ],
        description: "Full: streams to chat. Status Only: progress indicators. Transient Events: all events prefixed with data-loop-node-*. Silent: no events.",
      },
    ],
    outputs: ["output"],
  },

  // End Node (Optional - graphs can end at any node)
  {
    type: "endAgentflow",
    name: "end",
    label: "End",
    description: "Optional: Explicit exit point from the graph",
    icon: "Flag",
    category: "Control",
    color: "#ef4444", // red
    inputs: [
      {
        name: "id",
        type: "string",
        label: "Node ID (auto-generated)",
        default: "END",
        optional: true,
        showInNode: true,
        description: "Used for variable resolution. Auto-generated but editable.",
      },
    ],
    outputs: [],
  },
];

// Create a map for quick lookup by name
export const NODE_DEF_MAP: Record<string, NodeDefinition> = NODE_DEFS.reduce(
  (acc, def) => {
    acc[def.name] = def;
    return acc;
  },
  {} as Record<string, NodeDefinition>
);

// Palette groups for sidebar organization
export const PALETTE_GROUPS = [
  {
    category: "Control",
    nodes: NODE_DEFS.filter((n) => n.category === "Control"),
  },
  {
    category: "Models",
    nodes: NODE_DEFS.filter((n) => n.category === "Models"),
  },
  {
    category: "Agents",
    nodes: NODE_DEFS.filter((n) => n.category === "Agents"),
  },
  {
    category: "Tools",
    nodes: NODE_DEFS.filter((n) => n.category === "Tools"),
  },
];
