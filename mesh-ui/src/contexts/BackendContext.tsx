/**
 * Backend Context
 *
 * Provides backend agents and tools data to all components
 */

import { createContext, useContext, ReactNode } from 'react';
import { useAgents } from '@/hooks/useAgents';
import { useTools } from '@/hooks/useTools';
import type { Agent, Tool } from '@/lib/api';

interface BackendContextValue {
  agents: Agent[];
  tools: Tool[];
  agentsLoading: boolean;
  toolsLoading: boolean;
  agentsError: string | null;
  toolsError: string | null;
}

const BackendContext = createContext<BackendContextValue | undefined>(undefined);

export function BackendProvider({ children }: { children: ReactNode }) {
  const { agents, loading: agentsLoading, error: agentsError } = useAgents();
  const { tools, loading: toolsLoading, error: toolsError } = useTools();

  return (
    <BackendContext.Provider
      value={{
        agents,
        tools,
        agentsLoading,
        toolsLoading,
        agentsError,
        toolsError,
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
