/**
 * Timer management system for StageFlow
 * 
 * This module handles all timer-related functionality including:
 * - Timer creation and cleanup
 * - Timer pause/resume/reset operations
 * - Timer event emission
 * - Timer state persistence
 * - Error handling and retry logic
 */

import {
  Transition,
  StageConfig,
  TimerEvent,
  TimerEventListener,
  TimerConfig,
  TimerState
} from './types/core';

/**
 * Timer manager class that handles all timer operations for StageFlow
 */
export class TimerManager<TStage extends string, TData = unknown> {
  private _timers: Map<string, any>;
  private _timerPaused: Map<string, boolean>;
  private _timerStartTimes: Map<string, number>;
  private _timerRemainingTimes: Map<string, number>;
  private _timerConfigs: Map<string, TimerConfig>;
  private _timerEventListeners: Set<TimerEventListener<TStage, TData>>;

  constructor() {
    this._timers = new Map();
    this._timerPaused = new Map();
    this._timerStartTimes = new Map();
    this._timerRemainingTimes = new Map();
    this._timerConfigs = new Map();
    this._timerEventListeners = new Set();
  }

  /**
   * Sets up automatic transitions with timers for a stage
   */
  setupStageTimers(
    stage: TStage,
    stageConfig: StageConfig<TStage, TData>,
    executeTransition: (transition: Transition<TStage, TData>) => Promise<void>,
    getCurrentStage: () => TStage,
    isStarted: () => boolean,
    isTransitioning: () => boolean,
    getCurrentData: () => TData | undefined
  ): void {
    // Clear existing timers for this stage first
    this.clearStageTimers(stage);
    
    // Sort transitions by priority (shorter duration = higher priority by default)
    const timerTransitions = stageConfig.transitions
      .filter(t => t.after && t.after > 0)
      .sort((a, b) => {
        // Primary sort: by duration (shorter first)
        const durationDiff = (a.after || 0) - (b.after || 0);
        if (durationDiff !== 0) return durationDiff;
        
        // Secondary sort: by target stage name for consistency
        return a.target.localeCompare(b.target);
      });

    for (const transition of timerTransitions) {
      if (transition.after && transition.after > 0) {
        const timerId = `${stage}-${transition.target}-${transition.after}`;
        
        // Store timer start time and configuration
        const startTime = Date.now();
        this._timerStartTimes.set(timerId, startTime);
        this._timerConfigs.set(timerId, {
          duration: transition.after || 0,
          id: timerId
        });
        
        // Store the timer reference
        this._timers.set(timerId, setTimeout(async () => {
          try {
            // Check if timer is still valid (not cleared) and conditions are met
            const currentStage = getCurrentStage();
            const isEngineStarted = isStarted();
            const isCurrentlyTransitioning = isTransitioning();
            const stageMatches = currentStage === stage;
            const shouldTransition = this._timers.has(timerId) && isEngineStarted && stageMatches && !isCurrentlyTransitioning;
            
            if (!shouldTransition) {
              // Clean up timer references even when conditions are not met
              this._timers.delete(timerId);
              this._timerPaused.delete(timerId);
              this._timerStartTimes.delete(timerId);
              this._timerRemainingTimes.delete(timerId);
              this._timerConfigs.delete(timerId);
              return;
            }
            
            // Additional safety check: ensure we're still in the expected stage
            if (getCurrentStage() !== stage) {
              this._timers.delete(timerId);
              this._timerPaused.delete(timerId);
              this._timerStartTimes.delete(timerId);
              this._timerRemainingTimes.delete(timerId);
              this._timerConfigs.delete(timerId);
              return;
            }
            
            try {
              console.debug('[TimerManager] Executing transition:', timerId, 'from', stage, 'to', transition.target);
              await executeTransition(transition);
              console.debug('[TimerManager] Transition completed:', timerId, 'from', stage, 'to', transition.target);
            } catch (transitionError) {
              console.error('[TimerManager] Transition execution failed for', timerId, ':', transitionError);
              throw transitionError;
            }
          } catch (error) {
            // Handle timer-based transition errors with retry logic
            await this._handleTimerError(timerId, transition, error, executeTransition, getCurrentStage, isStarted, isTransitioning, getCurrentData);
          } finally {
            // Clean up the timer reference
            this._timers.delete(timerId);
            this._timerPaused.delete(timerId);
            this._timerStartTimes.delete(timerId);
            this._timerRemainingTimes.delete(timerId);
            this._timerConfigs.delete(timerId);
            // Emit timer completed event
            this._emitTimerEvent({
              type: 'timer:completed',
              timerId,
              stage,
              target: transition.target,
              duration: transition.after || 0,
              timestamp: Date.now(),
              data: getCurrentData()
            });
          }
        }, transition.after));
      }
    }
  }

