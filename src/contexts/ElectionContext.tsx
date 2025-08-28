'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
      } finally {
        setIsLoading(false);
      }
    };

    loadContestants();
  }, [currentElection]);

  const switchElection = (electionId: string) => {
    try {
      const election = getElectionById(electionId);
      if (election && election.id !== currentElection.id) {
        setCurrentElection(election);
        setError(null); // Clear any previous errors
      } else if (!election) {
        setError(`Election with ID "${electionId}" not found`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch election');
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