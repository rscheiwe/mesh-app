/**
 * React Hook to fetch custom nodes from database
 */

import { useState, useEffect } from 'react';
import { fetchCustomNodes, type CustomNode } from '@/lib/api';

export function useCustomNodes() {
  const [customNodes, setCustomNodes] = useState<CustomNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadCustomNodes() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCustomNodes();

        if (mounted) {
          setCustomNodes(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load custom nodes');
          console.error('Failed to fetch custom nodes:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCustomNodes();

    return () => {
      mounted = false;
    };
  }, []);

  return { customNodes, loading, error };
}
