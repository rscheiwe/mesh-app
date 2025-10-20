/**
 * React Hook to fetch agents from backend
 */

import { useState, useEffect } from 'react';
import { fetchAgents, type Agent } from '@/lib/api';

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAgents() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAgents();

        if (mounted) {
          setAgents(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load agents');
          console.error('Failed to fetch agents:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAgents();

    return () => {
      mounted = false;
    };
  }, []);

  return { agents, loading, error };
}
