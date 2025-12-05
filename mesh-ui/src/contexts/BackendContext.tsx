/**
 * Backend Context
 *
 * Provides backend data to all components, loaded once at app startup.
 * This includes agents, tools (with full metadata), agent flows, and data handlers.
 */

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import {
  fetchAgents,
  fetchToolNodes,
  fetchAgentFlows,
  fetchDataHandlers,
  type Agent,
  type ToolNode,
  type AgentFlow,
} from '@/lib/api';

interface BackendContextValue {
  // Agents
  agents: Agent[];
  agentsLoading: boolean;
  agentsError: string | null;

  // Tool nodes (with full metadata: inputs, outputs)
  toolNodes: ToolNode[];
  toolNodesLoading: boolean;
  toolNodesError: string | null;

  // Agent flows (for subflow selection)
  agentFlows: AgentFlow[];
  agentFlowsLoading: boolean;
  agentFlowsError: string | null;

  // Data handlers
  dataHandlers: ToolNode[];
  dataHandlersLoading: boolean;
  dataHandlersError: string | null;

  // Helper to get tool by UUID
  getToolByUuid: (uuid: string) => ToolNode | undefined;

  // Helper to get agent flow by UUID
  getAgentFlowByUuid: (uuid: string) => AgentFlow | undefined;

  // Helper to get data handler by UUID
  getDataHandlerByUuid: (uuid: string) => ToolNode | undefined;

  // Legacy compatibility
  tools: ToolNode[];
  toolsLoading: boolean;
  toolsError: string | null;
}

const BackendContext = createContext<BackendContextValue | undefined>(undefined);

export function BackendProvider({ children }: { children: ReactNode }) {
  // Agents state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  // Tool nodes state
  const [toolNodes, setToolNodes] = useState<ToolNode[]>([]);
  const [toolNodesLoading, setToolNodesLoading] = useState(true);
  const [toolNodesError, setToolNodesError] = useState<string | null>(null);

  // Agent flows state
  const [agentFlows, setAgentFlows] = useState<AgentFlow[]>([]);
  const [agentFlowsLoading, setAgentFlowsLoading] = useState(true);
  const [agentFlowsError, setAgentFlowsError] = useState<string | null>(null);

  // Data handlers state
  const [dataHandlers, setDataHandlers] = useState<ToolNode[]>([]);
  const [dataHandlersLoading, setDataHandlersLoading] = useState(true);
  const [dataHandlersError, setDataHandlersError] = useState<string | null>(null);

  // Load all data once on mount
  useEffect(() => {
    let mounted = true;

    async function loadAllData() {
      // Fetch agents
      try {
        const agentsData = await fetchAgents();
        if (mounted) setAgents(agentsData);
      } catch (err) {
        if (mounted) {
          setAgentsError(err instanceof Error ? err.message : 'Failed to load agents');
          console.error('Failed to fetch agents:', err);
        }
      } finally {
        if (mounted) setAgentsLoading(false);
      }

      // Fetch tool nodes
      try {
        const toolNodesData = await fetchToolNodes();
        if (mounted) setToolNodes(toolNodesData);
      } catch (err) {
        if (mounted) {
          setToolNodesError(err instanceof Error ? err.message : 'Failed to load tools');
          console.error('Failed to fetch tool nodes:', err);
        }
      } finally {
        if (mounted) setToolNodesLoading(false);
      }

      // Fetch agent flows
      try {
        const agentFlowsData = await fetchAgentFlows();
        if (mounted) setAgentFlows(agentFlowsData);
      } catch (err) {
        if (mounted) {
          setAgentFlowsError(err instanceof Error ? err.message : 'Failed to load agent flows');
          console.error('Failed to fetch agent flows:', err);
        }
      } finally {
        if (mounted) setAgentFlowsLoading(false);
      }

      // Fetch data handlers
      try {
        const dataHandlersData = await fetchDataHandlers();
        if (mounted) setDataHandlers(dataHandlersData);
      } catch (err) {
        if (mounted) {
          setDataHandlersError(err instanceof Error ? err.message : 'Failed to load data handlers');
          console.error('Failed to fetch data handlers:', err);
        }
      } finally {
        if (mounted) setDataHandlersLoading(false);
      }
    }

    loadAllData();

    return () => {
      mounted = false;
    };
  }, []);

  // Helper functions
  const getToolByUuid = (uuid: string) => toolNodes.find((t) => t.name === uuid);
  const getAgentFlowByUuid = (uuid: string) => agentFlows.find((f) => f.name === uuid);
  const getDataHandlerByUuid = (uuid: string) => dataHandlers.find((d) => d.name === uuid);

  return (
    <BackendContext.Provider
      value={{
        agents,
        agentsLoading,
        agentsError,

        toolNodes,
        toolNodesLoading,
        toolNodesError,

        agentFlows,
        agentFlowsLoading,
        agentFlowsError,

        dataHandlers,
        dataHandlersLoading,
        dataHandlersError,

        getToolByUuid,
        getAgentFlowByUuid,
        getDataHandlerByUuid,

        // Legacy compatibility (alias toolNodes as tools)
        tools: toolNodes,
        toolsLoading: toolNodesLoading,
        toolsError: toolNodesError,
      }}
    >
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend() {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error('useBackend must be used within BackendProvider');
  }
  return context;
}
