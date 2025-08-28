'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, Calendar, Users, MapPin, Globe } from 'lucide-react';
import { ALL_ELECTIONS, getCurrentElection } from '@/lib/config/elections';
import { useElection } from '@/contexts/ElectionContext';
import { ElectionConfig, ElectionType } from '@/types';

interface ElectionSelectorProps {
  currentElectionId?: string;
  className?: string;
}

const electionTypeIcons = {
  parliamentary: Users,
  presidential: Users,
  municipal: MapPin,
  european: Globe
};

const electionTypeLabels = {
  parliamentary: 'Legislativas',
  presidential: 'Presidenciais', 
  municipal: 'Autárquicas',
  european: 'Europeias'
};

export function ElectionSelector({ currentElectionId, className = '' }: ElectionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { currentElection: contextElection } = useElection();
  
  const currentElection = currentElectionId 
    ? ALL_ELECTIONS.find(e => e.id === currentElectionId) || getCurrentElection()
    : contextElection || getCurrentElection();

  const handleElectionChange = (election: ElectionConfig) => {
    setIsOpen(false);
    
    // Navigate to the same page but with the new election context
    const url = new URL(window.location.href);
    if (election.id === 'parliamentary-2024') {
      // For the default election, remove the parameter to clean up URL
      url.searchParams.delete('election');
    } else {
      // For other elections, set the parameter
      url.searchParams.set('election', election.id);
    }
    router.push(url.pathname + url.search);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const groupedElections = ALL_ELECTIONS.reduce((groups, election) => {
    const type = election.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(election);
    return groups;
  }, {} as Record<ElectionType, ElectionConfig[]>);

  // Sort elections within each group by date (most recent first)
  Object.keys(groupedElections).forEach(type => {
    groupedElections[type as ElectionType].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });

  const Icon = electionTypeIcons[currentElection.type];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[280px] text-left"
      >
        <Icon className="w-4 h-4 text-green-600" />
        <div className="flex-1">
          <div className="font-medium text-gray-900">{currentElection.name}</div>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(currentElection.date)}
            {currentElection.isActive && (
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                Ativa
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {Object.entries(groupedElections).map(([type, elections]) => {
            const TypeIcon = electionTypeIcons[type as ElectionType];
            const typeLabel = electionTypeLabels[type as ElectionType];
            
            return (
              <div key={type} className="border-b border-gray-100 last:border-b-0">
                <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700 flex items-center gap-2">
                  <TypeIcon className="w-4 h-4" />
                  {typeLabel}
                </div>
                {elections.map(election => (
                  <button
                    key={election.id}
                    onClick={() => handleElectionChange(election)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      election.id === currentElection.id ? 'bg-green-50 border-l-4 border-green-600' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{election.name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {formatDate(election.date)}
                      {election.isActive && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                          Ativa
                        </span>
                      )}
                      {!election.isActive && new Date(election.date) > new Date() && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Prevista
                        </span>
                      )}
                      {!election.isActive && new Date(election.date) < new Date() && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">
                          Histórica
                        </span>
                      )}
                    </div>
                    {election.description && (
                      <div className="text-xs text-gray-400 mt-1">{election.description}</div>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}