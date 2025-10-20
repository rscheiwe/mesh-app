import { create } from "zustand";
import type { Node, Edge, Connection } from "reactflow";
import { addEdge } from "reactflow";
import type { NodeInstanceData, FlowJson } from "@/types";

export type GraphNode = Node<NodeInstanceData>;

interface GraphState {
  nodes: GraphNode[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Node operations
  setNodes: (nodes: GraphNode[]) => void;
  addNode: (node: GraphNode) => void;
  updateNode: (id: string, data: Partial<NodeInstanceData>) => void;
  deleteNode: (id: string) => void;

  // Edge operations
  setEdges: (edges: Edge[]) => void;
  onConnect: (connection: Connection) => void;
  deleteEdge: (id: string) => void;

  // Selection
  setSelectedNodeId: (id: string | null | ((current: string | null) => string | null)) => void;
  getSelectedNode: () => GraphNode | null;

  // Serialization
  toFlowJson: () => FlowJson;
  fromFlowJson: (flow: FlowJson) => void;

  // Clear
  clearGraph: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  // Node operations
  setNodes: (nodes) => set({ nodes }),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  updateNode: (id, data) =>
    set((state) => {
      // Check if we're updating the node ID
      const newNodeId = data.config?.id;
      const shouldUpdateNodeId = newNodeId && newNodeId !== id;

      return {
        nodes: state.nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                // Update React Flow node ID if config.id changed
                id: shouldUpdateNodeId ? newNodeId : node.id,
                data: {
                  ...node.data,
                  ...data,
                  config: {
                    ...node.data.config,
                    ...data.config,
                  },
                },
              }
            : node
        ),
        // Update edges if node ID changed
        edges: shouldUpdateNodeId
          ? state.edges.map((edge) => ({
              ...edge,
              source: edge.source === id ? newNodeId : edge.source,
              target: edge.target === id ? newNodeId : edge.target,
            }))
          : state.edges,
        // Update selected node ID if it was the changed node
        selectedNodeId:
          shouldUpdateNodeId && state.selectedNodeId === id
            ? newNodeId
            : state.selectedNodeId,
      };
    }),

  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    })),

  // Edge operations
  setEdges: (edges) => set({ edges }),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(connection, state.edges),
    })),

  deleteEdge: (id) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
    })),

  // Selection
  setSelectedNodeId: (id) =>
    set((state) => ({
      selectedNodeId: typeof id === 'function' ? id(state.selectedNodeId) : id
    })),

  getSelectedNode: () => {
    const state = get();
    if (!state.selectedNodeId) return null;
    return state.nodes.find((n) => n.id === state.selectedNodeId) || null;
  },

  // Serialization
  toFlowJson: () => {
    const state = get();
    return {
      nodes: state.nodes.map((node) => ({
        id: node.id,
        type: node.type || "generic",
        position: node.position,
        data: {
          name: node.type || "generic",
          label: node.data.defName || node.type,
          inputs: node.data.config || {},
        },
      })),
      edges: state.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle || undefined,
        target: edge.target,
        targetHandle: edge.targetHandle || undefined,
        data: edge.data,
      })),
    };
  },

  fromFlowJson: (flow) => {
    set({
      nodes: flow.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      })),
      edges: flow.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: edge.target,
        targetHandle: edge.targetHandle,
        data: edge.data,
      })),
      selectedNodeId: null,
    });
  },

  // Clear
  clearGraph: () =>
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
    }),
}));
