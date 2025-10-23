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
    ],
    outputs: ["output"],
  },

  // Agent Node
  {
    type: "agentAgentflow",
    name: "agent",
    label: "Agent",
    description: "Wraps Vel or OpenAI agents with auto-detection",
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
        description: "Used for variable resolution (e.g., {{agent_0.output}}). Auto-generated but editable.",
      },
      {
        name: "agent",
        type: "asyncOptions",
        label: "Select Agent",
        placeholder: "Choose an agent...",
        showInNode: true,
        description: "Select which registered agent to use",
        dataSource: "agents", // Flag for FieldRenderer to use backend agents
      },
      {
        name: "systemPrompt",
        type: "string",
        label: "System Prompt",
        rows: 4,
        optional: true,
        placeholder: "You are a helpful agent...",
        acceptVariable: true,
        description: "Optional system prompt override",
      },
      {
        name: "useNativeEvents",
        type: "boolean",
        label: "Use Native Events",
        default: false,
        optional: true,
        description: "If true, use provider's native events",
      },
    ],
    outputs: ["output"],
  },

  // Tool Node
  {
    type: "toolAgentflow",
    name: "tool",
    label: "Tool",
    description: "Execute Python functions",
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
        name: "functionName",
        type: "asyncOptions",
        label: "Select Tool",
        placeholder: "Choose a tool...",
        showInNode: true,
        description: "Select which registered tool to execute",
        dataSource: "tools", // Flag for FieldRenderer to use backend tools
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
    ],
    outputs: ["output"],
  },

  // Condition Node
  {
    type: "conditionAgentflow",
    name: "condition",
    label: "Condition",
    description: "Conditional branching",
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
        description: "Node ID to route to if no conditions match",
      },
      {
        name: "conditions",
        type: "code",
        label: "Conditions (JSON)",
        rows: 8,
        placeholder: `[
  {
    "name": "success",
    "target_node": "success_handler"
  },
  {
    "name": "failure",
    "target_node": "error_handler"
  }
]`,
        description: "Array of condition objects with name and target_node",
      },
    ],
    outputs: ["true", "false", "default"],
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
