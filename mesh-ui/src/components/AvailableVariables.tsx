import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { useGraphStore, GraphNode } from "@/store/graph";
import { NODE_DEF_MAP } from "@/registry";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useBackend } from "@/contexts/BackendContext";
import type { Edge } from "reactflow";

/**
 * Get the output schema for a node based on its type
 * Uses dynamic outputs from node config or context when available
 */
const getNodeOutputSchema = (
  node: GraphNode,
  getToolByUuid?: (uuid: string) => { outputs?: string[] } | undefined
): string[] => {
  const defName = node.data?.defName;
  const config = node.data?.config;

  switch (defName) {
    case "data_handler":
      return ["rows", "count"];

    case "tool":
      // First check node config (populated by Inspector)
      if (config?.toolOutputs && Array.isArray(config.toolOutputs)) {
        return config.toolOutputs;
      }
      // Fall back to context if available
      if (config?.toolUuid && getToolByUuid) {
        const tool = getToolByUuid(config.toolUuid);
        if (tool?.outputs) {
          return tool.outputs;
        }
      }
      return ["output"];

    case "rag":
      return ["formatted", "documents", "count"];

    case "llm":
      return ["output"];

    case "agent":
      return ["content"];

    case "agent_flow":
      return ["output"];

    case "condition":
      return ["matched", "route"];

    default:
      return ["output"];
  }
};

/**
 * Get a friendly name for the node type
 */
const getNodeTypeName = (defName: string): string => {
  const def = NODE_DEF_MAP[defName];
  return def?.label || defName || "Node";
};

/**
 * Variable item with copy functionality
 */
const VariableItem = ({
  variable,
  nodeId,
}: {
  variable: string;
  nodeId: string;
}) => {
  const [copied, setCopied] = useState(false);
  const fullPath = `{{${nodeId}.output.${variable}}}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      className="flex items-center justify-between py-1 px-2 hover:bg-muted rounded cursor-pointer group"
      onClick={handleCopy}
      title={`Click to copy: ${fullPath}`}
    >
      <code className="text-xs text-blue-600 font-mono">{fullPath}</code>
      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
        {copied ? (
          <Check className="w-3 h-3 text-green-500" />
        ) : (
          <Copy className="w-3 h-3 text-muted-foreground" />
        )}
      </button>
    </div>
  );
};

/**
 * Node section showing all variables from one upstream node
 */
const NodeSection = ({
  node,
  isExpanded,
  onToggle,
  getToolByUuid,
}: {
  node: GraphNode;
  isExpanded: boolean;
  onToggle: () => void;
  getToolByUuid?: (uuid: string) => { outputs?: string[] } | undefined;
}) => {
  const nodeId = node.data?.config?.id || node.id;
  const nodeLabel = node.data?.config?.id || node.id;
  const defName = node.data?.defName || "";
  const outputs = getNodeOutputSchema(node, getToolByUuid);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted transition-colors text-left"
        onClick={onToggle}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="font-medium text-sm">{nodeLabel}</span>
        <span className="text-xs text-muted-foreground">
          ({getNodeTypeName(defName)})
        </span>
      </button>

      {isExpanded && (
        <div className="px-2 py-1 bg-background">
          {outputs.map((output) => (
            <VariableItem key={output} variable={output} nodeId={nodeId} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * AvailableVariables - Shows variables from upstream connected nodes
 */
export function AvailableVariables({
  currentNodeId,
}: {
  currentNodeId: string;
}) {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const { getToolByUuid } = useBackend();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {}
  );

  // Find upstream nodes (nodes that connect TO the current node)
  const upstreamNodes = useMemo(() => {
    if (!edges || !nodes || !currentNodeId) return [];

    // Get all source node IDs that have edges pointing to our current node
    const sourceNodeIds = edges
      .filter((edge: Edge) => edge.target === currentNodeId)
      .map((edge: Edge) => edge.source);

    // Get the actual node objects, excluding Start nodes
    return nodes.filter(
      (node: GraphNode) =>
        sourceNodeIds.includes(node.id) &&
        node.data?.defName !== "start"
    );
  }, [currentNodeId, nodes, edges]);

  // Don't render if no upstream nodes
  if (upstreamNodes.length === 0) {
    return null;
  }

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="border rounded-lg overflow-hidden mb-4">
        <CollapsibleTrigger className="w-full flex items-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors text-left">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-blue-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-blue-600" />
          )}
          <span className="font-medium text-blue-700">
            📥 Available Variables
          </span>
          <span className="text-xs text-blue-500">
            ({upstreamNodes.length} upstream node
            {upstreamNodes.length !== 1 ? "s" : ""})
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-3 space-y-2 bg-muted/20">
            <p className="text-xs text-muted-foreground mb-2">
              Click any variable to copy it to clipboard, then paste into your
              prompt.
            </p>
            {upstreamNodes.map((node: GraphNode) => (
              <NodeSection
                key={node.id}
                node={node}
                isExpanded={expandedNodes[node.id] !== false}
                onToggle={() => toggleNode(node.id)}
                getToolByUuid={getToolByUuid}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
