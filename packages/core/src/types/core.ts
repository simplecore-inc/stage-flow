/**
 * Core type definitions for the stage flow library
 * 
 * This module provides comprehensive TypeScript definitions for the stage flow system,
 * enabling type-safe stage management with full IDE support and IntelliSense.
 * 
 * @example
 * ```typescript
 * import { StageFlowConfig, StageFlowEngine } from '@stage-flow/core';
 * 
 * type MyStages = 'loading' | 'form' | 'success';
 * interface MyData { userId?: string; }
 * 
 * const config: StageFlowConfig<MyStages, MyData> = {
 *   initial: 'loading',
 *   stages: [
 *     {
 *       name: 'loading',
 *       transitions: [{ target: 'form', event: 'loaded' }]
 *     }
 *   ]
 * };
 * 
 * const engine = new StageFlowEngine(config);
 * ```
 */

/**
 * Generic stage flow configuration interface
 * 
 * This is the main configuration object that defines the entire stage flow behavior.
 * It includes stage definitions, transitions, effects, plugins, and other settings.
 * 
 * @template TStage - Union type of all possible stage names (must extend string)
 * @template TData - Type of data associated with stages (defaults to unknown)
 * 
 * @example
 * ```typescript
 * type AppStages = 'loading' | 'form' | 'success' | 'error';
 * interface AppData {
 *   username?: string;
 *   error?: string;
 * }
 * 
 * const config: StageFlowConfig<AppStages, AppData> = {
 *   initial: 'loading',
 *   stages: [
 *     {
 *       name: 'loading',
 *       transitions: [
 *         { target: 'form', duration: 2000 },
 *         { target: 'error', event: 'error' }
 *       ]
 *     },
 *     // ... other stages
 *   ],
 *   effects: {
 *     fadeIn: { type: 'fade', duration: 300 }
 *   }
 * };
 * ```
 */
export interface StageFlowConfig<TStage extends string, TData = unknown> {
  /** 
   * Initial stage to start with when the engine is created
   * 
   * Must be one of the stage names defined in the stages array.
   * The engine will begin in this stage when started.
   */
  initial: TStage;
  
  /** 
   * Array of stage configurations defining all possible stages
   * 
   * Each stage must have a unique name and define its possible transitions.
   * Stages can include lifecycle hooks, effects, and stage-specific data.
   */
  stages: StageConfig<TStage, TData>[];
  
  /** 
   * Optional effect configurations for stage transitions
   * 
   * Effects define visual animations or transitions that occur when moving
   * between stages. Each effect is referenced by name from stage configurations.
   * 
   * @example
   * ```typescript
   * effects: {
   *   slideIn: { type: 'slide', duration: 400, easing: 'ease-out' },
   *   fadeOut: { type: 'fade', duration: 200 }
   * }
   * ```
   */
  effects?: Record<string, EffectConfig>;
  
  /** 
   * Optional plugins to install when the engine is created
   * 
   * Plugins extend the functionality of the stage flow engine with additional
   * features like logging, persistence, analytics, etc.
   * 
   * @example
   * ```typescript
   * plugins: [
   *   new LoggingPlugin({ level: 'debug' }),
   *   new PersistencePlugin({ storage: 'localStorage' })
   * ]
   * ```
   */
  plugins?: Plugin<TStage, TData>[];
  
  /** 
   * Optional middleware to register for intercepting transitions
   * 
   * Middleware can modify, cancel, or observe stage transitions as they occur.
   * They execute in the order they are registered.
   * 
   * @example
   * ```typescript
   * middleware: [
   *   {
   *     name: 'logger',
   *     execute: async (context, next) => {
   *       console.log(`Transitioning from ${context.from} to ${context.to}`);
   *       await next();
   *     }
   *   }
   * ]
   * ```
   */
  middleware?: Middleware<TStage, TData>[];
  
  /** 
   * Optional persistence configuration for saving/restoring state
   * 
   * When enabled, the engine will automatically save the current stage and data
   * to the specified storage and restore it when the engine is recreated.
   */
  persistence?: PersistenceConfig<TStage, TData>;
}

