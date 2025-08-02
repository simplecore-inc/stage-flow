/**
 * Lifecycle management system for StageFlow
 *
 * This module handles all lifecycle-related functionality including:
 * - Engine start/stop/reset lifecycle management
 * - Plugin lifecycle coordination
 * - Stage lifecycle hooks execution
 * - Initialization and cleanup sequences
 */

import {
  StageFlowConfig,
  StageConfig,
  StageContext,
  Plugin,
  StageFlowEngine
} from './types/core';
import { StageFlowError } from './types/errors';

/**
 * Lifecycle manager class that handles all lifecycle operations for StageFlow
 */
export class LifecycleManager<TStage extends string, TData = unknown> {
  private engine: StageFlowEngine<TStage, TData> | null = null;
  private isStarted: boolean = false;
  private config: StageFlowConfig<TStage, TData>;
  private stageMap: Map<TStage, StageConfig<TStage, TData>>;

  constructor(
    config: StageFlowConfig<TStage, TData>,
    stageMap: Map<TStage, StageConfig<TStage, TData>>
  ) {
    this.config = config;
    this.stageMap = stageMap;
  }

  /**
   * Sets the engine reference for the lifecycle manager
   */
  setEngine(engine: StageFlowEngine<TStage, TData>): void {
    this.engine = engine;
  }

  /**
   * Gets the current lifecycle state
   */
  isEngineStarted(): boolean {
    return this.isStarted;
  }

  /**
   * Starts the stage flow engine lifecycle
   */
  async start(): Promise<void> {
    if (!this.engine) {
      throw new StageFlowError('Engine not set', 'ENGINE_NOT_SET');
    }

    if (this.isStarted) {
      return;
    }

    this.isStarted = true;

    // Install initial plugins if not already done
    if (this.config.plugins && (this.engine as any).pluginManager.getPluginCount() === 0) {
      for (const plugin of this.config.plugins) {
        await (this.engine as any).pluginManager.installPlugin(plugin);
      }
    }

    // Install plugins in dependency order
    await (this.engine as any).pluginManager.installAllPlugins();

    // Create initial stage context
    const context = (this.engine as any).stateManager.createStageContext();
    // Override send and goTo methods with engine methods
    context.send = (this.engine as any).send.bind(this.engine);
    context.goTo = (this.engine as any).goTo.bind(this.engine);

    // Execute onStageEnter plugin hooks for initial stage
    await (this.engine as any).pluginManager.executePluginHooks('onStageEnter', context);

    // Execute onEnter hook for initial stage if it exists
    const initialStageConfig = this.stageMap.get((this.engine as any).stateManager.getCurrentStage());
    if (initialStageConfig?.onEnter) {
      try {
        await initialStageConfig.onEnter(context);
      } catch (error) {
        console.error('Initial stage onEnter hook failed:', error);
      }
    }

    // Notify subscribers of initial state
    (this.engine as any)._notifySubscribers(
      (this.engine as any).stateManager.getCurrentStage(),
      (this.engine as any).stateManager.getCurrentData()
    );

    // Setup timers for initial stage
    const currentStageConfig = this.stageMap.get((this.engine as any).stateManager.getCurrentStage());
    if (currentStageConfig) {
      (this.engine as any).timerManager.setupStageTimers(
        (this.engine as any).stateManager.getCurrentStage(),
        currentStageConfig,
        (this.engine as any)._executeTransition.bind(this.engine),
        () => (this.engine as any).stateManager.getCurrentStage(),
        () => this.isStarted,
        () => (this.engine as any).stateManager.isTransitioning(),
        () => (this.engine as any).stateManager.getCurrentData()
      );
    }
  }

  /**
   * Stops the stage flow engine lifecycle
   */
  async stop(): Promise<void> {
    if (!this.engine) {
      throw new StageFlowError('Engine not set', 'ENGINE_NOT_SET');
    }

    if (!this.isStarted) {
      return;
    }

    this.isStarted = false;

    // Clear all timers
    (this.engine as any).timerManager.clearAllTimers();

    // Create context for current stage
    const context = (this.engine as any).stateManager.createStageContext();
    // Override send and goTo methods with engine methods
    context.send = (this.engine as any).send.bind(this.engine);
    context.goTo = (this.engine as any).goTo.bind(this.engine);

    // Execute onStageExit plugin hooks for current stage
    await (this.engine as any).pluginManager.executePluginHooks('onStageExit', context);

    // Execute onExit hook for current stage if it exists
    const currentStageConfig = this.stageMap.get((this.engine as any).stateManager.getCurrentStage());
    if (currentStageConfig?.onExit) {
      try {
        await currentStageConfig.onExit(context);
      } catch (error) {
        console.error('Current stage onExit hook failed:', error);
      }
    }

    // Uninstall plugins in reverse dependency order
    await (this.engine as any).pluginManager.uninstallAllPlugins();
  }

