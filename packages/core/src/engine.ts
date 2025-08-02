/**
 * Core StageFlowEngine implementation
 *
 * This module provides the main StageFlowEngine class that manages stage-based
 * state transitions with full TypeScript support, plugin system, and middleware pipeline.
 */

import { StageFlowConfig, StageConfig, StageFlowState, Transition, TransitionContext, Plugin, Middleware, StageFlowEngine as IStageFlowEngine } from "./types/core";
import { TransitionError, ConfigurationError, PluginError } from "./types/errors";
import { validateStageFlowConfigStrict, RuntimeTypeChecker, ValidationOptions } from "./validation";
import { TimerManager } from "./timer-manager";
import { PluginManager } from "./plugin-manager";
import { TransitionManager } from "./transition-manager";
import { MiddlewareManager } from "./middleware-manager";
import { StateManager } from "./state-manager";
import { LifecycleManager } from "./lifecycle-manager";

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
  private timerManager: TimerManager<TStage, TData>;
  private pluginManager: PluginManager<TStage, TData>;
  private transitionManager: TransitionManager<TStage, TData>;
  private middlewareManager: MiddlewareManager<TStage, TData>;
  private stateManager: StateManager<TStage, TData>;
  private lifecycleManager: LifecycleManager<TStage, TData>;
  private stageMap: Map<TStage, StageConfig<TStage, TData>>;
  private runtimeTypeChecker: RuntimeTypeChecker<TStage, TData>;

  constructor(config: StageFlowConfig<TStage, TData>, validationOptions: ValidationOptions = {}) {
    // Validate configuration using the new validation system
    validateStageFlowConfigStrict(config, validationOptions);

    this.config = config;
    this.timerManager = new TimerManager<TStage, TData>();
    this.pluginManager = new PluginManager<TStage, TData>();
    this.middlewareManager = new MiddlewareManager<TStage, TData>();
    this.stageMap = new Map();

    // Build stage map for efficient lookups
    this.buildStageMap();

    // Initialize runtime type checker
    this.runtimeTypeChecker = new RuntimeTypeChecker(config);

    // Initialize transition manager
    this.transitionManager = new TransitionManager<TStage, TData>(this.stageMap, this.runtimeTypeChecker);

    // Get initial stage data
    const initialStageConfig = this.stageMap.get(config.initial);
    const initialData = initialStageConfig?.data;

    // Initialize state
    this.state = {
      current: config.initial,
      data: initialData,
      isTransitioning: false,
      history: [
        {
          stage: config.initial,
          timestamp: Date.now(),
          data: initialData,
        },
      ],
      plugins: new Map(),
      middleware: config.middleware || [],
    };

    // Initialize StateManager
    this.stateManager = new StateManager<TStage, TData>(this.state, this.stageMap);

    // Initialize LifecycleManager
    this.lifecycleManager = new LifecycleManager<TStage, TData>(config, this.stageMap);

    // Add initial middleware to MiddlewareManager
    if (config.middleware) {
      for (const middleware of config.middleware) {
        this.middlewareManager.addMiddleware(middleware);
      }
    }

    // Set engine reference for managers
    this.pluginManager.setEngine(this);
    this.transitionManager.setEngine(this);

    // Install initial plugins if provided
    if (config.plugins) {
      for (const plugin of config.plugins) {
        this.pluginManager.installPlugin(plugin);
      }
    }

    // Set up timers for the initial stage
    if (initialStageConfig) {
      this.timerManager.setupStageTimers(
        config.initial,
        initialStageConfig,
        this._executeTransition.bind(this),
        () => this.stateManager.getCurrentStage(),
        () => this.lifecycleManager.isEngineStarted(),
        () => this.stateManager.isTransitioning(),
        () => this.stateManager.getCurrentData()
      );
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
    return this.stateManager.getCurrentStage();
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
    return this.stateManager.getCurrentData();
  }

  /**
   * Gets the effect configuration for the current stage
   */
  getCurrentStageEffect(): string | undefined {
    return this.stateManager.getCurrentStageEffect();
  }

  /**
   * Gets the effect configuration for a specific stage
   */
  getStageEffect(stage: TStage): string | undefined {
    return this.stateManager.getStageEffect(stage);
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
    return this.transitionManager.send(event, data, this.stateManager.getCurrentStage(), this.stateManager.isTransitioning(), this.lifecycleManager.isEngineStarted());
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
    return this.transitionManager.goTo(stage, data, this.stateManager.getCurrentStage(), this.stateManager.isTransitioning(), this.lifecycleManager.isEngineStarted());
  }

  /**
   * Pauses all timers for the current stage
   */
  pauseTimers(): void {
    this.timerManager.pauseTimers(this.stateManager.getCurrentStage(), () => this.stateManager.getCurrentData());
  }

  /**
   * Resumes all paused timers for the current stage
   */
  resumeTimers(): void {
    const currentStage = this.stateManager.getCurrentStage();
    const stageConfig = this.stageMap.get(currentStage);

    if (!stageConfig) {
      return;
    }

    this.timerManager.resumeTimers(
      currentStage,
      stageConfig,
      this._executeTransition.bind(this),
      () => this.stateManager.getCurrentStage(),
      () => this.lifecycleManager.isEngineStarted(),
      () => this.stateManager.isTransitioning(),
      () => this.stateManager.getCurrentData()
    );
  }

  /**
   * Resets all timers for the current stage to their original duration
   */
  resetTimers(): void {
    const currentStage = this.stateManager.getCurrentStage();
    const stageConfig = this.stageMap.get(currentStage);

    if (!stageConfig) {
      return;
    }

    this.timerManager.resetTimers(
      currentStage,
      stageConfig,
      this._executeTransition.bind(this),
      () => this.stateManager.getCurrentStage(),
      () => this.lifecycleManager.isEngineStarted(),
      () => this.stateManager.isTransitioning(),
      () => this.stateManager.getCurrentData()
    );
  }

  /**
   * Gets the remaining time for timers in the current stage
   */
  getTimerRemainingTime(): number {
    return this.timerManager.getTimerRemainingTime(this.stateManager.getCurrentStage());
  }

  /**
   * Checks if timers are paused for the current stage
   */
  areTimersPaused(): boolean {
    return this.timerManager.areTimersPaused(this.stateManager.getCurrentStage());
  }

  /**
   * Notifies all subscribers of stage changes
   */
  private _notifySubscribers(stage: TStage, data?: TData): void {
    this.stateManager.notifySubscribers(stage, data);
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
    return this.stateManager.subscribe(callback);
  }

  /**
   * Installs a plugin into the stage flow engine
   */
  async installPlugin(plugin: Plugin<TStage, TData>): Promise<void> {
    return this.pluginManager.installPlugin(plugin);
  }

  /**
   * Uninstalls a plugin from the stage flow engine
   */
  async uninstallPlugin(name: string): Promise<void> {
    return this.pluginManager.uninstallPlugin(name);
  }

  /**
   * Gets a list of installed plugin names
   */
  getInstalledPlugins(): string[] {
    return this.pluginManager.getInstalledPlugins();
  }

  /**
   * Gets a specific plugin by name
   */
  getPlugin(name: string): Plugin<TStage, TData> | undefined {
    return this.pluginManager.getPlugin(name);
  }

  /**
   * Gets plugin state for a specific plugin
   */
  getPluginState(name: string): Record<string, unknown> | undefined {
    return this.stateManager.getPluginStateByName(name);
  }

  /**
   * Sets plugin state for a specific plugin
   */
  setPluginState(name: string, state: Record<string, unknown>): void {
    // Check if plugin exists
    if (!this.pluginManager.getPlugin(name)) {
      throw new PluginError(`Plugin "${name}" is not installed`);
    }
    this.stateManager.setPluginState(name, state);
  }

  /**
   * Updates the current stage data without triggering a stage transition
   *
   * This method allows you to update the data associated with the current stage
   * without changing stages or triggering any transition logic. It's useful for
   * updating form data, user input, or other state that doesn't require a
   * stage change.
   *
   * @param data - The new data to set for the current stage
   *
   * @throws {TransitionError} When the engine is not started or a transition is in progress
   *
   * @example
   * ```typescript
   * // Update form data without changing stages
   * engine.setStageData({
   *   ...engine.getCurrentData(),
   *   name: 'John Doe',
   *   email: 'john@example.com'
   * });
   *
   * // Update validation errors
   * engine.setStageData({
   *   ...engine.getCurrentData(),
   *   errors: { email: 'Invalid email format' }
   * });
   * ```
   */
  setStageData(data: TData): void {
    if (!this.lifecycleManager.isEngineStarted()) {
      throw new TransitionError("Engine must be started before updating stage data");
    }

    if (this.stateManager.isTransitioning()) {
      throw new TransitionError("Cannot update stage data while transition is in progress");
    }

    // Validate data against current stage
    try {
      this.runtimeTypeChecker.validateStageData(this.stateManager.getCurrentStage(), data);
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw new TransitionError(error.message, error.context);
      }
      throw error;
    }

    // Update the data
    this.stateManager.updateStageData(data);

    // Notify subscribers of the data change
    this._notifySubscribers(this.stateManager.getCurrentStage(), data);
  }

  /**
   * Adds middleware to the pipeline
   */
  addMiddleware(middleware: Middleware<TStage, TData>): void {
    this.middlewareManager.addMiddleware(middleware);
    // Also add to state for backward compatibility
    this.state.middleware.push(middleware);
  }

  /**
   * Removes middleware from the pipeline by name
   */
  removeMiddleware(name: string): void {
    this.middlewareManager.removeMiddleware(name);
    // Also remove from state for backward compatibility
    const index = this.state.middleware.findIndex(m => m.name === name);
    if (index !== -1) {
      this.state.middleware.splice(index, 1);
    }
  }

  /**
   * Starts the stage flow engine
   */
  async start(): Promise<void> {
    // Set engine reference for lifecycle manager
    this.lifecycleManager.setEngine(this);
    
    // Delegate to lifecycle manager
    await this.lifecycleManager.start();
  }

  /**
   * Stops the stage flow engine
   */
  async stop(): Promise<void> {
    // Set engine reference for lifecycle manager
    this.lifecycleManager.setEngine(this);
    
    // Delegate to lifecycle manager
    await this.lifecycleManager.stop();
  }

  /**
   * Resets the stage flow engine to its initial state
   */
  async reset(): Promise<void> {
    // Set engine reference for lifecycle manager
    this.lifecycleManager.setEngine(this);
    
    // Delegate to lifecycle manager
    await this.lifecycleManager.reset();
  }



  // Internal methods for TransitionManager to access engine state
  _setTransitioning(isTransitioning: boolean): void {
    this.stateManager.setTransitioning(isTransitioning);
  }

  _clearStageTimers(stage: TStage): void {
    this.timerManager.clearStageTimers(stage);
  }

  _updateCurrentStage(stage: TStage): void {
    this.stateManager.updateCurrentStage(stage);
  }

  _updateStageData(data: TData): void {
    this.stateManager.updateStageData(data);
  }

  _getCurrentData(): TData | undefined {
    return this.stateManager.getCurrentData();
  }

  _addToHistory(stage: TStage, data?: TData): void {
    this.stateManager.addToHistory(stage, data);
  }

  _setupStageTimers(stage: TStage, stageConfig: StageConfig<TStage, TData>): void {
    this.timerManager.setupStageTimers(
      stage,
      stageConfig,
      this._executeTransition.bind(this),
      () => this.stateManager.getCurrentStage(),
      () => this.lifecycleManager.isEngineStarted(),
      () => this.stateManager.isTransitioning(),
      () => this.stateManager.getCurrentData()
    );
  }

  /**
   * Executes middleware pipeline for a transition
   * Used by TransitionManager via type assertion
   */
  // @ts-expect-error - This method is used by TransitionManager but TypeScript doesn't detect it
  private async _executeMiddlewarePipeline(transitionContext: TransitionContext<TStage, TData>, transition: Transition<TStage, TData>): Promise<void> {
    return this.middlewareManager.executePipeline(transitionContext, transition);
  }

  /**
   * Executes a stage transition (delegates to TransitionManager)
   */
  private async _executeTransition(transition: Transition<TStage, TData>, data?: TData, event?: string): Promise<void> {
    return this.transitionManager.executeTransition(transition, data, event, this.state.current);
  }

  /**
   * Subscribes to timer events
   */
  subscribeToTimerEvents(listener: import("./types/core").TimerEventListener<TStage, TData>): () => void {
    return this.timerManager.subscribeToTimerEvents(listener);
  }

  /**
   * Gets all active timer states
   */
  getActiveTimers(): import("./types/core").TimerState[] {
    return this.timerManager.getActiveTimers();
  }

  /**
   * Gets timer states for a specific stage
   */
  getStageTimers(stage: TStage): import("./types/core").TimerState[] {
    return this.timerManager.getStageTimers(stage);
  }

  /**
   * Serializes timer state for persistence
   */
  serializeTimerState(): string {
    return this.timerManager.serializeTimerState();
  }

  /**
   * Restores timer state from serialized data
   */
  restoreTimerState(serializedState: string): boolean {
    return this.timerManager.restoreTimerState(
      serializedState,
      this.stateManager.getCurrentStage(),
      this._executeTransition.bind(this),
      (stage: TStage) => this.stageMap.get(stage),
      () => this.lifecycleManager.isEngineStarted(),
      () => this.stateManager.isTransitioning()
    );
  }

  /**
   * Cancels a specific timer by ID
   */
  cancelTimer(timerId: string): boolean {
    return this.timerManager.cancelTimer(timerId, () => this.stateManager.getCurrentData());
  }

  /**
   * Executes plugin hooks for a given hook type and context
   * Used by TransitionManager via type assertion
   */
  // @ts-expect-error - This method is used by TransitionManager but TypeScript doesn't detect it
  private async _executePluginHooks(
    hookType: keyof NonNullable<Plugin<TStage, TData>['hooks']>,
    context: import('./types/core').StageContext<TStage, TData> | import('./types/core').TransitionContext<TStage, TData>
  ): Promise<void> {
    return this.pluginManager.executePluginHooks(hookType, context);
  }

  /**
   * Creates a new stage context for the current stage
   * Used by TransitionManager via type assertion
   */
  // @ts-expect-error - This method is used by TransitionManager but TypeScript doesn't detect it
  private _createStageContext(): import('./types/core').StageContext<TStage, TData> {
    const currentStage = this.stateManager.getCurrentStage();
    const currentData = this.stateManager.getCurrentData();
    
    return {
      current: currentStage,
      data: currentData,
      timestamp: Date.now(),
      send: this.send.bind(this),
      goTo: this.goTo.bind(this)
    };
  }
}
