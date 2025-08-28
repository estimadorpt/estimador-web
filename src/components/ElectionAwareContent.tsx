'use client';

import { useElection } from '@/contexts/ElectionContext';
import { TrendingUp } from 'lucide-react';

interface ElectionAwareContentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ElectionAwareContent({ children, fallback }: ElectionAwareContentProps) {
  const { currentElection } = useElection();
  
  // For now, only parliamentary elections are supported
  // Show parliamentary content for all election types
  return <>{children}</>;
}

export function ElectionTypeIndicator() {
  const { currentElection } = useElection();
  
  if (!currentElection) {
    return (
      <div className="mb-4 text-sm text-red-600">
        ⚠️ No election context available
      </div>
    );
  }
  
  const typeLabels = {
    parliamentary: 'Eleições Legislativas',
    presidential: 'Eleições Presidenciais', 
    municipal: 'Eleições Autárquicas',
    european: 'Eleições Europeias'
  };
  
  return (
    <div className="mb-4 text-sm text-green-dark/70">
      📊 {typeLabels[currentElection.type]} - {currentElection.name}
      <span className="ml-2 text-xs text-blue-600">[Context: ✓]</span>
    </div>
  );
}