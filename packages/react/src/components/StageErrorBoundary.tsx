/**
 * StageErrorBoundary - Error boundary component for graceful error handling
 */

import React, { Component, ReactNode, ErrorInfo, ComponentType } from 'react';
import { StageFlowEngine } from '@stage-flow/core';
import { 
  ErrorBoundaryIntegration, 
  createErrorBoundaryIntegration,
  ExtendedErrorRecoveryConfig 
} from '@stage-flow/core';

/**
 * Props for StageErrorBoundary component
 */
export interface StageErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Optional fallback component to render on error */
  fallback?: ComponentType<StageErrorFallbackProps>;
  /** Optional error handler callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional flag to reset error state when children change */
  resetOnPropsChange?: boolean;
  /** Optional reset keys to watch for changes */
  resetKeys?: Array<string | number>;
  /** Optional stage flow engine for error recovery integration */
  engine?: StageFlowEngine<any, any>;
  /** Optional error recovery configuration */
  errorRecoveryConfig?: Partial<ExtendedErrorRecoveryConfig>;
  /** Optional flag to enable automatic retry on error */
  enableRetry?: boolean;
  /** Optional maximum number of automatic retries */
  maxRetries?: number;
}

/**
 * Props for error fallback component
 */
export interface StageErrorFallbackProps {
  /** The error that occurred */
  error: Error;
  /** Error information from React */
  errorInfo: ErrorInfo;
  /** Function to reset the error boundary */
  resetError: () => void;
  /** Function to retry the failed operation */
  retry?: () => void;
  /** Whether retry is available */
  canRetry?: boolean;
  /** Current stage when error occurred */
  currentStage?: string;
  /** Fallback stage if configured */
  fallbackStage?: string;
  /** Number of retry attempts made */
  retryAttempts?: number;
  /** Maximum retry attempts allowed */
  maxRetries?: number;
}

/**
 * State for StageErrorBoundary component
 */
interface StageErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred */
  error: Error | null;
  /** Error information from React */
  errorInfo: ErrorInfo | null;
  /** Previous reset keys for comparison */
  prevResetKeys?: Array<string | number>;
  /** Number of retry attempts made */
  retryAttempts: number;
  /** Whether a retry is in progress */
  isRetrying: boolean;
  /** Error boundary integration instance */
  errorBoundaryIntegration?: ErrorBoundaryIntegration;
}

/**
 * Default fallback component for errors
 */
