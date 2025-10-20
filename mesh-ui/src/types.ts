export type InputDef = {
  name: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "options"
    | "array"
    | "asyncOptions"
    | "code";
  label: string;
  default?: any;
  optional?: boolean;
  rows?: number;
  placeholder?: string;
  description?: string;
  options?: { name: string; label: string; description?: string }[];
  dataSource?: "agents" | "tools"; // For asyncOptions: where to fetch data from
  array?: InputDef[];
  show?: Record<string, any>;
  acceptVariable?: boolean;
  acceptNodeOutputAsVariable?: boolean;
  loadConfig?: boolean;
  loadMethod?: string;
  showInNode?: boolean; // renders a summary field inside the node body
};

export type NodeDefinition = {
  type:
    | "startAgentflow"
    | "llmAgentflow"
    | "agentAgentflow"
    | "toolAgentflow"
    | "conditionAgentflow"
    | "loopAgentflow"
    | "endAgentflow"
    | "generic";
  name: string; // unique key used by instances: data.defName
  label: string;
  description?: string;
  icon?: string;
  category?: string;
  base_classes?: string[];
  inputs: InputDef[];
  outputs: string[]; // names for right-side handles
  color?: string; // tailwind-safe hex or class used for node accent
};

export type NodeInstanceData = {
  defName: string; // points to NodeDefinition.name
  config: Record<string, any>;
};

export type FlowJson = {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: NodeInstanceData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    sourceHandle?: string;
    target: string;
    targetHandle?: string;
    data?: any;
  }>;
};