/**
 * Configuration for a single stage in the stage flow
 * 
 * Each stage represents a distinct state in your application flow with its own
 * transitions, data, lifecycle hooks, and visual effects.
 * 
 * @template TStage - Union type of all possible stage names
 * @template TData - Type of data associated with this stage
 * 
 * @example
 * ```typescript
 * const formStage: StageConfig<'form' | 'success', FormData> = {
 *   name: 'form',
 *   transitions: [
 *     { target: 'success', event: 'submit', condition: (ctx) => ctx.data?.isValid },
 *     { target: 'form', event: 'reset' }
 *   ],
 *   effect: 'slideIn',
 *   data: { isValid: false, fields: {} },
 *   onEnter: async (ctx) => {
 *     console.log('Entered form stage');
 *     // Initialize form data
 *   },
 *   onExit: async (ctx) => {
 *     console.log('Exiting form stage');
 *     // Cleanup form state
 *   }
 * };
 * ```
 */
export interface StageConfig<TStage extends string, TData = unknown> {
  /** 
   * Unique name/identifier for the stage
   * 
   * Must be one of the stage names in the TStage union type.
   * This name is used to reference the stage in transitions and navigation.
   */
  name: TStage;
  
  /** 
   * Array of possible transitions from this stage
   * 
   * Defines how the stage flow can move from this stage to other stages.
   * Transitions can be event-based, condition-based, or time-based.
   * 
   * @example
   * ```typescript
   * transitions: [
   *   { target: 'success', event: 'submit' },
   *   { target: 'error', event: 'error' },
   *   { target: 'timeout', after: 30000 }
   * ]
   * ```
   */
  transitions: Transition<TStage, TData>[];
  
  /** 
   * Optional effect to apply during transitions to/from this stage
   * 
   * Can be either a string referencing an effect name defined in the main 
   * configuration's effects object, or a direct EffectConfig object.
   * The effect will be applied when transitioning to or from this stage.
   * 
   * @example
   * ```typescript
   * // String reference to effects object
   * effect: 'slideIn' // References effects.slideIn in main config
   * 
   * // Direct effect configuration
   * effect: { type: 'slide', duration: 400, easing: 'ease-out' }
   * 
   * // Built-in effect with custom settings
   * effect: { type: 'fade', duration: 300, delay: 100 }
   * ```
   */
  effect?: string | EffectConfig;
  
  /** 
   * Optional stage-specific data
   * 
   * Initial data that will be available when this stage is active.
   * This data can be accessed and modified during the stage's lifecycle.
   * 
   * @example
   * ```typescript
   * data: {
   *   formFields: {},
   *   validationErrors: [],
   *   isSubmitting: false
   * }
   * ```
   */
  data?: TData;
  
  /** 
   * Optional lifecycle hook called when entering this stage
   * 
   * Executed after the stage transition is complete but before subscribers
   * are notified. Useful for initialization, data loading, or side effects.
   * 
   * @param context - Stage context with current stage, data, and navigation methods
   * 
   * @example
   * ```typescript
   * onEnter: async (context) => {
   *   // Load user data when entering profile stage
   *   const userData = await fetchUserData(context.data?.userId);
   *   context.data = { ...context.data, userData };
   * }
   * ```
   */
  onEnter?: StageHook<TStage, TData>;
  
  /** 
   * Optional lifecycle hook called when exiting this stage
   * 
   * Executed before the stage transition begins. Useful for cleanup,
   * data validation, or preventing transitions under certain conditions.
   * 
   * @param context - Stage context with current stage, data, and navigation methods
   * 
   * @example
   * ```typescript
   * onExit: async (context) => {
   *   // Save form data before leaving
   *   if (context.data?.hasUnsavedChanges) {
   *     await saveFormData(context.data);
   *   }
   * }
   * ```
   */
  onExit?: StageHook<TStage, TData>;
}

/**
 * Transition configuration between stages
 * 
 * Defines how the stage flow can move from one stage to another.
 * Transitions can be triggered by events, conditions, timers, or direct navigation.
 * 
 * @template TStage - Union type of all possible stage names
 * @template TData - Type of data associated with stages
 * 
 * @example
 * ```typescript
 * // Event-based transition
 * { target: 'success', event: 'submit' }
 * 
 * // Conditional transition
 * { 
 *   target: 'error', 
 *   event: 'submit',
 *   condition: (ctx) => !ctx.data?.isValid 
 * }
 * 
 * // Automatic transition after timeout
 * { target: 'timeout', after: 5000 }
 * 
 * // Transition with custom middleware
 * {
 *   target: 'next',
 *   event: 'continue',
 *   middleware: [loggingMiddleware, validationMiddleware]
 * }
 * ```
 */
