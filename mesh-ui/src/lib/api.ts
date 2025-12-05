/**
 * API Client for Mesh Backend
 *
 * Handles communication with the FastAPI backend to fetch agents, tools,
 * and execute graphs.
 */

// In development, use relative URLs (proxied by Vite)
// In production, use the full URL from env
// const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8000');
const API_URL = "http://localhost:8000";

export interface Agent {
  id: string;
  name: string;
  type: "vel" | "openai" | "custom";
  description?: string;
}

export interface Tool {
  id: string;
  name: string;
  description?: string;
  code?: string;
  imports?: any;
}

// Full tool node metadata from /api/nodes/tools
export interface ToolNode {
  name: string; // UUID
  label: string;
  description?: string;
  inputs?: ToolInput[];
  outputs?: string[];
}

export interface ToolInput {
  name: string;
  type?: string;
  optional?: boolean;
  description?: string;
  default?: any;
  options?: { name: string; label: string }[];
}

// Agent flow metadata from /api/nodes/agent-flows
export interface AgentFlow {
  name: string; // UUID
  label: string;
  description?: string;
  version?: number;
}

export interface CustomNode {
  node_uuid: string;
  type: string;
  name: string;
  label: string;
  description?: string;
  icon?: string;
  category?: string;
  inputs: any[];
  outputs: any[];
}

export interface ExecutionEvent {
  type: string;
  node_id?: string;
  content?: string;
  output?: any;
  error?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface ExecuteGraphParams {
  flow: any;
  input: string;
  session_id?: string;
}

/**
 * Fetch available agents from backend
 */
export async function fetchAgents(): Promise<Agent[]> {
  const response = await fetch(`${API_URL}/api/agents`);

  if (!response.ok) {
    throw new Error(`Failed to fetch agents: ${response.statusText}`);
  }

  const data = await response.json();
  return data.agents;
}

/**
 * Fetch available tools from backend (basic info)
 */
export async function fetchTools(): Promise<Tool[]> {
  const response = await fetch(`${API_URL}/api/tools`);

  if (!response.ok) {
    throw new Error(`Failed to fetch tools: ${response.statusText}`);
  }

  const data = await response.json();
  return data.tools;
}

/**
 * Fetch tool nodes with full metadata (inputs, outputs)
 * Used for tool selection dropdowns and parameter display
 */
export async function fetchToolNodes(): Promise<ToolNode[]> {
  const response = await fetch(`${API_URL}/api/nodes/tools`);

  if (!response.ok) {
    throw new Error(`Failed to fetch tool nodes: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch agent flows for subflow selection
 */
export async function fetchAgentFlows(): Promise<AgentFlow[]> {
  const response = await fetch(`${API_URL}/api/nodes/agent-flows`);

  if (!response.ok) {
    throw new Error(`Failed to fetch agent flows: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch data handlers for data handler selection
 */
export async function fetchDataHandlers(): Promise<ToolNode[]> {
  const response = await fetch(`${API_URL}/api/nodes/data-handlers`);

  if (!response.ok) {
    throw new Error(`Failed to fetch data handlers: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch custom nodes from database
 */
export async function fetchCustomNodes(): Promise<CustomNode[]> {
  const response = await fetch(`${API_URL}/api/nodes/custom`);

  if (!response.ok) {
    throw new Error(`Failed to fetch custom nodes: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Execute a graph with streaming
 */
export async function executeGraph(
  params: ExecuteGraphParams,
  onEvent: (event: ExecutionEvent) => void
): Promise<void> {
  const response = await fetch(`${API_URL}/api/execution/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      flow: params.flow,
      input: params.input,
      session_id: params.session_id,
    }),
  });

  if (!response.ok) {
    throw new Error(`Execution failed: ${response.statusText}`);
  }

  // Parse SSE stream
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable");
  }

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event = JSON.parse(line.slice(6));
          onEvent(event);
        } catch (error) {
          console.error("Failed to parse event:", error);
        }
      }
    }
  }
}

/**
 * Execute a graph without streaming (synchronous)
 */
export async function executeGraphSync(
  params: ExecuteGraphParams
): Promise<any> {
  const response = await fetch(`${API_URL}/api/execution/execute-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      flow: params.flow,
      input: params.input,
      session_id: params.session_id,
    }),
  });

  if (!response.ok) {
    throw new Error(`Execution failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<any> {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }

  return response.json();
}
