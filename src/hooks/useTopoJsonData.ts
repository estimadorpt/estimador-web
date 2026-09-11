import { useState, useEffect, useCallback } from 'react';
import type { PortugalTopoJSON } from '@/types/geography';

export function useTopoJsonData() {
  const [portugalTopoJson, setPortugalTopoJson] = useState<PortugalTopoJSON | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setIsLoading(true);
    setError(null);
    async function load() {
      try {
        const response = await fetch('/data/elections/parliamentary-2025/Portugal-Distritos-Ilhas_TopoJSON.json', { signal: controller.signal });
        if (!response.ok) throw new Error('Map unavailable');
        const data = await response.json();
        if (data?.type !== 'Topology' || !Array.isArray(data.objects?.ilhasGeo2?.geometries) || !Array.isArray(data.arcs)) throw new Error('Invalid map data');
        if (!cancelled) setPortugalTopoJson(data);
      } catch {
        if (!cancelled) { setPortugalTopoJson(null); setError('Map unavailable'); }
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [attempt]);
  return { portugalTopoJson, isLoading, error, retry };
}
