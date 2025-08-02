/**
 * Transition management system for StageFlow
 * 
 * This module handles all transition-related functionality including:
 * - Transition finding and evaluation
 * - Event-driven transitions (send method)
 * - Direct navigation (goTo method)
 * - Transition execution with lifecycle management
 */

import {
  StageConfig,
  StageContext,
  Transition,
  TransitionContext,
  StageFlowEngine
} from './types/core';
import { TransitionError, ConfigurationError } from './types/errors';
import { RuntimeTypeChecker, DevelopmentWarnings } from './validation';



/**
 * Transition manager class that handles all transition operations for StageFlow
 */
export class TransitionManager<TStage extends string, TData = unknown> {
  private stageMap: Map<TStage, StageConfig<TStage, TData>>;
  private runtimeTypeChecker: RuntimeTypeChecker<TStage, TData>;
  private engine: StageFlowEngine<TStage, TData> | null = null;

  constructor(
    stageMap: Map<TStage, StageConfig<TStage, TData>>,
    runtimeTypeChecker: RuntimeTypeChecker<TStage, TData>
  ) {
    this.stageMap = stageMap;
    this.runtimeTypeChecker = runtimeTypeChecker;
  }

  /**
   * Sets the engine reference for the transition manager
   */
  setEngine(engine: StageFlowEngine<TStage, TData>): void {
    this.engine = engine;
  }

  /**
   * Finds a valid transition based on event or direct target
   */
  findTransition(
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
  async evaluateCondition(
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
   */
  async send(
    event: string,
    data?: TData,
    currentStage?: TStage,
    isTransitioning?: boolean,
    isStarted?: boolean
  ): Promise<void> {
    if (!isStarted) {
      throw new TransitionError('Engine must be started before sending events');
    }

    if (isTransitioning) {
      throw new TransitionError('Cannot send event while transition is in progress');
    }

    if (!currentStage) {
      throw new TransitionError('Current stage is required');
    }

    // Validate event parameter
    if (typeof event !== 'string' || event.trim() === '') {
      throw new TransitionError('Event must be a non-empty string');
    }

    const transition = this.findTransition(currentStage, event, false);
    if (!transition) {
      // No matching transition found - this is not an error, just ignore
      DevelopmentWarnings.warn(
        `No transition found for event "${event}" in stage "${currentStage}"`,
        { currentStage, event }
      );
      return;
    }

    // Runtime validation for the target stage
    try {
      this.runtimeTypeChecker.validateTransition(currentStage, transition.target, event);
      if (data !== undefined) {
        this.runtimeTypeChecker.validateStageData(transition.target, data);
      }
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw new TransitionError(error.message, error.context);
      }
      throw error;
    }

    await this.executeTransition(transition, data, event, currentStage);
  }

  /**
   * Directly navigates to a specific stage
   */
  async goTo(
    stage: TStage,
    data?: TData,
    currentStage?: TStage,
    isTransitioning?: boolean,
    isStarted?: boolean
  ): Promise<void> {
    if (!isStarted) {
      throw new TransitionError('Engine must be started before navigation');
    }

    if (isTransitioning) {
      throw new TransitionError('Cannot navigate while transition is in progress');
    }

    if (!currentStage) {
      throw new TransitionError('Current stage is required');
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

    if (currentStage === stage) {
      // Already at target stage, just update data if provided
      if (data !== undefined && this.engine) {
        this.engine.setStageData(data);
      }
      return;
    }

    // Check if target stage exists
    const targetStageConfig = this.stageMap.get(stage);
    if (!targetStageConfig) {
      throw new TransitionError(`Target stage "${stage}" does not exist`);
    }

    const transition = this.findTransition(currentStage, stage, true);
    if (!transition) {
      // No explicit transition defined, create a direct transition
      const directTransition: Transition<TStage, TData> = {
        target: stage,
        event: `direct-to-${stage}`,
        condition: undefined,
        middleware: []
      };
      await this.executeTransition(directTransition, data, undefined, currentStage);
    } else {
      await this.executeTransition(transition, data, undefined, currentStage);
    }
  }

  /**
   * Executes a stage transition with proper lifecycle management
   */
  async executeTransition(
    transition: Transition<TStage, TData>,
    data?: TData,
    event?: string,
    fromStage?: TStage
  ): Promise<void> {
    if (!this.engine || !fromStage) {
      throw new TransitionError('Engine and fromStage are required for transition execution');
    }

    const toStage = transition.target;

    // Set transitioning state
    (this.engine as any)._setTransitioning(true);

    try {
      // Create stage context for condition evaluation
      const context = (this.engine as any).stateManager.createStageContext();
      // Override send and goTo methods with engine methods
      context.send = (this.engine as any).send.bind(this.engine);
      context.goTo = (this.engine as any).goTo.bind(this.engine);

      // Evaluate transition condition
      const conditionMet = await this.evaluateCondition(transition, context);
      if (!conditionMet) {
        (this.engine as any)._setTransitioning(false);
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
      await (this.engine as any)._executeMiddlewarePipeline(transitionContext, transition);

      // Execute beforeTransition plugin hooks
      await (this.engine as any)._executePluginHooks('beforeTransition', transitionContext);

      // Get stage configurations (use potentially modified target)
      const fromStageConfig = this.stageMap.get(fromStage);
      const toStageConfig = this.stageMap.get(transitionContext.to);

      if (!toStageConfig) {
        throw new TransitionError(`Target stage configuration not found: ${transitionContext.to}`);
      }

      // Execute onStageExit plugin hooks
      await (this.engine as any)._executePluginHooks('onStageExit', context);

      // Execute onExit hook for current stage
      if (fromStageConfig?.onExit) {
        await fromStageConfig.onExit(context);
      }

      // Clear any existing timers for the current stage
      (this.engine as any)._clearStageTimers(fromStage);

      // Update state (use potentially modified values)
      (this.engine as any)._updateCurrentStage(transitionContext.to);
      (this.engine as any)._updateStageData(transitionContext.data !== undefined ? transitionContext.data : toStageConfig.data);

      // Add to history
      (this.engine as any)._addToHistory(transitionContext.to, (this.engine as any)._getCurrentData());

      // Create new context for the target stage
      const newContext = (this.engine as any)._createStageContext();

      // Execute onEnter hook for new stage
      if (toStageConfig.onEnter) {
        await toStageConfig.onEnter(newContext);
      }

      // Execute onStageEnter plugin hooks
      await (this.engine as any)._executePluginHooks('onStageEnter', newContext);

      // Execute afterTransition plugin hooks
      await (this.engine as any)._executePluginHooks('afterTransition', transitionContext);

      // Set up automatic transitions with timers
      (this.engine as any)._setupStageTimers(
        transitionContext.to,
        toStageConfig
      );

      // Notify subscribers
      (this.engine as any)._notifySubscribers(transitionContext.to, (this.engine as any)._getCurrentData());

    } catch (error) {
      // Reset transitioning state on error
      (this.engine as any)._setTransitioning(false);
      throw error;
    }

    // Reset transitioning state
    (this.engine as any)._setTransitioning(false);
  }
} 