export interface Transition<TStage extends string, TData = unknown> {
  /** 
   * Target stage to transition to
   * 
   * Must be one of the stage names defined in the TStage union type.
   * The stage flow will move to this stage when the transition is triggered.
   */
  target: TStage;
  
  /** 
   * Optional event that triggers this transition
   * 
   * When specified, this transition will only be considered when the matching
   * event is sent to the engine via the send() method. If not specified,
   * the transition can be triggered by direct navigation or conditions.
   * 
   * @example
   * ```typescript
   * event: 'submit' // Triggered by engine.send('submit')
   * event: 'user.login' // Triggered by engine.send('user.login')
   * ```
   */
  event?: string;
  
  /** 
   * Optional condition that must be met for transition
   * 
   * A function that receives the current stage context and returns a boolean
   * or Promise<boolean> indicating whether the transition should proceed.
   * If the condition returns false, the transition will not occur.
   * 
   * @param context - Current stage context with stage, data, and navigation methods
   * @returns Boolean or Promise<boolean> indicating if transition should proceed
   * 
   * @example
   * ```typescript
   * // Simple synchronous condition
   * condition: (ctx) => ctx.data?.isValid === true
   * 
   * // Async condition with API call
   * condition: async (ctx) => {
   *   const result = await validateUser(ctx.data?.userId);
   *   return result.isValid;
   * }
   * ```
   */
  condition?: (context: StageContext<TStage, TData>) => boolean | Promise<boolean>;
  
  /** 
   * Optional after in milliseconds for automatic transition
   * 
   * When specified, the transition will automatically trigger after the
   * specified time has elapsed, regardless of events or conditions.
   * Useful for timeouts, auto-progression, or timed sequences.
   * 
   * @example
   * ```typescript
   * after: 5000 // Auto-transition after 5 seconds
   * after: 30000 // Timeout after 30 seconds
   * ```
   */
  after?: number;
  
  /** 
   * Optional middleware specific to this transition
   * 
   * Middleware that will be executed only for this specific transition,
   * in addition to any global middleware. Useful for transition-specific
   * logging, validation, or data transformation.
   * 
   * @example
   * ```typescript
   * middleware: [
   *   {
   *     name: 'transition-logger',
   *     execute: async (ctx, next) => {
   *       console.log(`Special transition: ${ctx.from} -> ${ctx.to}`);
   *       await next();
   *     }
   *   }
   * ]
   * ```
   */
  middleware?: Middleware<TStage, TData>[];
}

/**
 * Context provided to stage hooks and conditions
 */
export interface StageContext<TStage extends string, TData = unknown> {
  /** Current stage */
  current: TStage;
  /** Stage-specific data */
  data?: TData;
  /** Timestamp when context was created */
  timestamp: number;
  /** Method to send events */
  send: (event: string, data?: TData) => Promise<void>;
  /** Method to navigate directly to a stage */
  goTo: (stage: TStage, data?: TData) => Promise<void>;
}

/**
 * Hook function type for stage lifecycle events
 */
export type StageHook<TStage extends string, TData = unknown> = (
  context: StageContext<TStage, TData>
) => void | Promise<void>;

/**
 * Effect configuration for stage transitions
 */
export interface EffectConfig {
  /** Type of effect (fade, slide, scale, etc.) */
  type: string;
  /** Duration of the effect in milliseconds */
  duration?: number;
  /** Easing function for the effect */
  easing?: string;
  /** Delay before the effect starts in milliseconds */
  delay?: number;
  /** Additional effect-specific options */
  options?: Record<string, unknown>;
}

/**
 * Built-in effect types
 */
export type BuiltInEffectType = 
  | 'fade'
  | 'slide'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scale'
  | 'scaleUp'
  | 'scaleDown'
  | 'flip'
  | 'flipX'
  | 'flipY'
  | 'zoom'
  | 'rotate'
  | 'none';

/**
 * Custom effect definition for registration
 */
export interface CustomEffectDefinition {
  /** Unique name for the effect */
  name: string;
  /** Effect configuration factory */
  create: (options?: Record<string, unknown>) => EffectConfig;
  /** Optional description */
  description?: string;
  /** Optional default options */
  defaultOptions?: Record<string, unknown>;
}