  /**
   * Clears all timers for a specific stage
   */
  clearStageTimers(stage: TStage): void {
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
      this._timerConfigs.delete(timerId);
    });
  }

  /**
   * Pauses all timers for the current stage
   */
  pauseTimers(currentStage: TStage, getCurrentData: () => TData | undefined): void {
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
        
        // Emit timer paused event
        const parts = timerId.split('-');
        if (parts.length >= 3) {
          const target = parts[1] as TStage;
          const duration = parseInt(parts[2]);
          
          this._emitTimerEvent({
            type: 'timer:paused',
            timerId,
            stage: currentStage,
            target,
            duration,
            remainingTime: remaining,
            timestamp: Date.now(),
            data: getCurrentData()
          });
        }
      }
    }
  }

  /**
   * Resumes all paused timers for the current stage
   */
  resumeTimers(
    currentStage: TStage,
    stageConfig: StageConfig<TStage, TData>,
    executeTransition: (transition: Transition<TStage, TData>) => Promise<void>,
    getCurrentStage: () => TStage,
    isStarted: () => boolean,
    isTransitioning: () => boolean,
    getCurrentData: () => TData | undefined
  ): void {
    for (const transition of stageConfig.transitions) {
      if (transition.after && transition.after > 0) {
        const timerId = `${currentStage}-${transition.target}-${transition.after}`;
        
        if (this._timerPaused.get(timerId)) {
          const remaining = this._timerRemainingTimes.get(timerId) || transition.after;
          
          if (remaining > 0) {
            const timer = setTimeout(async () => {
              try {
                // Check if timer is still valid (not cleared) and conditions are met
                if (this._timers.has(timerId) && isStarted() && getCurrentStage() === currentStage && !isTransitioning()) {
                  await executeTransition(transition);
                }
              } catch (error) {
                console.error('Timer-based transition failed:', error);
              } finally {
                this._timers.delete(timerId);
                this._timerPaused.delete(timerId);
                this._timerStartTimes.delete(timerId);
                this._timerRemainingTimes.delete(timerId);
                this._timerConfigs.delete(timerId);
              }
            }, remaining);
            
            this._timers.set(timerId, timer);
            // Adjust start time to account for the remaining time
            this._timerStartTimes.set(timerId, Date.now() - (transition.after - remaining));
            this._timerPaused.delete(timerId);
            
            // Emit timer resumed event
            this._emitTimerEvent({
              type: 'timer:resumed',
              timerId,
              stage: currentStage,
              target: transition.target,
              duration: transition.after || 0,
              remainingTime: remaining,
              timestamp: Date.now(),
              data: getCurrentData()
            });
          }
        }
      }
    }
  }

  /**
   * Resets all timers for the current stage to their original duration
   */
  resetTimers(
    currentStage: TStage,
    stageConfig: StageConfig<TStage, TData>,
    executeTransition: (transition: Transition<TStage, TData>) => Promise<void>,
    getCurrentStage: () => TStage,
    isStarted: () => boolean,
    isTransitioning: () => boolean,
    getCurrentData: () => TData | undefined
  ): void {
    // Clear existing timers and timer state
    this.clearStageTimers(currentStage);
    
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
      this._timerConfigs.delete(timerId);
      
      // Emit timer reset event
      const parts = timerId.split('-');
      if (parts.length >= 3) {
        const target = parts[1] as TStage;
        const duration = parseInt(parts[2]);
        
        this._emitTimerEvent({
          type: 'timer:reset',
          timerId,
          stage: currentStage,
          target,
          duration,
          timestamp: Date.now(),
          data: getCurrentData()
        });
      }
    });
    
    // Setup new timers with original duration
    this.setupStageTimers(currentStage, stageConfig, executeTransition, getCurrentStage, isStarted, isTransitioning, getCurrentData);
  }

  /**
   * Gets the remaining time for timers in the current stage
   */
  getTimerRemainingTime(currentStage: TStage): number {
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
  areTimersPaused(currentStage: TStage): boolean {
    for (const [timerId, isPaused] of this._timerPaused.entries()) {
      if (timerId.startsWith(`${currentStage}-`) && isPaused) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Subscribes to timer events
   */
  subscribeToTimerEvents(listener: TimerEventListener<TStage, TData>): () => void {
    this._timerEventListeners.add(listener);
    
    return () => {
      this._timerEventListeners.delete(listener);
    };
  }

  /**
   * Gets all active timer states
   */
  getActiveTimers(): TimerState[] {
    const timerStates: TimerState[] = [];
    
    for (const [timerId, _timer] of this._timers.entries()) {
      const parts = timerId.split('-');
      if (parts.length >= 3) {
        const stage = parts[0] as TStage;
        const target = parts[1] as TStage;
        const duration = parseInt(parts[2]);
        
        const startTime = this._timerStartTimes.get(timerId) || 0;
        const isPaused = this._timerPaused.get(timerId) || false;
        const remainingTime = isPaused 
          ? this._timerRemainingTimes.get(timerId) || 0
          : Math.max(0, duration - (Date.now() - startTime));
        
        const config = this._timerConfigs.get(timerId) || {
          duration,
          id: timerId
        };

        timerStates.push({
          id: timerId,
          stage,
          target,
          duration,
          remainingTime,
          isPaused,
          startTime,
          config
        });
      }
    }
    
    return timerStates;
  }

  /**
   * Gets timer states for a specific stage
   */
  getStageTimers(stage: TStage): TimerState[] {
    return this.getActiveTimers().filter(timer => timer.stage === stage);
  }

  /**
   * Cancels a specific timer by ID
   */
  cancelTimer(timerId: string, getCurrentData: () => TData | undefined): boolean {
    const timer = this._timers.get(timerId);
    if (!timer) {
      return false;
    }

    this._timers.delete(timerId);
    
    // Clean up timer state
    const isPaused = this._timerPaused.get(timerId) || false;
    const remainingTime = isPaused 
      ? this._timerRemainingTimes.get(timerId) || 0
      : 0;
    
    this._timerPaused.delete(timerId);
    this._timerStartTimes.delete(timerId);
    this._timerRemainingTimes.delete(timerId);
    this._timerConfigs.delete(timerId);

    // Emit timer cancelled event
    const parts = timerId.split('-');
    if (parts.length >= 3) {
      const stage = parts[0] as TStage;
      const target = parts[1] as TStage;
      const duration = parseInt(parts[2]);
      
      this._emitTimerEvent({
        type: 'timer:cancelled',
        timerId,
        stage,
        target,
        duration,
        remainingTime,
        timestamp: Date.now(),
        data: getCurrentData()
      });
    }

    return true;
  }

  /**
   * Serializes timer state for persistence
   */
  serializeTimerState(): string {
    const timerStates = this.getActiveTimers();
    const serializedState = {
      timers: timerStates.map(timer => ({
        id: timer.id,
        stage: timer.stage,
        target: timer.target,
        duration: timer.duration,
        remainingTime: timer.remainingTime,
        isPaused: timer.isPaused,
        startTime: timer.startTime,
        config: timer.config
      })),
      timestamp: Date.now()
    };
    
    return JSON.stringify(serializedState);
  }

  /**
   * Restores timer state from serialized data
   */
  restoreTimerState(
    serializedState: string,
    currentStage: TStage,
    executeTransition: (transition: Transition<TStage, TData>) => Promise<void>,
    getStageConfig: (stage: TStage) => StageConfig<TStage, TData> | undefined,
    isStarted: () => boolean,
    isTransitioning: () => boolean
  ): boolean {
    try {
      const state = JSON.parse(serializedState);
      const currentTime = Date.now();
      const timeDiff = currentTime - state.timestamp;
      
      // Clear existing timers
      this.clearStageTimers(currentStage);
      
      // Restore timers
      for (const timerData of state.timers) {
        if (timerData.stage === currentStage) {
          const adjustedRemainingTime = Math.max(0, timerData.remainingTime - timeDiff);
          
          if (adjustedRemainingTime > 0) {
            const timer = setTimeout(async () => {
              try {
                if (isStarted() && currentStage === timerData.stage && !isTransitioning()) {
                  // Find the corresponding transition
                  const stageConfig = getStageConfig(timerData.stage as TStage);
                  const transition = stageConfig?.transitions.find(t => 
                    t.target === timerData.target && t.after === timerData.duration
                  );
                  
                  if (transition) {
                    await executeTransition(transition);
                  }
                }
              } catch (error) {
                console.error('Restored timer execution failed:', error);
              } finally {
                this._timers.delete(timerData.id);
                this._timerPaused.delete(timerData.id);
                this._timerStartTimes.delete(timerData.id);
                this._timerRemainingTimes.delete(timerData.id);
                this._timerConfigs.delete(timerData.id);
              }
            }, adjustedRemainingTime);
            
            this._timers.set(timerData.id, timer);
            this._timerStartTimes.set(timerData.id, currentTime - (timerData.duration - adjustedRemainingTime));
            this._timerPaused.set(timerData.id, timerData.isPaused);
            this._timerRemainingTimes.set(timerData.id, adjustedRemainingTime);
            this._timerConfigs.set(timerData.id, timerData.config);
            
            if (timerData.isPaused) {
              clearTimeout(timer);
              this._timers.delete(timerData.id);
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to restore timer state:', error);
      return false;
    }
  }

  /**
   * Clears all active timers and resets timer state
   */
  clearAllTimers(): void {
    for (const [_timerId, timer] of this._timers.entries()) {
      clearTimeout(timer);
    }
    this._timers.clear();
    this._timerPaused.clear();
    this._timerStartTimes.clear();
    this._timerRemainingTimes.clear();
    this._timerConfigs.clear();
  }

  /**
   * Emits a timer event to all listeners
   */
  private _emitTimerEvent(event: TimerEvent<TStage, TData>): void {
    for (const listener of this._timerEventListeners) {
      try {
        listener(event);
      } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
          console.error('Timer event listener error:', error);
        }
      }
    }
  }

  /**
   * Handles timer execution errors with retry logic
   */
  private async _handleTimerError(
    timerId: string, 
    transition: Transition<TStage, TData>, 
    error: unknown,
    executeTransition: (transition: Transition<TStage, TData>) => Promise<void>,
    getCurrentStage: () => TStage,
    isStarted: () => boolean,
    isTransitioning: () => boolean,
    getCurrentData: () => TData | undefined
  ): Promise<void> {
    const config = this._timerConfigs.get(timerId);
    const maxRetries = config?.metadata?.maxRetries as number || 3;
    const currentRetries = config?.metadata?.retryCount as number || 0;
    
    console.error(`Timer-based transition failed (attempt ${currentRetries + 1}/${maxRetries}):`, error);
    
    if (currentRetries < maxRetries) {
      // Update retry count
      if (config) {
        config.metadata = {
          ...config.metadata,
          retryCount: currentRetries + 1
        };
        this._timerConfigs.set(timerId, config);
      }
      
      // Retry after a short delay
      const retryDelay = Math.min(1000 * Math.pow(2, currentRetries), 10000); // Exponential backoff, max 10s
      
      setTimeout(async () => {
        try {
          if (isStarted() && getCurrentStage() === transition.target && !isTransitioning()) {
            await executeTransition(transition);
          }
        } catch (retryError) {
          await this._handleTimerError(timerId, transition, retryError, executeTransition, getCurrentStage, isStarted, isTransitioning, getCurrentData);
        }
      }, retryDelay);
    } else {
      // Max retries reached, emit error event
      const parts = timerId.split('-');
      if (parts.length >= 3) {
        const stage = parts[0] as TStage;
        const target = parts[1] as TStage;
        const duration = parseInt(parts[2]);
        
        this._emitTimerEvent({
          type: 'timer:cancelled',
          timerId,
          stage,
          target,
          duration,
          timestamp: Date.now(),
          data: getCurrentData()
        });
      }
    }
  }
}