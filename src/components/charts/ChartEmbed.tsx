'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';

// Dynamically import chart components to avoid SSR issues
const PollingChart = dynamic(() => import('./PollingChart'), { 
  ssr: false,
  loading: () => <ChartSkeleton />
});

const SeatChart = dynamic(() => import('./seat-projection'), { 
  ssr: false,
  loading: () => <ChartSkeleton />
});

const CoalitionDotPlot = dynamic(() => import('./CoalitionDotPlot'), { 
  ssr: false,
  loading: () => <ChartSkeleton />
});

const HouseEffects = dynamic(() => import('./HouseEffects'), { 
  ssr: false,
  loading: () => <ChartSkeleton />
});

const DistrictSummary = dynamic(() => import('./DistrictSummary'), { 
  ssr: false,
  loading: () => <ChartSkeleton />
});

function ChartSkeleton() {
  return (
    <div className="w-full h-64 bg-slate-100 rounded-md animate-pulse flex items-center justify-center">
      <p className="text-slate-500">Loading chart...</p>
    </div>
  );
}

interface ChartEmbedProps {
  type: 'polling' | 'seats' | 'coalition' | 'house-effects' | 'districts';
  title?: string;
  description?: string;
  height?: number;
}

export function ChartEmbed({ type, title, description, height = 400 }: ChartEmbedProps) {
  const renderChart = () => {
    switch (type) {
      case 'polling':
        return <PollingChart />;
      case 'seats':
        return <SeatChart />;
      case 'coalition':
        return <CoalitionDotPlot />;
      case 'house-effects':
        return <HouseEffects />;
      case 'districts':
        return <DistrictSummary />;
      default:
        return (
          <div className="w-full h-64 bg-slate-50 rounded-md flex items-center justify-center">
            <p className="text-slate-500">Chart type not found</p>
          </div>
        );
    }
  };

  return (
    <Card className="my-6 not-prose">
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle className="text-lg font-semibold text-green-dark">
              {title}
            </CardTitle>
          )}
          {description && (
            <p className="text-sm text-slate-600 leading-relaxed">
              {description}
            </p>
          )}
        </CardHeader>
      )}
      <CardContent>
        <div style={{ height: `${height}px` }} className="w-full">
          <Suspense fallback={<ChartSkeleton />}>
            {renderChart()}
          </Suspense>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for embedding charts in article content
interface ArticleChartProps {
  id: string;
  caption?: string;
}

export function ArticleChart({ id, caption }: ArticleChartProps) {
  const getChartConfig = (chartId: string) => {
    const configs = {
      'polling-trends': {
        type: 'polling' as const,
        title: 'National Polling Trends',
        description: 'Average polling support for Portuguese parties over time, with trend lines and confidence intervals.'
      },
      'seat-projection': {
        type: 'seats' as const,
        title: 'Current Seat Projection', 
        description: 'Projected seat distribution in the Assembly of the Republic based on current polling data.'
      },
      'coalition-scenarios': {
        type: 'coalition' as const,
        title: 'Coalition Formation Scenarios',
        description: 'Probability distribution of different government formation outcomes.'
      },
      'pollster-bias': {
        type: 'house-effects' as const,
        title: 'Pollster House Effects',
        description: 'Systematic differences between polling companies in party support measurement.'
      },
      'district-competition': {
        type: 'districts' as const,
        title: 'Competitive Districts Analysis',
        description: 'Districts where seats are most likely to change hands, using ENSC methodology.'
      }
    };

    return configs[chartId as keyof typeof configs] || {
      type: 'polling' as const,
      title: 'Interactive Chart',
      description: 'Data visualization from estimador.pt forecast model.'
    };
  };

  const config = getChartConfig(id);

  return (
    <div className="my-8 not-prose">
      <ChartEmbed {...config} />
      {caption && (
        <p className="text-sm text-slate-500 mt-2 text-center italic">
          {caption}
        </p>
      )}
    </div>
  );
}