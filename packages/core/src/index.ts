/**
 * @stage-flow/core - Framework-agnostic stage flow engine
 */

// Export all types
export * from './types/core';
export * from './types/errors';

// Export the main engine
export { StageFlowEngine } from './engine';

// Export built-in middleware
export * from './middleware/built-in';

// Export effect system
export * from './effects';

// Export migration utilities
export * from './migration/legacy-adapter';

// Export error recovery system
export * from './error-recovery';

// Export validation system
export * from './validation';

// Re-export commonly used types for convenience
export type {
  StageFlowConfig,
  StageConfig,
  Transition,
  StageContext,
  StageHook,
  EffectConfig,
  BuiltInEffectType,
  CustomEffectDefinition,
  EffectRegistry,
  Plugin,
  Middleware,
  TransitionContext,
  PersistenceConfig,
  StageFlowState
} from './types/core';

export {
  StageFlowError,
  TransitionError,
  PluginError,
  MiddlewareError,
  ConfigurationError
} from './types/errors';

export type { ErrorRecoveryConfig } from './types/errors';