const DefaultErrorFallback: React.ComponentType<StageErrorFallbackProps> = ({
  error,
  resetError,
  retry,
  canRetry = false,
  currentStage,
  fallbackStage,
  retryAttempts = 0,
  maxRetries = 3
}): React.JSX.Element => (
  <div style={{
    padding: '20px',
    border: '1px solid #ff6b6b',
    borderRadius: '4px',
    backgroundColor: '#ffe0e0',
    color: '#d63031'
  }}>
    <h3>Stage Flow Error</h3>
    <p><strong>Error:</strong> {error.message}</p>
    {currentStage && (
      <p><strong>Current Stage:</strong> {currentStage}</p>
    )}
    {retryAttempts > 0 && (
      <p><strong>Retry Attempts:</strong> {retryAttempts} / {maxRetries}</p>
    )}
    <details style={{ marginTop: '10px' }}>
      <summary>Error Details</summary>
      <pre style={{
        marginTop: '10px',
        padding: '10px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '12px',
        overflow: 'auto'
      }}>
        {error.stack}
      </pre>
    </details>
    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
      {canRetry && retry && retryAttempts < maxRetries && (
        <button
          onClick={retry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#00b894',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry ({maxRetries - retryAttempts} attempts left)
        </button>
      )}
      <button
        onClick={resetError}
        style={{
          padding: '8px 16px',
          backgroundColor: '#d63031',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Reset
      </button>
      {fallbackStage && (
        <span style={{
          padding: '8px 16px',
          backgroundColor: '#fdcb6e',
          color: '#2d3436',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Fallback: {fallbackStage}
        </span>
      )}
    </div>
  </div>
);

/**
 * Error boundary component that catches JavaScript errors in stage components
 * and displays a fallback UI instead of crashing the entire application
 */
export class StageErrorBoundary extends Component<
  StageErrorBoundaryProps,
  StageErrorBoundaryState
> {
  constructor(props: StageErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      prevResetKeys: props.resetKeys,
      retryAttempts: 0,
      isRetrying: false,
      errorBoundaryIntegration: props.engine 
        ? createErrorBoundaryIntegration(props.engine, props.errorRecoveryConfig)
        : undefined
    };
  }

  /**
   * Static method called when an error occurs
   */
  static getDerivedStateFromError(error: Error): Partial<StageErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  /**
   * Static method to check if error boundary should reset
   */
  static getDerivedStateFromProps(
    props: StageErrorBoundaryProps,
    state: StageErrorBoundaryState
  ): Partial<StageErrorBoundaryState> | null {
    const { resetKeys, resetOnPropsChange } = props;
    const { prevResetKeys, hasError } = state;

    // Reset error if resetKeys have changed
    if (hasError && resetKeys && prevResetKeys) {
      if (resetKeys.length !== prevResetKeys.length ||
          resetKeys.some((key, idx) => key !== prevResetKeys[idx])) {
        return {
          hasError: false,
          error: null,
          errorInfo: null,
          prevResetKeys: resetKeys
        };
      }
    }

    // Reset error if resetOnPropsChange is true and we have an error
    if (hasError && resetOnPropsChange) {
      return {
        hasError: false,
        error: null,
        errorInfo: null,
        prevResetKeys: resetKeys
      };
    }

    // Update prevResetKeys if they changed
    if (resetKeys !== prevResetKeys) {
      return {
        prevResetKeys: resetKeys
      };
    }

    return null;
  }

  /**
   * Called when an error occurs
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorInfo
    });

    // Use error boundary integration if available
    if (this.state.errorBoundaryIntegration) {
      this.state.errorBoundaryIntegration.handleError(error, errorInfo);
    }

    // Call the error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('StageErrorBoundary caught an error:', error, errorInfo);
    }

    // Attempt automatic retry if enabled
    if (this.props.enableRetry && this.state.retryAttempts < (this.props.maxRetries || 3)) {
      this.attemptRetry();
    }
  }

  /**
   * Reset the error boundary state
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryAttempts: 0,
      isRetrying: false
    });
  };

  /**
   * Attempt to retry after an error
   */
  attemptRetry = (): void => {
    if (this.state.retryAttempts >= (this.props.maxRetries || 3)) {
      return;
    }

    this.setState(prevState => ({
      isRetrying: true,
      retryAttempts: prevState.retryAttempts + 1
    }));

    // Reset error state after a short delay to trigger re-render
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false
      });
    }, 100);
  };

  /**
   * Manual retry function for user-triggered retries
   */
  retry = (): void => {
    if (this.state.errorBoundaryIntegration?.shouldReset(this.state.error!)) {
      this.attemptRetry();
    }
  };

  render(): React.JSX.Element {
    const { hasError, error, errorInfo, retryAttempts, isRetrying, errorBoundaryIntegration } = this.state;
    const { children, fallback: FallbackComponent = DefaultErrorFallback, engine, maxRetries = 3 } = this.props;

    if (isRetrying) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666'
        }}>
          Retrying... (Attempt {retryAttempts})
        </div>
      );
    }

    if (hasError && error) {
      const fallbackProps = errorBoundaryIntegration?.getFallbackProps(error) || {};
      
      return (
        <FallbackComponent
          error={error}
          errorInfo={errorInfo!}
          resetError={this.resetError}
          retry={this.retry}
          canRetry={errorBoundaryIntegration?.shouldReset(error) ?? true}
          currentStage={engine?.getCurrentStage()}
          retryAttempts={retryAttempts}
          maxRetries={maxRetries}
          {...fallbackProps}
        />
      );
    }

    return children as React.JSX.Element;
  }
}

/**
 * Hook-based error boundary for functional components
 * This is a wrapper around the class-based StageErrorBoundary
 */
export interface UseErrorBoundaryOptions {
  /** Optional error handler callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional fallback component */
  fallback?: ComponentType<StageErrorFallbackProps>;
  /** Optional stage flow engine for error recovery */
  engine?: StageFlowEngine<any, any>;
  /** Optional error recovery configuration */
  errorRecoveryConfig?: Partial<ExtendedErrorRecoveryConfig>;
  /** Optional flag to enable automatic retry */
  enableRetry?: boolean;
  /** Optional maximum number of retries */
  maxRetries?: number;
}

/**
 * Higher-order component that wraps a component with error boundary
 */
export function withStageErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: UseErrorBoundaryOptions = {}
): ComponentType<P> {
  const WrappedComponent = (props: P): React.JSX.Element => (
    <StageErrorBoundary
      onError={options.onError}
      fallback={options.fallback}
      engine={options.engine}
      errorRecoveryConfig={options.errorRecoveryConfig}
      enableRetry={options.enableRetry}
      maxRetries={options.maxRetries}
    >
      <Component {...props} />
    </StageErrorBoundary>
  );

  WrappedComponent.displayName = `withStageErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}