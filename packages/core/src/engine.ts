/**
 * Core StageFlowEngine implementation
 * 
 * This module provides the main StageFlowEngine class that manages stage-based
 * state transitions with full TypeScript support, plugin system, and middleware pipeline.
 */

import {
  StageFlowConfig,
  StageConfig,
  StageFlowState,
  StageContext,
  Transition,
  TransitionContext,
  Plugin,
  Middleware,
  StageFlowEngine as IStageFlowEngine
} from './types/core';
import {
  StageFlowError,
  TransitionError,
  ConfigurationError,
  PluginError,
  MiddlewareError
} from './types/errors';
import { 
  validateStageFlowConfigStrict, 
  RuntimeTypeChecker, 
  DevelopmentWarnings,
  ValidationOptions 
} from './validation';

/**
 * Core stage flow engine implementation with generic type support
 * 
 * The StageFlowEngine is the main class that manages stage-based state transitions.
 * It provides a type-safe, event-driven system for managing complex application flows
 * with support for plugins, middleware, effects, and persistence.
 * 
 * @template TStage - Union type of all possible stage names (must extend string)
 * @template TData - Type of data associated with stages (defaults to unknown)
 * 
 * @example
 * ```typescript
 * // Define your stage types
 * type AppStages = 'loading' | 'form' | 'success' | 'error';
 * interface AppData {
 *   username?: string;
 *   error?: string;
 * }
 * 
 * // Create configuration
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
 *     {
 *       name: 'form',
 *       transitions: [
 *         { target: 'success', event: 'submit' },
 *         { target: 'error', event: 'error' }
 *       ]
 *     }
 *   ]
 * };
 * 
 * // Create and start engine
 * const engine = new StageFlowEngine(config);
 * await engine.start();
 * 
 * // Subscribe to changes
 * const unsubscribe = engine.subscribe((stage, data) => {
 *   console.log('Current stage:', stage, data);
 * });
 * 
 * // Send events
 * await engine.send('submit', { username: 'john' });
 * 
 * // Direct navigation
 * await engine.goTo('error', { error: 'Something went wrong' });
 * ```
 */
export class StageFlowEngine<TStage extends string, TData = unknown> implements IStageFlowEngine<TStage, TData> {
  private config: StageFlowConfig<TStage, TData>;
  private state: StageFlowState<TStage, TData>;
  private _timers: Map<string, ReturnType<typeof setTimeout>>;
  private _timerPaused: Map<string, boolean>;
  private _timerStartTimes: Map<string, number>;
  private _timerRemainingTimes: Map<string, number>;
  private _subscribers: Set<(stage: TStage, data?: TData) => void>;
  private stageMap: Map<TStage, StageConfig<TStage, TData>>;
  private _isStarted: boolean = false;
  private runtimeTypeChecker: RuntimeTypeChecker<TStage, TData>;

  constructor(config: StageFlowConfig<TStage, TData>, validationOptions: ValidationOptions = {}) {
    // Validate configuration using the new validation system
    validateStageFlowConfigStrict(config, validationOptions);
    
    this.config = config;
    this._timers = new Map();
    this._timerPaused = new Map();
    this._timerStartTimes = new Map();
    this._timerRemainingTimes = new Map();
    this._subscribers = new Set();
    this.stageMap = new Map();
    
    // Build stage map for efficient lookups
    this.buildStageMap();
    
    // Initialize runtime type checker
    this.runtimeTypeChecker = new RuntimeTypeChecker(config);
    
    // Get initial stage data
    const initialStageConfig = this.stageMap.get(config.initial);
    const initialData = initialStageConfig?.data;

    // Initialize state
    this.state = {
      current: config.initial,
      data: initialData,
      isTransitioning: false,
      history: [{
        stage: config.initial,
        timestamp: Date.now(),
        data: initialData
      }],
      plugins: new Map(),
      middleware: config.middleware || []
    };

    // Install initial plugins if provided
    if (config.plugins) {
      config.plugins.forEach(plugin => {
        this.state.plugins.set(plugin.name, plugin);
      });
    }

    // Set up timers for the initial stage
    if (initialStageConfig) {
      this._setupStageTimers(config.initial, initialStageConfig);
    }
  }


