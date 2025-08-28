'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { ElectionConfig, ContestantData } from '@/types';
import { getCurrentElection, getElectionById, getElectionContestants } from '@/lib/config/elections';
import { getParliamentaryContestants } from '@/lib/config/colors';

interface ElectionContextType {
  currentElection: ElectionConfig;
  contestants: ContestantData[];
  switchElection: (electionId: string) => void;
  isLoading: boolean;
  error: string | null;
}

const ElectionContext = createContext<ElectionContextType | undefined>(undefined);

interface ElectionProviderProps {
  children: ReactNode;
  initialElectionId?: string;
}

export function ElectionProvider({ children, initialElectionId }: ElectionProviderProps) {
  const searchParams = useSearchParams();
  const [currentElection, setCurrentElection] = useState<ElectionConfig>(() => {
    if (initialElectionId) {
      return getElectionById(initialElectionId) || getCurrentElection();
    }
    return getCurrentElection();
  });
  
  const [contestants, setContestants] = useState<ContestantData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load contestants when election changes
  useEffect(() => {
    const loadContestants = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let electionContestants: ContestantData[] = [];
        
        // Get contestants based on election type
        if (currentElection.type === 'parliamentary') {
          electionContestants = getParliamentaryContestants();
        } else {
          electionContestants = getElectionContestants(currentElection.id);
        }
        
        setContestants(electionContestants);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contestants');
        console.error('Error loading contestants:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadContestants();
  }, [currentElection]);

  // Listen for URL parameter changes using Next.js hook
  useEffect(() => {
    const electionParam = searchParams.get('election');
    
    console.log('SearchParams change detected:', {
      electionParam,
      currentId: currentElection.id,
      searchParamsString: searchParams.toString()
    });
    
    if (electionParam && electionParam !== currentElection.id) {
      // URL has an election parameter and it's different from current
      const election = getElectionById(electionParam);
      console.log('Switching to election from URL:', election);
      if (election) {
        setCurrentElection(election);
      }
    } else if (!electionParam && currentElection.id !== 'parliamentary-2024') {
      // No URL parameter - default to 2024 election
      console.log('No election param, switching to default 2024');
      const defaultElection = getElectionById('parliamentary-2024');
      if (defaultElection) {
        setCurrentElection(defaultElection);
      }
    }
  }, [searchParams]); // React to searchParams changes

  const switchElection = (electionId: string) => {
    const election = getElectionById(electionId);
    if (election && election.id !== currentElection.id) {
      // Don't update state here - let the URL change trigger the effect
      console.log('switchElection called for:', electionId);
    }
  };

  const value: ElectionContextType = {
    currentElection,
    contestants,
    switchElection,
    isLoading,
    error
  };

  return (
    <ElectionContext.Provider value={value}>
      {children}
    </ElectionContext.Provider>
  );
}

export function useElection(): ElectionContextType {
  const context = useContext(ElectionContext);
  if (context === undefined) {
    throw new Error('useElection must be used within an ElectionProvider');
  }
  return context;
}

// Hook to get election-specific data paths
export function useElectionDataPaths() {
  const { currentElection } = useElection();
  
  const getDataPath = (filename: string): string => {
    // For now, all data is in the same directory
    // Later, we can organize by election: `/data/${currentElection.id}/${filename}`
    return `/data/${filename}`;
  };
  
  const getElectionSpecificPath = (filename: string): string => {
    // Future: election-specific data organization
    return `/data/elections/${currentElection.id}/${filename}`;
  };
  
  return {
    getDataPath,
    getElectionSpecificPath,
    electionId: currentElection.id,
    electionType: currentElection.type
  };
}

// Hook for election-specific chart filtering
export function useElectionFiltering() {
  const { currentElection, contestants } = useElection();
  
  const filterDataByContestants = <T extends Record<string, any>>(
    data: T[], 
    contestantKey: string = 'party'
  ): T[] => {
    const validContestantIds = new Set(contestants.map(c => c.id));
    return data.filter(item => validContestantIds.has(item[contestantKey]));
  };
  
  const getValidContestantIds = (): string[] => {
    return contestants.map(c => c.id);
  };
  
  const isValidContestant = (contestantId: string): boolean => {
    return contestants.some(c => c.id === contestantId);
  };
  
  return {
    filterDataByContestants,
    getValidContestantIds,
    isValidContestant,
    contestants,
    electionType: currentElection.type
  };
}