/**
 * Effect registry for managing custom effects
 */
export interface EffectRegistry {
  /** Register a custom effect */
  register(effect: CustomEffectDefinition): void;
  /** Unregister a custom effect */
  unregister(name: string): void;
  /** Get a registered effect */
  get(name: string): CustomEffectDefinition | undefined;
  /** Get all registered effect names */
  getRegistered(): string[];
  /** Check if an effect is registered */
  has(name: string): boolean;
  /** Create an effect configuration */
  create(name: string, options?: Record<string, unknown>): EffectConfig | undefined;
}/**

 * Plugin interface for extending stage flow functionality
 * 
 * Plugins provide a way to extend the stage flow engine with additional features
 * such as logging, persistence, analytics, validation, and more. They can hook
 * into the stage lifecycle and transition process to add custom behavior.
 * 
 * @template TStage - Union type of all possible stage names
 * @template TData - Type of data associated with stages
 * 
 * @example
 * ```typescript
 * class LoggingPlugin implements Plugin<string, any> {
 *   name = 'logging';
 *   version = '1.0.0';
 *   
 *   async install(engine) {
 *     console.log('Logging plugin installed');
 *   }
 *   
 *   hooks = {
 *     beforeTransition: async (context) => {
 *       console.log(`Transitioning: ${context.from} -> ${context.to}`);
 *     }
 *   };
 * }
 * ```
 */
export interface Plugin<TStage extends string, TData = unknown> {
  /** 
   * Unique plugin name - used to identify the plugin in the engine's registry
   */
  name: string;
  
  /** 
   * Optional plugin version - semantic version string for compatibility checking
   */
  version?: string;
  
  /** 
   * Optional plugin dependencies - array of plugin names that must be installed first
   */
  dependencies?: string[];
  
  /** 
   * Plugin installation function - called when the plugin is installed into the engine
   * 
   * @param engine - The stage flow engine instance
   */
  install: (engine: StageFlowEngine<TStage, TData>) => void | Promise<void>;
  
  /** 
   * Optional plugin uninstallation function - called when the plugin is removed
   * 
   * @param engine - The stage flow engine instance
   */
  uninstall?: (engine: StageFlowEngine<TStage, TData>) => void | Promise<void>;
  
  /** 
   * Optional lifecycle hooks - functions called at specific points in the stage flow
   */
  hooks?: {
    /** Called before a stage transition begins */
    beforeTransition?: (context: TransitionContext<TStage, TData>) => void | Promise<void>;
    /** Called after a stage transition completes */
    afterTransition?: (context: TransitionContext<TStage, TData>) => void | Promise<void>;
    /** Called when entering a stage */
    onStageEnter?: (context: StageContext<TStage, TData>) => void | Promise<void>;
    /** Called when exiting a stage */
    onStageExit?: (context: StageContext<TStage, TData>) => void | Promise<void>;
  };
  
  /** 
   * Optional plugin-specific state - object for storing plugin data
   */
  state?: Record<string, unknown>;
}

/**
 * Middleware interface for intercepting transitions
 */
export interface Middleware<TStage extends string, TData = unknown> {
  /** Unique middleware name */
  name: string;
  /** Middleware execution function */
  execute: (
    context: TransitionContext<TStage, TData>,
    next: () => Promise<void>
  ) => Promise<void>;
}

/**
 * Context provided to middleware during transitions
 */
export interface TransitionContext<TStage extends string, TData = unknown> {
  /** Source stage */
  from: TStage;
  /** Target stage */
  to: TStage;
  /** Optional event that triggered the transition */
  event?: string;
  /** Optional data associated with the transition */
  data?: TData;
  /** Timestamp when transition started */
  timestamp: number;
  /** Method to cancel the transition */
  cancel: () => void;
  /** Method to modify the transition */
  modify: (changes: Partial<{ to: TStage; data: TData }>) => void;
}

/**
 * Persistence configuration
 */
export interface PersistenceConfig<TStage extends string, TData = unknown> {
  /** Whether persistence is enabled */
  enabled: boolean;
  /** Storage type to use */
  storage: 'localStorage' | 'sessionStorage' | 'custom';
  /** Storage key */
  key: string;
  /** Optional custom serializer */
  serializer?: {
    serialize: (state: { stage: TStage; data?: TData }) => string;
    deserialize: (serialized: string) => { stage: TStage; data?: TData };
  };
  /** Optional time-to-live in milliseconds */
  ttl?: number;
}

