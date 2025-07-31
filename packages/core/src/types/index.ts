/**
 * Type-only exports for advanced TypeScript usage
 * 
 * This module provides type-only exports that can be imported without
 * including runtime code, useful for type definitions, interfaces,
 * and advanced TypeScript patterns.
 * 
 * @example
 * ```typescript
 * import type { 
 *   StageFlowConfig, 
 *   StageConfig, 
 *   Plugin 
 * } from '@stage-flow/core/types';
 * ```
 */

// Import types for use in utility types
import type {
  StageFlowConfig,
  StageConfig,
  Transition,
  StageContext,
  Plugin,
  Middleware,
  TransitionContext,
  StageFlowEngine
} from './core';

// Re-export all types from core
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
  StageFlowState,
  StageFlowEngine
} from './core';

// Re-export error types
export type {
  ErrorRecoveryConfig
} from './errors';

// Additional utility types for advanced usage

/**
 * Extract stage names from a StageFlowConfig type
 * 
 * @example
 * ```typescript
 * type MyConfig = StageFlowConfig<'loading' | 'form' | 'success', FormData>;
 * type MyStages = ExtractStageNames<MyConfig>; // 'loading' | 'form' | 'success'
 * ```
 */
export type ExtractStageNames<T> = T extends StageFlowConfig<infer TStage, any> ? TStage : never;

/**
 * Extract data type from a StageFlowConfig type
 * 
 * @example
 * ```typescript
 * type MyConfig = StageFlowConfig<string, FormData>;
 * type MyData = ExtractStageData<MyConfig>; // FormData
 * ```
 */
export type ExtractStageData<T> = T extends StageFlowConfig<any, infer TData> ? TData : never;

/**
 * Create a stage configuration with required fields
 * 
 * @example
 * ```typescript
 * type RequiredStageConfig = RequiredStageFields<'loading' | 'form', FormData>;
 * // Results in StageConfig with name and transitions required
 * ```
 */
export type RequiredStageFields<TStage extends string, TData = unknown> = 
  Required<Pick<StageConfig<TStage, TData>, 'name' | 'transitions'>> & 
  Partial<Omit<StageConfig<TStage, TData>, 'name' | 'transitions'>>;

/**
 * Create a transition with required target field
 * 
 * @example
 * ```typescript
 * type RequiredTransition = RequiredTransitionFields<'success' | 'error', FormData>;
 * // Results in Transition with target required
 * ```
 */
export type RequiredTransitionFields<TStage extends string, TData = unknown> = 
  Required<Pick<Transition<TStage, TData>, 'target'>> & 
  Partial<Omit<Transition<TStage, TData>, 'target'>>;

/**
 * Plugin with required install method
 * 
 * @example
 * ```typescript
 * type RequiredPlugin = RequiredPluginFields<string, any>;
 * // Results in Plugin with name and install required
 * ```
 */
export type RequiredPluginFields<TStage extends string, TData = unknown> = 
  Required<Pick<Plugin<TStage, TData>, 'name' | 'install'>> & 
  Partial<Omit<Plugin<TStage, TData>, 'name' | 'install'>>;

/**
 * Middleware with required execute method
 * 
 * @example
 * ```typescript
 * type RequiredMiddleware = RequiredMiddlewareFields<string, any>;
 * // Results in Middleware with name and execute required
 * ```
 */
export type RequiredMiddlewareFields<TStage extends string, TData = unknown> = 
  Required<Pick<Middleware<TStage, TData>, 'name' | 'execute'>>;

/**
 * Stage flow configuration with all optional fields
 * 
 * @example
 * ```typescript
 * type PartialConfig = PartialStageFlowConfig<'loading' | 'form', FormData>;
 * // Results in StageFlowConfig with only initial and stages required
 * ```
 */
export type PartialStageFlowConfig<TStage extends string, TData = unknown> = 
  Required<Pick<StageFlowConfig<TStage, TData>, 'initial' | 'stages'>> & 
  Partial<Omit<StageFlowConfig<TStage, TData>, 'initial' | 'stages'>>;

/**
 * Event handler function type for stage flow events
 * 
 * @example
 * ```typescript
 * const onStageChange: StageEventHandler<'loading' | 'form', FormData> = 
 *   (stage, data) => {
 *     console.log(`Stage changed to: ${stage}`, data);
 *   };
 * ```
 */
export type StageEventHandler<TStage extends string, TData = unknown> = 
  (stage: TStage, data?: TData) => void;

/**
 * Async event handler function type for stage flow events
 * 
 * @example
 * ```typescript
 * const onAsyncStageChange: AsyncStageEventHandler<'loading' | 'form', FormData> = 
 *   async (stage, data) => {
 *     await saveStageToDatabase(stage, data);
 *   };
 * ```
 */
export type AsyncStageEventHandler<TStage extends string, TData = unknown> = 
  (stage: TStage, data?: TData) => Promise<void>;

/**
 * Condition function type for transitions
 * 
 * @example
 * ```typescript
 * const isFormValid: TransitionCondition<'form' | 'success', FormData> = 
 *   (context) => {
 *     return context.data?.isValid === true;
 *   };
 * ```
 */
export type TransitionCondition<TStage extends string, TData = unknown> = 
  (context: StageContext<TStage, TData>) => boolean | Promise<boolean>;

/**
 * Plugin hook function type
 * 
 * @example
 * ```typescript
 * const beforeTransitionHook: PluginHook<'loading' | 'form', FormData> = 
 *   async (context) => {
 *     console.log('Before transition:', context);
 *   };
 * ```
 */
export type PluginHook<TStage extends string, TData = unknown> = 
  (context: StageContext<TStage, TData> | TransitionContext<TStage, TData>) => void | Promise<void>;

/**
 * Middleware execution function type
 * 
 * @example
 * ```typescript
 * const middlewareExecutor: MiddlewareExecutor<'loading' | 'form', FormData> = 
 *   async (context, next) => {
 *     console.log('Before transition');
 *     await next();
 *     console.log('After transition');
 *   };
 * ```
 */
export type MiddlewareExecutor<TStage extends string, TData = unknown> = 
  (context: TransitionContext<TStage, TData>, next: () => Promise<void>) => Promise<void>;

/**
 * Stage flow engine factory function type
 * 
 * @example
 * ```typescript
 * const createEngine: StageFlowEngineFactory<'loading' | 'form', FormData> = 
 *   (config) => {
 *     return new StageFlowEngine(config);
 *   };
 * ```
 */
export type StageFlowEngineFactory<TStage extends string, TData = unknown> = 
  (config: StageFlowConfig<TStage, TData>) => StageFlowEngine<TStage, TData>;

/**
 * Unsubscribe function type returned by subscribe methods
 * 
 * @example
 * ```typescript
 * const unsubscribe: UnsubscribeFunction = engine.subscribe((stage, data) => {
 *   console.log('Stage changed:', stage);
 * });
 * 
 * // Later...
 * unsubscribe();
 * ```
 */
export type UnsubscribeFunction = () => void;