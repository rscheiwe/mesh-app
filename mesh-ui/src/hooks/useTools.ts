/**
 * React Hook to fetch tools from backend
 */

import { useState, useEffect } from 'react';
import { fetchTools, type Tool } from '@/lib/api';

export function useTools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadTools() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTools();

        if (mounted) {
          setTools(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load tools');
          console.error('Failed to fetch tools:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTools();

    return () => {
      mounted = false;
    };
  }, []);

  return { tools, loading, error };
}
