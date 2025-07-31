/**
 * Error recovery mechanisms for the stage flow library
 * 
 * This module provides retry logic, error recovery strategies, and integration
 * with the stage flow engine to handle errors gracefully and provide fallback
 * mechanisms when transitions or operations fail.
 */

import {
  StageFlowError,
  ErrorRecoveryConfig
} from './types/errors';
import { StageFlowEngine } from './engine';

/**
 * Extended error recovery configuration with additional options
 */
export interface ExtendedErrorRecoveryConfig extends ErrorRecoveryConfig {
  /** Maximum total time to spend on retries (in milliseconds) */
  maxRetryTime?: number;
  /** Exponential backoff multiplier for retry delays */
  backoffMultiplier?: number;
  /** Maximum delay between retries (in milliseconds) */
  maxRetryDelay?: number;
  /** Function to determine if an error should be retried */
  shouldRetry?: (error: StageFlowError, attempt: number) => boolean;
  /** Function called before each retry attempt */
  onRetry?: (error: StageFlowError, attempt: number, delay: number) => void;
  /** Function called when all retries are exhausted */
  onRetryExhausted?: (error: StageFlowError, totalAttempts: number) => void;
}

/**
 * Default error recovery configuration
 */
export const DEFAULT_ERROR_RECOVERY_CONFIG = {
  retryAttempts: 3,
  retryDelay: 1000,
  maxRetryTime: 30000,
  backoffMultiplier: 2,
  maxRetryDelay: 10000,
  fallbackStage: undefined as string | undefined,
  shouldRetry: (error: StageFlowError, attempt: number) => {
    // Don't retry configuration errors or if we've exceeded max attempts
    if (error.code === 'CONFIGURATION_ERROR') {
      return false;
    }
    return attempt <= 3;
  },
  onRetry: (error: StageFlowError, attempt: number, delay: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Retrying operation after error (attempt ${attempt}):`, error.message, `Delay: ${delay}ms`);
    }
  },
  onRetryExhausted: (error: StageFlowError, totalAttempts: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`All retry attempts exhausted (${totalAttempts} attempts):`, error.message);
    }
  },
  onError: (error: StageFlowError) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Stage flow error occurred:', error.message, error.context);
    }
  }
} as const;

/**
 * Error recovery manager that handles retry logic and fallback strategies
 */
export class ErrorRecoveryManager<TStage extends string, TData = unknown> {
  private config: ExtendedErrorRecoveryConfig;
  private engine: StageFlowEngine<TStage, TData>;

  constructor(
    engine: StageFlowEngine<TStage, TData>,
    config: Partial<ExtendedErrorRecoveryConfig> = {}
  ) {
    this.engine = engine;
    this.config = { ...DEFAULT_ERROR_RECOVERY_CONFIG, ...config };
  }

  /**
   * Executes an operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> {
    const startTime = Date.now();
    let lastError: StageFlowError;
    let attempt = 0;

    while (attempt < this.config.retryAttempts) {
      attempt++;

      try {
        return await operation();
      } catch (error) {
        // Convert non-StageFlowError to StageFlowError
        if (!(error instanceof StageFlowError)) {
          lastError = new StageFlowError(
            `${operationName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'OPERATION_ERROR',
            { originalError: error, operationName, attempt }
          );
        } else {
          lastError = error;
        }

        // Check if we should retry this error
        if (!this.config.shouldRetry?.(lastError, attempt)) {
          break;
        }

        // Check if we've exceeded the maximum retry time
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= (this.config.maxRetryTime ?? 30000)) {
          break;
        }

        // Calculate delay with exponential backoff
        const baseDelay = (this.config.retryDelay ?? 1000) * Math.pow((this.config.backoffMultiplier ?? 2), attempt - 1);
        const delay = Math.min(baseDelay, (this.config.maxRetryDelay ?? 10000));

        // Call retry callback
        this.config.onRetry?.(lastError, attempt, delay);

        // Wait before retrying
        await this.delay(delay);
      }
    }

    // All retries exhausted
    this.config.onRetryExhausted?.(lastError!, attempt);
    this.config.onError?.(lastError!);

    // Try fallback if configured
    if (this.config.fallbackStage) {
      try {
        await this.engine.goTo(this.config.fallbackStage as TStage);
        throw new StageFlowError(
          `${operationName} failed after ${attempt} attempts, navigated to fallback stage: ${this.config.fallbackStage}`,
          'FALLBACK_EXECUTED',
          { originalError: lastError!, totalAttempts: attempt, fallbackStage: this.config.fallbackStage }
        );
      } catch (fallbackError) {
        // If fallback also fails, throw the original error
        throw lastError!;
      }
    }

    throw lastError!;
  }

  /**
   * Wraps a stage transition with retry logic
   */
  async transitionWithRetry(
    transitionFn: () => Promise<void>,
    transitionName: string = 'transition'
  ): Promise<void> {
    return this.executeWithRetry(transitionFn, `Stage ${transitionName}`);
  }

  /**
   * Wraps plugin installation with retry logic
   */
  async installPluginWithRetry(
    pluginName: string,
    installFn: () => Promise<void>
  ): Promise<void> {
    return this.executeWithRetry(installFn, `Plugin installation (${pluginName})`);
  }

  /**
   * Wraps middleware execution with retry logic
   */
  async executeMiddlewareWithRetry(
    middlewareName: string,
    executeFn: () => Promise<void>
  ): Promise<void> {
    return this.executeWithRetry(executeFn, `Middleware execution (${middlewareName})`);
  }

  /**
   * Updates the error recovery configuration
   */
  updateConfig(newConfig: Partial<ExtendedErrorRecoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets the current error recovery configuration
   */
  getConfig(): ExtendedErrorRecoveryConfig {
    return { ...this.config };
  }

  /**
   * Utility method to create a delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Error recovery plugin that adds retry capabilities to the engine
 */
export class ErrorRecoveryPlugin<TStage extends string, TData = unknown> {
  name = 'error-recovery';
  version = '1.0.0';
  
  private recoveryManager?: ErrorRecoveryManager<TStage, TData>;
  private config: Partial<ExtendedErrorRecoveryConfig>;

  constructor(config: Partial<ExtendedErrorRecoveryConfig> = {}) {
    this.config = config;
  }

  async install(engine: StageFlowEngine<TStage, TData>): Promise<void> {
    this.recoveryManager = new ErrorRecoveryManager(engine, this.config);
    
    // Add recovery manager to plugin state for access by other components
    this.state = {
      recoveryManager: this.recoveryManager
    };
  }

  async uninstall(): Promise<void> {
    this.recoveryManager = undefined;
    this.state = {};
  }

  /**
   * Get the recovery manager instance
   */
  getRecoveryManager(): ErrorRecoveryManager<TStage, TData> | undefined {
    return this.recoveryManager;
  }

  state?: Record<string, unknown>;
}

/**
 * Utility function to wrap any async operation with error recovery
 */
export async function withErrorRecovery<T>(
  operation: () => Promise<T>,
  config: Partial<ExtendedErrorRecoveryConfig> = {},
  operationName: string = 'operation'
): Promise<T> {
  // Create a temporary recovery manager for standalone operations
  const tempEngine = {} as StageFlowEngine<string, unknown>;
  const recoveryManager = new ErrorRecoveryManager(tempEngine, config);
  
  return recoveryManager.executeWithRetry(operation, operationName);
}

/**
 * Error boundary integration utilities for React components
 */
export interface ErrorBoundaryIntegration {
  /** Function to handle errors caught by error boundaries */
  handleError: (error: Error, errorInfo: any) => void;
  /** Function to determine if error boundary should reset */
  shouldReset: (error: Error) => boolean;
  /** Function to get fallback props for error display */
  getFallbackProps: (error: Error) => Record<string, unknown>;
}

/**
 * Creates error boundary integration for stage flow errors
 */
export function createErrorBoundaryIntegration<TStage extends string, TData = unknown>(
  engine: StageFlowEngine<TStage, TData>,
  config: Partial<ExtendedErrorRecoveryConfig> = {}
): ErrorBoundaryIntegration {
  const recoveryManager = new ErrorRecoveryManager(engine, config);

  return {
    handleError: (error: Error, errorInfo: any) => {
      // Convert to StageFlowError if needed
      const stageFlowError = error instanceof StageFlowError 
        ? error 
        : new StageFlowError(
            `React error boundary caught error: ${error.message}`,
            'REACT_ERROR',
            { originalError: error, errorInfo }
          );

      // Call the configured error handler
      recoveryManager.getConfig().onError?.(stageFlowError);

      // Navigate to fallback stage if configured
      if (recoveryManager.getConfig().fallbackStage) {
        engine.goTo(recoveryManager.getConfig().fallbackStage as TStage)
          .catch(fallbackError => {
            console.error('Failed to navigate to fallback stage:', fallbackError);
          });
      }
    },

    shouldReset: (error: Error) => {
      // Reset for non-critical errors
      if (error instanceof StageFlowError) {
        return error.code !== 'CONFIGURATION_ERROR';
      }
      return true;
    },

    getFallbackProps: (error: Error) => {
      return {
        error,
        canRetry: !(error instanceof StageFlowError && error.code === 'CONFIGURATION_ERROR'),
        currentStage: engine.getCurrentStage(),
        fallbackStage: recoveryManager.getConfig().fallbackStage
      };
    }
  };
}