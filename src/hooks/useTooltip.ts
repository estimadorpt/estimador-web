import { useState, useCallback } from 'react';
import type { TooltipState } from '@/types/geography';
import { partyColors } from '@/lib/config/colors';

/**
 * Custom hook for managing tooltip state and logic
 */
export function useTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>({ 
    show: false, 
    x: 0, 
    y: 0, 
    content: null 
  });

  const showTooltip = useCallback((
    x: number,
    y: number,
    regionName: string,
    forecast: Record<string, number>
  ) => {
    const parties = Object.entries(forecast)
      .filter(([party]) => partyColors.hasOwnProperty(party))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    if (parties.length > 0) {
      setTooltip({
        show: true,
        x,
        y,
        content: {
          regionName,
          parties
        }
      });
    }
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip({ show: false, x: 0, y: 0, content: null });
  }, []);

  return { tooltip, showTooltip, hideTooltip };
}