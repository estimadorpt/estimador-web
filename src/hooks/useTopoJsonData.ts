import { useState, useEffect } from 'react';
import type { PortugalTopoJSON } from '@/types/geography';

/**
 * Custom hook to load and manage TopoJSON data for Portuguese districts
 */
export function useTopoJsonData() {
  const [portugalTopoJson, setPortugalTopoJson] = useState<PortugalTopoJSON | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side only loading
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    async function loadTopoJson() {
      try {
        console.log('useTopoJsonData: Starting TopoJSON fetch...');
        const response = await fetch('/data/Portugal-Distritos-Ilhas_TopoJSON.json');
        console.log('useTopoJsonData: Fetch response status:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`Failed to load TopoJSON data: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('useTopoJsonData: TopoJSON loaded successfully, type:', data.type);
        setPortugalTopoJson(data);
        setIsLoading(false);
      } catch (err) {
        console.error('useTopoJsonData: Error loading TopoJSON:', err);
        setError('Failed to load map data');
        setIsLoading(false);
      }
    }

    loadTopoJson();
  }, [isClient]);

  return { portugalTopoJson, isLoading, error };
}