  /**
   * Resets the stage flow engine lifecycle
   */
  async reset(): Promise<void> {
    if (!this.engine) {
      throw new StageFlowError('Engine not set', 'ENGINE_NOT_SET');
    }

    const wasStarted = this.isStarted;

    // Stop the engine first
    await this.stop();

    // Clear all timers
    (this.engine as any).timerManager.clearAllTimers();

    // Reset state to initial
    (this.engine as any).stateManager.resetState(this.config.initial, undefined);

    // Set up timers for the initial stage
    const initialStageConfig = this.stageMap.get(this.config.initial);
    if (initialStageConfig) {
      (this.engine as any).timerManager.setupStageTimers(
        this.config.initial,
        initialStageConfig,
        (this.engine as any)._executeTransition.bind(this.engine),
        () => (this.engine as any).stateManager.getCurrentStage(),
        () => this.isStarted,
        () => (this.engine as any).stateManager.isTransitioning(),
        () => (this.engine as any).stateManager.getCurrentData()
      );
    }

    // Restart if it was previously started
    if (wasStarted) {
      await this.start();
    }
  }

  /**
   * Executes plugin hooks of a specific type in dependency order
   */
  async executePluginHooks(
    hookType: keyof NonNullable<Plugin<TStage, TData>['hooks']>,
    context: StageContext<TStage, TData>
  ): Promise<void> {
    if (!this.engine) {
      throw new StageFlowError('Engine not set', 'ENGINE_NOT_SET');
    }

    return (this.engine as any).pluginManager.executePluginHooks(hookType, context);
  }

  /**
   * Gets the current lifecycle state information
   */
  getLifecycleState(): {
    isStarted: boolean;
    currentStage: TStage;
    isTransitioning: boolean;
    pluginCount: number;
    timerCount: number;
  } {
    if (!this.engine) {
      throw new StageFlowError('Engine not set', 'ENGINE_NOT_SET');
    }

    return {
      isStarted: this.isStarted,
      currentStage: (this.engine as any).stateManager.getCurrentStage(),
      isTransitioning: (this.engine as any).stateManager.isTransitioning(),
      pluginCount: (this.engine as any).pluginManager.getPluginCount(),
      timerCount: (this.engine as any).timerManager.getActiveTimers().length
    };
  }

  /**
   * Validates lifecycle state consistency
   */
  validateLifecycleState(): void {
    if (!this.engine) {
      throw new StageFlowError('Engine not set', 'ENGINE_NOT_SET');
    }

    const state = this.getLifecycleState();
    
    // Validate that current stage exists in stage map
    if (!this.stageMap.has(state.currentStage)) {
      throw new StageFlowError(`Current stage "${state.currentStage}" not found in stage map`, 'STAGE_NOT_FOUND');
    }

    // Validate that if engine is started, it has a valid current stage
    if (this.isStarted && !state.currentStage) {
      throw new StageFlowError('Engine is started but has no current stage', 'INVALID_STATE');
    }

    // Validate that if transitioning, engine is started
    if (state.isTransitioning && !this.isStarted) {
      throw new StageFlowError('Engine is transitioning but not started', 'INVALID_STATE');
    }
  }

  /**
   * Serializes lifecycle state for persistence
   */
  serializeLifecycleState(): string {
    const state = this.getLifecycleState();
    return JSON.stringify({
      isStarted: state.isStarted,
      currentStage: state.currentStage,
      isTransitioning: state.isTransitioning,
      pluginCount: state.pluginCount,
      timerCount: state.timerCount,
      timestamp: Date.now()
    });
  }

  /**
   * Restores lifecycle state from serialized data
   */
  restoreLifecycleState(serializedState: string): void {
    try {
      const state = JSON.parse(serializedState);
      
      // Note: We can't fully restore lifecycle state from serialized data
      // This is mainly for debugging and state tracking purposes
      console.warn('Lifecycle state restoration is limited to structure only');
      
      // Validate the restored state structure
      if (typeof state.isStarted !== 'boolean') {
        throw new Error('Invalid lifecycle state: isStarted must be boolean');
      }
      
      if (typeof state.currentStage !== 'string') {
        throw new Error('Invalid lifecycle state: currentStage must be string');
      }
      
    } catch (error) {
      throw new StageFlowError(
        'Failed to restore lifecycle state from serialized data',
        'LIFECYCLE_RESTORE_ERROR'
      );
    }
  }

  /**
   * Updates the stage map reference
   */
  updateStageMap(stageMap: Map<TStage, StageConfig<TStage, TData>>): void {
    this.stageMap = stageMap;
  }
} 