  /**
   * Builds a map of stage names to stage configurations for efficient lookups
   */
  private buildStageMap(): void {
    this.stageMap.clear();
    for (const stage of this.config.stages) {
      this.stageMap.set(stage.name, stage);
    }
  }

  /**
   * Gets the current active stage
   * 
   * @returns The name of the currently active stage
   * 
   * @example
   * ```typescript
   * const currentStage = engine.getCurrentStage();
   * console.log('Currently in stage:', currentStage);
   * ```
   */
  getCurrentStage(): TStage {
    return this.state.current;
  }

  /**
   * Gets the current stage data
   * 
   * @returns The data associated with the current stage, or undefined if no data
   * 
   * @example
   * ```typescript
   * const data = engine.getCurrentData();
   * if (data) {
   *   console.log('Current stage data:', data);
   * }
   * ```
   */
  getCurrentData(): TData | undefined {
    return this.state.data;
  }

  /**
   * Gets the current stage configuration
   */
  private _getCurrentStageConfig(): StageConfig<TStage, TData> {
    const config = this.stageMap.get(this.state.current);
    if (!config) {
      throw new StageFlowError(
        `Stage configuration not found for: ${this.state.current}`,
        'STAGE_NOT_FOUND'
      );
    }
    return config;
  }

  /**
   * Gets the effect configuration for the current stage
   */
  getCurrentStageEffect(): string | undefined {
    const stageConfig = this._getCurrentStageConfig();
    return stageConfig.effect;
  }

  /**
   * Gets the effect configuration for a specific stage
   */
  getStageEffect(stage: TStage): string | undefined {
    const stageConfig = this.stageMap.get(stage);
    return stageConfig?.effect;
  }

  /**
   * Creates a stage context for the current state
   */
  private _createStageContext(): StageContext<TStage, TData> {
    return {
      current: this.state.current,
      data: this.state.data,
      timestamp: Date.now(),
      send: this.send.bind(this),
      goTo: this.goTo.bind(this)
    };
  }

  /**
   * Finds a valid transition based on event or direct target
   */
  private _findTransition(
    from: TStage,
    eventOrTarget?: string,
    isDirect: boolean = false
  ): Transition<TStage, TData> | null {
    const stageConfig = this.stageMap.get(from);
    if (!stageConfig) {
      return null;
    }

    for (const transition of stageConfig.transitions) {
      if (isDirect) {
        // For direct navigation (goTo), match by target
        if (transition.target === eventOrTarget) {
          return transition;
        }
      } else {
        // For event-based transitions, match by event or no event specified
        if (!eventOrTarget || transition.event === eventOrTarget) {
          return transition;
        }
      }
    }

    return null;
  }

