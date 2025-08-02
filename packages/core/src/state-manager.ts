/**
 * State management system for StageFlow
 *
 * This module handles all state-related functionality including:
 * - State management and updates
 * - Subscription system for state changes
 * - Stage context creation
 * - State history management
 */

import {
  StageFlowState,
  StageContext,
  StageConfig
} from './types/core';
import { StageFlowError } from './types/errors';

/**
 * State manager class that handles all state operations for StageFlow
 */
export class StateManager<TStage extends string, TData = unknown> {
  private state: StageFlowState<TStage, TData>;
  private subscribers: Set<(stage: TStage, data?: TData) => void> = new Set();
  private stageMap: Map<TStage, StageConfig<TStage, TData>>;

  constructor(
    initialState: StageFlowState<TStage, TData>,
    stageMap: Map<TStage, StageConfig<TStage, TData>>
  ) {
    this.state = { ...initialState };
    this.stageMap = stageMap;
  }

  /**
   * Gets the current state
   */
  getState(): StageFlowState<TStage, TData> {
    return { ...this.state };
  }

  /**
   * Gets the current stage
   */
  getCurrentStage(): TStage {
    return this.state.current;
  }

  /**
   * Gets the current stage data
   */
  getCurrentData(): TData | undefined {
    return this.state.data;
  }

  /**
   * Gets the current stage configuration
   */
  getCurrentStageConfig(): StageConfig<TStage, TData> {
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
    const stageConfig = this.getCurrentStageConfig();
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
  createStageContext(): StageContext<TStage, TData> {
    return {
      current: this.state.current,
      data: this.state.data,
      timestamp: Date.now(),
      send: () => {
        throw new Error('send method must be provided by engine');
      },
      goTo: () => {
        throw new Error('goTo method must be provided by engine');
      }
    };
  }

  /**
   * Updates the current stage
   */
  updateCurrentStage(stage: TStage): void {
    this.state.current = stage;
  }

  /**
   * Updates the current stage data
   */
  updateStageData(data: TData): void {
    this.state.data = data;
  }

  /**
   * Sets the transitioning state
   */
  setTransitioning(isTransitioning: boolean): void {
    this.state.isTransitioning = isTransitioning;
  }

  /**
   * Gets the transitioning state
   */
  isTransitioning(): boolean {
    return this.state.isTransitioning;
  }

  /**
   * Adds an entry to the history
   */
  addToHistory(stage: TStage, data?: TData): void {
    this.state.history.push({
      stage,
      timestamp: Date.now(),
      data
    });
  }

  /**
   * Gets the history
   */
  getHistory(): Array<{ stage: TStage; timestamp: number; data?: TData }> {
    return [...this.state.history];
  }

  /**
   * Clears the history
   */
  clearHistory(): void {
    this.state.history = [];
  }

  /**
   * Gets the plugin state
   */
  getPluginState(): Map<string, Record<string, unknown>> {
    return this.state.plugins as unknown as Map<string, Record<string, unknown>>;
  }

  /**
   * Sets plugin state
   */
  setPluginState(name: string, state: Record<string, unknown> | undefined): void {
    if (state === undefined) {
      (this.state.plugins as unknown as Map<string, Record<string, unknown>>).delete(name);
    } else {
      // Merge with existing state
      const existingState = (this.state.plugins as unknown as Map<string, Record<string, unknown>>).get(name);
      const mergedState = existingState ? { ...existingState, ...state } : state;
      (this.state.plugins as unknown as Map<string, Record<string, unknown>>).set(name, mergedState);
    }
  }

  /**
   * Gets plugin state by name
   */
  getPluginStateByName(name: string): Record<string, unknown> | undefined {
    return (this.state.plugins as unknown as Map<string, Record<string, unknown>>).get(name);
  }

  /**
   * Subscribes to state changes
   */
  subscribe(callback: (stage: TStage, data?: TData) => void): () => void {
    this.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notifies all subscribers of state changes
   */
  notifySubscribers(stage: TStage, data?: TData): void {
    for (const callback of this.subscribers) {
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
   * Gets the number of subscribers
   */
  getSubscriberCount(): number {
    return this.subscribers.size;
  }

  /**
   * Clears all subscribers
   */
  clearSubscribers(): void {
    this.subscribers.clear();
  }

  /**
   * Serializes the current state for persistence
   */
  serializeState(): string {
    return JSON.stringify({
      current: this.state.current,
      data: this.state.data,
      isTransitioning: this.state.isTransitioning,
      history: this.state.history,
      plugins: Array.from(this.state.plugins.entries()),
      middleware: this.state.middleware
    });
  }

  /**
   * Restores state from serialized data
   */
  restoreState(serializedState: string): void {
    try {
      const restoredState = JSON.parse(serializedState);
      
      this.state.current = restoredState.current;
      this.state.data = restoredState.data;
      this.state.isTransitioning = restoredState.isTransitioning;
      this.state.history = restoredState.history || [];
      this.state.middleware = restoredState.middleware || [];
      
      // Restore plugins map
      this.state.plugins.clear();
      if (restoredState.plugins) {
        for (const [name, state] of restoredState.plugins) {
          this.state.plugins.set(name, state);
        }
      }
    } catch (error) {
      throw new StageFlowError(
        'Failed to restore state from serialized data',
        'STATE_RESTORE_ERROR'
      );
    }
  }

  /**
   * Resets the state to initial values
   */
  resetState(initialStage: TStage, initialData?: TData): void {
    this.state = {
      current: initialStage,
      data: initialData,
      isTransitioning: false,
      history: [{
        stage: initialStage,
        timestamp: Date.now(),
        data: initialData
      }],
      plugins: new Map(),
      middleware: []
    };
  }

  /**
   * Updates the stage map reference
   */
  updateStageMap(stageMap: Map<TStage, StageConfig<TStage, TData>>): void {
    this.stageMap = stageMap;
  }
} 