/**
 * Internal state structure
 */
export interface StageFlowState<TStage extends string, TData = unknown> {
  /** Current stage */
  current: TStage;
  /** Current stage data */
  data?: TData;
  /** Whether a transition is in progress */
  isTransitioning: boolean;
  /** Transition history */
  history: Array<{ stage: TStage; timestamp: number; data?: TData }>;
  /** Installed plugins */
  plugins: Map<string, Plugin<TStage, TData>>;
  /** Registered middleware */
  middleware: Middleware<TStage, TData>[];
}

/**
 * Forward declaration of StageFlowEngine for plugin interface
 */
export interface StageFlowEngine<TStage extends string, TData = unknown> {
  getCurrentStage(): TStage;
  getCurrentData(): TData | undefined;
  getCurrentStageEffect(): string | EffectConfig | undefined;
  getStageEffect(stage: TStage): string | EffectConfig | undefined;
  send(event: string, data?: TData): Promise<void>;
  goTo(stage: TStage, data?: TData): Promise<void>;
  setStageData(data: TData): void;
  subscribe(callback: (stage: TStage, data?: TData) => void): () => void;
  installPlugin(plugin: Plugin<TStage, TData>): Promise<void>;
  uninstallPlugin(name: string): Promise<void>;
  getInstalledPlugins(): string[];
  getPlugin(name: string): Plugin<TStage, TData> | undefined;
  getPluginState(name: string): Record<string, unknown> | undefined;
  setPluginState(name: string, state: Record<string, unknown>): void;
  addMiddleware(middleware: Middleware<TStage, TData>): void;
  removeMiddleware(name: string): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  reset(): Promise<void>;
  pauseTimers(): void;
  resumeTimers(): void;
  resetTimers(): void;
  getTimerRemainingTime(): number;
  areTimersPaused(): boolean;
  subscribeToTimerEvents(listener: TimerEventListener<TStage, TData>): () => void;
  getActiveTimers(): TimerState[];
  getStageTimers(stage: TStage): TimerState[];
  cancelTimer(timerId: string): boolean;
  serializeTimerState(): string;
  restoreTimerState(serializedState: string): boolean;
}

/**
 * Timer event types for the timer event system
 */
export type TimerEventType = 
  | 'timer:started'
  | 'timer:paused'
  | 'timer:resumed'
  | 'timer:reset'
  | 'timer:completed'
  | 'timer:cancelled';

/**
 * Timer event data interface
 */
export interface TimerEvent<TStage extends string, TData = unknown> {
  /** Type of timer event */
  type: TimerEventType;
  /** Timer identifier */
  timerId: string;
  /** Stage the timer belongs to */
  stage: TStage;
  /** Target stage for the timer transition */
  target: TStage;
  /** Original timer duration in milliseconds */
  duration: number;
  /** Remaining time in milliseconds (for pause/resume events) */
  remainingTime?: number;
  /** Timestamp when the event occurred */
  timestamp: number;
  /** Associated stage data */
  data?: TData;
}

/**
 * Timer event listener callback
 */
export type TimerEventListener<TStage extends string, TData = unknown> = (
  event: TimerEvent<TStage, TData>
) => void;

/**
 * Timer configuration for advanced timer management
 */
export interface TimerConfig {
  /** Timer identifier (auto-generated if not provided) */
  id?: string;
  /** Timer duration in milliseconds */
  duration: number;
  /** Whether the timer should repeat */
  repeat?: boolean;
  /** Repeat interval (if different from duration) */
  repeatInterval?: number;
  /** Maximum number of repeats (0 = infinite) */
  maxRepeats?: number;
  /** Priority for multiple timers (higher = more priority) */
  priority?: number;
  /** Custom data associated with the timer */
  metadata?: Record<string, unknown>;
}

/**
 * Timer state information
 */
export interface TimerState {
  /** Timer identifier */
  id: string;
  /** Current stage */
  stage: string;
  /** Target stage */
  target: string;
  /** Original duration */
  duration: number;
  /** Remaining time */
  remainingTime: number;
  /** Whether timer is paused */
  isPaused: boolean;
  /** Start time timestamp */
  startTime: number;
  /** Timer configuration */
  config: TimerConfig;
}