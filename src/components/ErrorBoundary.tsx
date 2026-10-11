'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component for React error handling
 * Provides graceful fallback UI when component errors occur
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI or default error message
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback kind="chart" onRetry={() => this.setState({ hasError: false, error: undefined })} />;
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  componentName?: string,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary componentName={componentName} fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Map-specific error boundary with tailored error message
 */
export function MapErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      componentName="Interactive Map"
      fallback={<ErrorFallback kind="map" />}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * What a reader sees when a chart or the map fails: the instrument with no
 * reading (EmptyStateMark), one sentence in the page's language and, for a
 * chart, one way on. No coloured box: the mark and the words carry it.
 */
function ErrorFallback({ kind, onRetry }: { kind: 'chart' | 'map'; onRetry?: () => void }) {
  const pt = useLocale() !== 'en';
  const message = kind === 'map'
    ? (pt ? 'O mapa não carregou. Atualiza a página ou experimenta outro browser.' : 'The map did not load. Refresh the page or try another browser.')
    : (pt ? 'Este gráfico não carregou.' : 'This chart did not load.');
  return (
    <div role="status" className={`flex items-center gap-4 border-t border-rule py-6 ${kind === 'map' ? 'min-h-[400px]' : ''}`}>
      <EmptyStateMark />
      <div>
        <p className="text-[15px] text-ink">{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="mt-2 inline-flex min-h-11 items-center border border-ink px-4 text-[14px] font-semibold text-ink hover:bg-field">
            {pt ? 'Tentar outra vez' : 'Try again'}
          </button>
        )}
      </div>
    </div>
  );
}
