import { useCallback, useRef } from "react";
import ReactFlow, {
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  NodeTypes,
  EdgeTypes,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import { useGraphStore } from "@/store/graph";
import { NODE_DEF_MAP } from "@/registry";
import { GenericNode } from "./nodes/GenericNode";
import { LLMNode } from "./nodes/LLMNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { ToolNode } from "./nodes/ToolNode";
import { DeletableEdge } from "./edges/DeletableEdge";

// Define node types mapping (React Flow display names → Components)
const nodeTypes: NodeTypes = {
  generic: GenericNode,
  startAgentflow: GenericNode,
  llmAgentflow: LLMNode,
  agentAgentflow: GenericNode,
  toolAgentflow: ToolNode,
  conditionflow: ConditionNode,
  foreachAgentflow: GenericNode,
  loopAgentflow: GenericNode,
  endAgentflow: GenericNode,
};

// Define edge types mapping
const edgeTypes: EdgeTypes = {
  default: DeletableEdge,
};

function CanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const setNodes = useGraphStore((state) => state.setNodes);
  const setEdges = useGraphStore((state) => state.setEdges);
  const onConnect = useGraphStore((state) => state.onConnect);
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const defName = event.dataTransfer.getData("application/reactflow");
      if (!defName) return;

      const def = NODE_DEF_MAP[defName];
      if (!def) return;

      // Get wrapper bounds for accurate positioning (Flowise pattern)
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();

      // Calculate position relative to the flow
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Generate readable ID based on node type
      // Count existing nodes of this type to create unique sequential IDs
      const existingOfType = nodes.filter(
        (n) => n.data.defName === def.name
      ).length;

      // Special handling for Start/End nodes
      let nodeId: string;
      if (def.name === "start") {
        nodeId = existingOfType === 0 ? "START" : `start_${existingOfType}`;
      } else if (def.name === "end") {
        nodeId = existingOfType === 0 ? "END" : `end_${existingOfType}`;
      } else {
        nodeId = `${def.name}_${existingOfType}`;
      }

      // Create new node instance
      const newNode = {
        id: nodeId,
        type: def.type,
        position,
        data: {
          defName: def.name,
          config: {
            // Auto-populate id field with the node's React Flow ID
            id: nodeId,
          },
        },
      };

      // Add node using ReactFlow's addNodes method
      setNodes([...nodes, newNode]);
    },
    [reactFlowInstance, nodes, setNodes]
  );

  const onNodesChange = useCallback(
    (changes: any) => {
      // Use ReactFlow's built-in applyNodeChanges helper
      setNodes(applyNodeChanges(changes, nodes));

      // Handle selection changes for Inspector
      changes.forEach((change: any) => {
        if (change.type === "select" && change.selected) {
          setSelectedNodeId(change.id);
        } else if (change.type === "select" && !change.selected) {
          // Only clear if this was the selected node
          setSelectedNodeId((currentId) =>
            currentId === change.id ? null : currentId
          );
        }
      });
    },
    [nodes, setNodes, setSelectedNodeId]
  );

  const onEdgesChange = useCallback(
    (changes: any) => {
      // Use ReactFlow's built-in applyEdgeChanges helper
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        deleteKeyCode="Delete"
      >
        <Controls position="bottom-center" />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