  /**
   * Evaluates transition condition if present
   */
  private async _evaluateCondition(
    transition: Transition<TStage, TData>,
    context: StageContext<TStage, TData>
  ): Promise<boolean> {
    if (!transition.condition) {
      return true;
    }

    try {
      const result = await transition.condition(context);
      return result;
    } catch (error) {
      throw new TransitionError(
        `Condition evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { transition, context, error }
      );
    }
  }

  /**
   * Sends an event to trigger a stage transition
   * 
   * Events are matched against transition configurations in the current stage.
   * If a matching transition is found and its conditions are met, the stage
   * will transition to the target stage.
   * 
   * @param event - The event name to send
   * @param data - Optional data to associate with the transition
   * 
   * @throws {TransitionError} When the engine is not started or a transition is in progress
   * 
   * @example
   * ```typescript
   * // Send a simple event
   * await engine.send('submit');
   * 
   * // Send an event with data
   * await engine.send('login', { username: 'john', password: 'secret' });
   * 
   * // Handle errors
   * try {
   *   await engine.send('invalid-event');
   * } catch (error) {
   *   if (error instanceof TransitionError) {
   *     console.error('Transition failed:', error.message);
   *   }
   * }
   * ```
   */
  async send(event: string, data?: TData): Promise<void> {
    if (!this._isStarted) {
      throw new TransitionError('Engine must be started before sending events');
    }

    if (this.state.isTransitioning) {
      throw new TransitionError('Cannot send event while transition is in progress');
    }

    // Validate event parameter
    if (typeof event !== 'string' || event.trim() === '') {
      throw new TransitionError('Event must be a non-empty string');
    }

    const transition = this._findTransition(this.state.current, event, false);
    if (!transition) {
      // No matching transition found - this is not an error, just ignore
      DevelopmentWarnings.warn(
        `No transition found for event "${event}" in stage "${this.state.current}"`,
        { currentStage: this.state.current, event }
      );
      return;
    }

    // Runtime validation for the target stage
    try {
      this.runtimeTypeChecker.validateTransition(this.state.current, transition.target, event);
      if (data !== undefined) {
        this.runtimeTypeChecker.validateStageData(transition.target, data);
      }
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw new TransitionError(error.message, error.context);
      }
      throw error;
    }

    await this._executeTransition(transition, data, event);
  }

  /**
   * Directly navigates to a specific stage
   * 
   * Unlike send(), this method directly transitions to the specified stage
   * without requiring an event. It will find a valid transition path to
   * the target stage and execute it.
   * 
   * @param stage - The target stage to navigate to
   * @param data - Optional data to associate with the transition
   * 
   * @throws {TransitionError} When the engine is not started, a transition is in progress,
   *                          or no valid transition path exists to the target stage
   * 
   * @example
   * ```typescript
   * // Navigate to a specific stage
   * await engine.goTo('success');
   * 
   * // Navigate with data
   * await engine.goTo('error', { message: 'Something went wrong' });
   * 
   * // Handle navigation errors
   * try {
   *   await engine.goTo('unreachable-stage');
   * } catch (error) {
   *   console.error('Navigation failed:', error.message);
   * }
   * ```
   */
  async goTo(stage: TStage, data?: TData): Promise<void> {
    if (!this._isStarted) {
      throw new TransitionError('Engine must be started before navigation');
    }

    if (this.state.isTransitioning) {
      throw new TransitionError('Cannot navigate while transition is in progress');
    }

    // Runtime validation - only validate stage existence and data, not transitions
    try {
      // Only validate that the target stage exists
      if (!this.runtimeTypeChecker.isValidStage(stage)) {
        throw new ConfigurationError(
          `Invalid transition target: "${stage}" is not a valid stage name`
        );
      }
      
      if (data !== undefined) {
        this.runtimeTypeChecker.validateStageData(stage, data);
      }
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw new TransitionError(error.message, error.context);
      }
      throw error;
    }

    if (this.state.current === stage) {
      // Already at target stage, just update data if provided
      if (data !== undefined) {
        this.state.data = data;
        this._notifySubscribers(stage, data);
      }
      return;
    }

    // Check if target stage exists
    const targetStageConfig = this.stageMap.get(stage);
    if (!targetStageConfig) {
      throw new TransitionError(`Target stage "${stage}" does not exist`);
    }

    const transition = this._findTransition(this.state.current, stage, true);
    if (!transition) {
      // No explicit transition defined, create a direct transition
      const directTransition: Transition<TStage, TData> = {
        target: stage,
        event: `direct-to-${stage}`,
        condition: undefined,
        middleware: []
      };
      await this._executeTransition(directTransition, data);
    } else {
      await this._executeTransition(transition, data);
    }
  }

  /**
   * Executes middleware pipeline for a transition
   */
  private async _executeMiddlewarePipeline(
    transitionContext: TransitionContext<TStage, TData>,
    transition: Transition<TStage, TData>
  ): Promise<void> {
    // Combine global middleware with transition-specific middleware
    const allMiddleware = [
      ...this.state.middleware,
      ...(transition.middleware || [])
    ];

    if (allMiddleware.length === 0) {
      return;
    }

    let currentIndex = 0;

    // Create cancel function that sets the cancelled flag
    const originalCancel = transitionContext.cancel;
    transitionContext.cancel = (): void => {
      originalCancel();
    };

    // Create next function for middleware chain with reset capability
    const next = async (resetIndex?: number): Promise<void> => {
      // Allow retry middleware to reset the pipeline index
      if (resetIndex !== undefined) {
        currentIndex = resetIndex;
      }
      
      if (currentIndex >= allMiddleware.length) return;
      const middleware = allMiddleware[currentIndex++];
      try {
        await middleware.execute(transitionContext, next);
      } catch (error) {
        // Only wrap errors that are not already TransitionError or MiddlewareError
        if (error instanceof TransitionError || error instanceof MiddlewareError) {
          throw error;
        }
        throw new MiddlewareError(
          `Middleware "${middleware.name}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { middleware, transitionContext, error }
        );
      }
    };
    await next();
  }

  /**
   * Executes a stage transition with proper lifecycle management
   */
  private async _executeTransition(
    transition: Transition<TStage, TData>,
    data?: TData,
    event?: string
  ): Promise<void> {
    const fromStage = this.state.current;
    const toStage = transition.target;

    // Set transitioning state
    this.state.isTransitioning = true;

    try {
      // Create stage context for condition evaluation
      const context = this._createStageContext();

      // Evaluate transition condition
      const conditionMet = await this._evaluateCondition(transition, context);
      if (!conditionMet) {
        this.state.isTransitioning = false;
        return;
      }

      // Create transition context for middleware and plugin hooks
      const transitionContext: TransitionContext<TStage, TData> = {
        from: fromStage,
        to: toStage,
        event,
        data,
        timestamp: Date.now(),
        cancel: () => {
          throw new TransitionError('Transition cancelled');
        },
        modify: (changes): void => {
          if (changes.to !== undefined) {
            // Validate that the new target stage exists
            if (!this.stageMap.has(changes.to)) {
              throw new TransitionError(`Modified target stage "${changes.to}" does not exist`);
            }
            transitionContext.to = changes.to;
          }
          if (changes.data !== undefined) {
            transitionContext.data = changes.data;
          }
        }
      };

      // Execute middleware pipeline first
      await this._executeMiddlewarePipeline(transitionContext, transition);

      // Execute beforeTransition plugin hooks
      await this._executePluginHooks('beforeTransition', transitionContext);

      // Get stage configurations (use potentially modified target)
      const fromStageConfig = this.stageMap.get(fromStage);
      const toStageConfig = this.stageMap.get(transitionContext.to);

      if (!toStageConfig) {
        throw new TransitionError(`Target stage configuration not found: ${transitionContext.to}`);
      }

      // Execute onStageExit plugin hooks
      await this._executePluginHooks('onStageExit', context);

      // Execute onExit hook for current stage
      if (fromStageConfig?.onExit) {
        await fromStageConfig.onExit(context);
      }

      // Clear any existing timers for the current stage
      this._clearStageTimers(fromStage);

      // Update state (use potentially modified values)
      this.state.current = transitionContext.to;
      this.state.data = transitionContext.data !== undefined ? transitionContext.data : toStageConfig.data;
      
      // Add to history
      this.state.history.push({
        stage: transitionContext.to,
        timestamp: Date.now(),
        data: this.state.data
      });

      // Create new context for the target stage
      const newContext = this._createStageContext();

      // Execute onEnter hook for new stage
      if (toStageConfig.onEnter) {
        await toStageConfig.onEnter(newContext);
      }

      // Execute onStageEnter plugin hooks
      await this._executePluginHooks('onStageEnter', newContext);

      // Execute afterTransition plugin hooks
      await this._executePluginHooks('afterTransition', transitionContext);

      // Set up automatic transitions with timers
      this._setupStageTimers(transitionContext.to, toStageConfig);

      // Notify subscribers
      this._notifySubscribers(transitionContext.to, this.state.data);

    } catch (error) {
      // Reset transitioning state on error
      this.state.isTransitioning = false;
      throw error;
    }

    // Reset transitioning state
    this.state.isTransitioning = false;
  }

  /**
   * Sets up automatic transitions with timers for a stage
   */
  private _setupStageTimers(stage: TStage, stageConfig: StageConfig<TStage, TData>): void {
    for (const transition of stageConfig.transitions) {
      if (transition.after && transition.after > 0) {
        const timerId = `${stage}-${transition.target}-${transition.after}`;
        
        const timer = setTimeout(async () => {
          try {
            // Only execute if we're still in the same stage, not transitioning, and engine is started
            if (this._isStarted && this.state.current === stage && !this.state.isTransitioning) {
              await this._executeTransition(transition);
            }
          } catch (error) {
            // Handle timer-based transition errors
            console.error('Timer-based transition failed:', error);
          } finally {
            // Clean up the timer reference
            this._timers.delete(timerId);
            this._timerPaused.delete(timerId);
            this._timerStartTimes.delete(timerId);
            this._timerRemainingTimes.delete(timerId);
          }
        }, transition.after);

        this._timers.set(timerId, timer);
        this._timerStartTimes.set(timerId, Date.now());
        this._timerPaused.set(timerId, false);
      }
    }
  }

  /**
   * Clears all timers for a specific stage
   */
  private _clearStageTimers(stage: TStage): void {
    const timersToDelete: string[] = [];
    
    for (const [timerId, timer] of this._timers.entries()) {
      if (timerId.startsWith(`${stage}-`)) {
        clearTimeout(timer);
        timersToDelete.push(timerId);
      }
    }

    timersToDelete.forEach(timerId => {
      this._timers.delete(timerId);
      this._timerPaused.delete(timerId);
      this._timerStartTimes.delete(timerId);
      this._timerRemainingTimes.delete(timerId);
    });
  }

  /**
   * Pauses all timers for the current stage
   */
  pauseTimers(): void {
    const currentStage = this.state.current;
    
    for (const [timerId, timer] of this._timers.entries()) {
      if (timerId.startsWith(`${currentStage}-`)) {
        clearTimeout(timer);
        this._timers.delete(timerId); // Remove from active timers
        this._timerPaused.set(timerId, true);
        
        // Calculate remaining time
        const startTime = this._timerStartTimes.get(timerId) || 0;
        const elapsed = Date.now() - startTime;
        const originalDuration = parseInt(timerId.split('-').pop() || '0');
        const remaining = Math.max(0, originalDuration - elapsed);
        
        this._timerRemainingTimes.set(timerId, remaining);
      }
    }
  }

  /**
   * Resumes all paused timers for the current stage
   */
  resumeTimers(): void {
    const currentStage = this.state.current;
    const stageConfig = this.stageMap.get(currentStage);
    
    if (!stageConfig) {
      return;
    }
    
    for (const transition of stageConfig.transitions) {
      if (transition.after && transition.after > 0) {
        const timerId = `${currentStage}-${transition.target}-${transition.after}`;
        
        if (this._timerPaused.get(timerId)) {
          const remaining = this._timerRemainingTimes.get(timerId) || transition.after;
          
          if (remaining > 0) {
            const timer = setTimeout(async () => {
              try {
                if (this._isStarted && this.state.current === currentStage && !this.state.isTransitioning) {
                  await this._executeTransition(transition);
                }
              } catch (error) {
                console.error('Timer-based transition failed:', error);
              } finally {
                this._timers.delete(timerId);
                this._timerPaused.delete(timerId);
                this._timerStartTimes.delete(timerId);
                this._timerRemainingTimes.delete(timerId);
              }
            }, remaining);
            
            this._timers.set(timerId, timer);
            // Adjust start time to account for the remaining time
            this._timerStartTimes.set(timerId, Date.now() - (transition.after - remaining));
            this._timerPaused.delete(timerId);
          }
        }
      }
    }
  }

  /**
   * Resets all timers for the current stage to their original duration
   */
  resetTimers(): void {
    const currentStage = this.state.current;
    const stageConfig = this.stageMap.get(currentStage);
    
    if (!stageConfig) {
      return;
    }
    
    // Clear existing timers and timer state
    this._clearStageTimers(currentStage);
    
    // Clear any remaining timer state for this stage
    const timersToDelete: string[] = [];
    for (const [timerId] of this._timerPaused.entries()) {
      if (timerId.startsWith(`${currentStage}-`)) {
        timersToDelete.push(timerId);
      }
    }
    
    timersToDelete.forEach(timerId => {
      this._timerPaused.delete(timerId);
      this._timerStartTimes.delete(timerId);
      this._timerRemainingTimes.delete(timerId);
    });
    
    // Setup new timers with original duration
    this._setupStageTimers(currentStage, stageConfig);
  }

  /**
   * Gets the remaining time for timers in the current stage
   */
  getTimerRemainingTime(): number {
    const currentStage = this.state.current;
    let minRemaining = Infinity;
    
    // Check paused timers
    for (const [timerId, isPaused] of this._timerPaused.entries()) {
      if (timerId.startsWith(`${currentStage}-`) && isPaused) {
        const remaining = this._timerRemainingTimes.get(timerId) || 0;
        minRemaining = Math.min(minRemaining, remaining);
      }
    }
    
    // Check active timers (only if not paused)
    for (const [timerId, _timer] of this._timers.entries()) {
      if (timerId.startsWith(`${currentStage}-`) && !this._timerPaused.get(timerId)) {
        const startTime = this._timerStartTimes.get(timerId) || 0;
        const elapsed = Date.now() - startTime;
        const originalDuration = parseInt(timerId.split('-').pop() || '0');
        const remaining = Math.max(0, originalDuration - elapsed);
        minRemaining = Math.min(minRemaining, remaining);
      }
    }
    
    return minRemaining === Infinity ? 0 : minRemaining;
  }

  /**
   * Checks if timers are paused for the current stage
   */
  areTimersPaused(): boolean {
    const currentStage = this.state.current;
    
    for (const [timerId, isPaused] of this._timerPaused.entries()) {
      if (timerId.startsWith(`${currentStage}-`) && isPaused) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Notifies all subscribers of stage changes
   */
  private _notifySubscribers(stage: TStage, data?: TData): void {
    for (const callback of this._subscribers) {
      try {
        callback(stage, data);
      } catch (error) {
        // Only log errors in non-test environments
        if (process.env.NODE_ENV !== 'test') {
          console.error('Subscriber callback error:', error);
        }
      }
    }
  }

  /**
   * Subscribes to stage changes
   * 
   * Registers a callback function that will be called whenever the stage changes.
   * The callback receives the new stage name and associated data.
   * 
   * @param callback - Function to call when stage changes
   * @returns Unsubscribe function to remove the subscription
   * 
   * @example
   * ```typescript
   * // Subscribe to stage changes
   * const unsubscribe = engine.subscribe((stage, data) => {
   *   console.log(`Stage changed to: ${stage}`, data);
   *   
   *   // Update UI based on stage
   *   if (stage === 'loading') {
   *     showLoadingSpinner();
   *   } else if (stage === 'error') {
   *     showErrorMessage(data?.message);
   *   }
   * });
   * 
   * // Later, unsubscribe to prevent memory leaks
   * unsubscribe();
   * 
   * // Multiple subscriptions are supported
   * const unsubscribe1 = engine.subscribe(updateUI);
   * const unsubscribe2 = engine.subscribe(logStageChanges);
   * const unsubscribe3 = engine.subscribe(sendAnalytics);
   * ```
   */
  subscribe(callback: (stage: TStage, data?: TData) => void): () => void {
    this._subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this._subscribers.delete(callback);
    };
  }

  /**
   * Installs a plugin into the stage flow engine
   */
  async installPlugin(plugin: Plugin<TStage, TData>): Promise<void> {
    if (!plugin.name) {
      throw new PluginError('Plugin must have a name');
    }

    if (this.state.plugins.has(plugin.name)) {
      throw new PluginError(`Plugin "${plugin.name}" is already installed`);
    }

    // Check dependencies
    if (plugin.dependencies) {
      for (const dependency of plugin.dependencies) {
        if (!this.state.plugins.has(dependency)) {
          throw new PluginError(
            `Plugin "${plugin.name}" requires dependency "${dependency}" which is not installed`
          );
        }
      }
    }

    try {
      // Initialize plugin state if not present
      if (!plugin.state) {
        plugin.state = {};
      }

      // Add plugin to registry
      this.state.plugins.set(plugin.name, plugin);

      // Install plugin if engine is started
      if (this._isStarted && plugin.install) {
        await plugin.install(this);
      }
    } catch (error) {
      // Remove plugin from registry if installation failed
      this.state.plugins.delete(plugin.name);
      
      throw new PluginError(
        `Failed to install plugin "${plugin.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        { plugin, error }
      );
    }
  }

  /**
   * Uninstalls a plugin from the stage flow engine
   */
  async uninstallPlugin(name: string): Promise<void> {
    const plugin = this.state.plugins.get(name);
    if (!plugin) {
      throw new PluginError(`Plugin "${name}" is not installed`);
    }

    // Check if other plugins depend on this one
    const dependentPlugins = this._findDependentPlugins(name);
    if (dependentPlugins.length > 0) {
      throw new PluginError(
        `Cannot uninstall plugin "${name}" because it is required by: ${dependentPlugins.join(', ')}`
      );
    }

    try {
      // Uninstall plugin if engine is started and plugin has uninstall method
      if (this._isStarted && plugin.uninstall) {
        await plugin.uninstall(this);
      }

      // Clear plugin state
      if (plugin.state) {
        plugin.state = {};
      }

      // Remove plugin from registry
      this.state.plugins.delete(name);
    } catch (error) {
      throw new PluginError(
        `Failed to uninstall plugin "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        { plugin, error }
      );
    }
  }

  /**
   * Gets a list of installed plugin names
   */
  getInstalledPlugins(): string[] {
    return Array.from(this.state.plugins.keys());
  }

  /**
   * Gets a specific plugin by name
   */
  getPlugin(name: string): Plugin<TStage, TData> | undefined {
    return this.state.plugins.get(name);
  }

  /**
   * Gets plugin state for a specific plugin
   */
  getPluginState(name: string): Record<string, unknown> | undefined {
    const plugin = this.state.plugins.get(name);
    return plugin?.state;
  }

  /**
   * Sets plugin state for a specific plugin
   */
  setPluginState(name: string, state: Record<string, unknown>): void {
    const plugin = this.state.plugins.get(name);
    if (!plugin) {
      throw new PluginError(`Plugin "${name}" is not installed`);
    }
    plugin.state = { ...plugin.state, ...state };
  }

  /**
   * Adds middleware to the pipeline
   */
  addMiddleware(middleware: Middleware<TStage, TData>): void {
    if (!middleware.name) {
      throw new MiddlewareError('Middleware must have a name');
    }

    // Check if middleware with same name already exists
    const existingIndex = this.state.middleware.findIndex(m => m.name === middleware.name);
    if (existingIndex !== -1) {
      throw new MiddlewareError(`Middleware "${middleware.name}" is already registered`);
    }

    // Add middleware to the end of the pipeline
    this.state.middleware.push(middleware);
  }

  /**
   * Removes middleware from the pipeline by name
   */
  removeMiddleware(name: string): void {
    const index = this.state.middleware.findIndex(m => m.name === name);
    if (index === -1) {
      throw new MiddlewareError(`Middleware "${name}" is not registered`);
    }

    this.state.middleware.splice(index, 1);
  }

  /**
   * Starts the stage flow engine
   */
  async start(): Promise<void> {
    if (this._isStarted) {
      return;
    }

    this._isStarted = true;

    // Install plugins in dependency order
    const plugins = Array.from(this.state.plugins.values());
    const sortedPlugins = this._sortPluginsByDependencies(plugins);
    
    for (const plugin of sortedPlugins) {
      try {
        if (plugin.install) {
          await plugin.install(this);
        }
      } catch (error) {
        const pluginError = new PluginError(
          `Failed to install plugin "${plugin.name}" during engine start: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { plugin, error }
        );
        console.error(pluginError.message, pluginError.context);
      }
    }

    // Create initial stage context
    const context = this._createStageContext();

    // Execute onStageEnter plugin hooks for initial stage
    await this._executePluginHooks('onStageEnter', context);

    // Execute onEnter hook for initial stage if it exists
    const initialStageConfig = this.stageMap.get(this.state.current);
    if (initialStageConfig?.onEnter) {
      try {
        await initialStageConfig.onEnter(context);
      } catch (error) {
        console.error('Initial stage onEnter hook failed:', error);
      }
    }

    // Notify subscribers of initial state
    this._notifySubscribers(this.state.current, this.state.data);

    // Setup timers for initial stage
    const currentStageConfig = this.stageMap.get(this.state.current);
    if (currentStageConfig) {
      this._setupStageTimers(this.state.current, currentStageConfig);
    }
  }

  /**
   * Stops the stage flow engine
   */
  async stop(): Promise<void> {
    if (!this._isStarted) {
      return;
    }

    this._isStarted = false;

    // Clear all timers
    this._clearAllTimers();

    // Create context for current stage
    const context = this._createStageContext();

    // Execute onStageExit plugin hooks for current stage
    await this._executePluginHooks('onStageExit', context);

    // Execute onExit hook for current stage if it exists
    const currentStageConfig = this.stageMap.get(this.state.current);
    if (currentStageConfig?.onExit) {
      try {
        await currentStageConfig.onExit(context);
      } catch (error) {
        console.error('Current stage onExit hook failed:', error);
      }
    }

    // Uninstall plugins in reverse dependency order
    const plugins = Array.from(this.state.plugins.values());
    const sortedPlugins = this._sortPluginsByDependencies(plugins);
    
    for (const plugin of sortedPlugins.reverse()) {
      try {
        if (plugin.uninstall) {
          await plugin.uninstall(this);
        }
      } catch (error) {
        const pluginError = new PluginError(
          `Failed to uninstall plugin "${plugin.name}" during engine stop: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { plugin, error }
        );
        console.error(pluginError.message, pluginError.context);
      }
    }
  }

  /**
   * Resets the stage flow engine to its initial state
   */
  async reset(): Promise<void> {
    const wasStarted = this._isStarted;

    // Stop the engine first
    await this.stop();

    // Clear all timers
    this._clearAllTimers();

    // Reset state to initial
    this.state = {
      current: this.config.initial,
      data: undefined,
      isTransitioning: false,
      history: [{
        stage: this.config.initial,
        timestamp: Date.now(),
        data: undefined
      }],
      plugins: this.state.plugins, // Keep plugins
      middleware: this.state.middleware // Keep middleware
    };

    // Set up timers for the initial stage
    const initialStageConfig = this.stageMap.get(this.config.initial);
    if (initialStageConfig) {
      this._setupStageTimers(this.config.initial, initialStageConfig);
    }

    // Restart if it was previously started
    if (wasStarted) {
      await this.start();
    }
  }

  /**
   * Clears all active timers and resets timer state
   */
  private _clearAllTimers(): void {
    for (const [_timerId, timer] of this._timers.entries()) {
      clearTimeout(timer);
    }
    this._timers.clear();
    this._timerPaused.clear();
    this._timerStartTimes.clear();
    this._timerRemainingTimes.clear();
  }

  /**
   * Finds plugins that depend on the given plugin
   */
  private _findDependentPlugins(pluginName: string): string[] {
    const dependentPlugins: string[] = [];
    
    for (const plugin of this.state.plugins.values()) {
      if (plugin.dependencies && plugin.dependencies.includes(pluginName)) {
        dependentPlugins.push(plugin.name);
      }
    }
    
    return dependentPlugins;
  }

  /**
   * Sorts plugins by their dependencies (topological sort)
   */
  private _sortPluginsByDependencies(plugins: Plugin<TStage, TData>[]): Plugin<TStage, TData>[] {
    const sorted: Plugin<TStage, TData>[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (plugin: Plugin<TStage, TData>): void => {
      if (visiting.has(plugin.name)) {
        throw new PluginError(`Circular dependency detected involving plugin "${plugin.name}"`);
      }
      
      if (visited.has(plugin.name)) {
        return;
      }
      
      visiting.add(plugin.name);
      
      // Visit dependencies first
      if (plugin.dependencies) {
        for (const depName of plugin.dependencies) {
          const depPlugin = plugins.find(p => p.name === depName);
          if (depPlugin) {
            visit(depPlugin);
          }
        }
      }
      
      visiting.delete(plugin.name);
      visited.add(plugin.name);
      sorted.push(plugin);
    };
    
    for (const plugin of plugins) {
      if (!visited.has(plugin.name)) {
        visit(plugin);
      }
    }
    
    return sorted;
  }

  /**
   * Executes plugin hooks of a specific type in dependency order
   */
  private async _executePluginHooks(
    hookType: keyof NonNullable<Plugin<TStage, TData>['hooks']>,
    context: StageContext<TStage, TData> | TransitionContext<TStage, TData>
  ): Promise<void> {
    const plugins = Array.from(this.state.plugins.values());
    const sortedPlugins = this._sortPluginsByDependencies(plugins);
    
    for (const plugin of sortedPlugins) {
      if (!plugin.hooks || !plugin.hooks[hookType]) {
        continue;
      }

      try {
        const hook = plugin.hooks[hookType];
        if (hook) {
          await hook(context as StageContext<TStage, TData> & TransitionContext<TStage, TData>); // Type assertion needed due to union type
        }
      } catch (error) {
        // Plugin errors should not break the entire flow
        // Log the error and continue with other plugins
        const pluginError = new PluginError(
          `Plugin "${plugin.name}" hook "${hookType}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { plugin, hookType, context, error }
        );
        
        // Only log errors in non-test environments
        if (process.env.NODE_ENV !== 'test') {
          console.error(pluginError.message, pluginError.context);
        }
        
        // If this is a critical hook, we might want to handle it differently
        // For now, we continue execution to maintain flow stability
      }
    }
  }
}