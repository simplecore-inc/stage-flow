/**
 * Error types for the stage flow library
 */

/**
 * Base error class for all stage flow errors
 */
export class StageFlowError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: unknown
  ) {
    super(message);
    this.name = 'StageFlowError';
  }
}

/**
 * Error thrown during stage transitions
 */
export class TransitionError extends StageFlowError {
  constructor(message: string, context?: unknown) {
    super(message, 'TRANSITION_ERROR', context);
    this.name = 'TransitionError';
  }
}

/**
 * Error thrown by plugins
 */
export class PluginError extends StageFlowError {
  constructor(message: string, context?: unknown) {
    super(message, 'PLUGIN_ERROR', context);
    this.name = 'PluginError';
  }
}

/**
 * Error thrown by middleware
 */
export class MiddlewareError extends StageFlowError {
  constructor(message: string, context?: unknown) {
    super(message, 'MIDDLEWARE_ERROR', context);
    this.name = 'MiddlewareError';
  }
}

/**
 * Error thrown for configuration issues
 */
export class ConfigurationError extends StageFlowError {
  constructor(message: string, context?: unknown) {
    super(message, 'CONFIGURATION_ERROR', context);
    this.name = 'ConfigurationError';
  }
}

/**
 * Error recovery configuration
 */
export interface ErrorRecoveryConfig {
  /** Number of retry attempts */
  retryAttempts: number;
  /** Delay between retries in milliseconds */
  retryDelay: number;
  /** Optional fallback stage */
  fallbackStage?: string;
  /** Optional error handler */
  onError?: (error: StageFlowError) => void;
}