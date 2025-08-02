/**
 * Middleware management system for StageFlow
 *
 * This module handles all middleware-related functionality including:
 * - Middleware registration and removal
 * - Middleware pipeline execution
 * - Middleware state management
 */

import {
  Middleware,
  TransitionContext,
  Transition
} from './types/core';
import { MiddlewareError, TransitionError } from './types/errors';

/**
 * Middleware manager class that handles all middleware operations for StageFlow
 */
export class MiddlewareManager<TStage extends string, TData = unknown> {
  private middleware: Middleware<TStage, TData>[] = [];

  /**
   * Adds middleware to the pipeline
   */
  addMiddleware(middleware: Middleware<TStage, TData>): void {
    if (!middleware.name) {
      throw new MiddlewareError('Middleware must have a name');
    }

    // Check if middleware with same name already exists
    const existingIndex = this.middleware.findIndex(m => m.name === middleware.name);
    if (existingIndex !== -1) {
      throw new MiddlewareError(`Middleware "${middleware.name}" is already registered`);
    }

    // Add middleware to the end of the pipeline
    this.middleware.push(middleware);
  }

  /**
   * Removes middleware from the pipeline by name
   */
  removeMiddleware(name: string): void {
    const index = this.middleware.findIndex(m => m.name === name);
    if (index === -1) {
      throw new MiddlewareError(`Middleware "${name}" is not registered`);
    }

    this.middleware.splice(index, 1);
  }

  /**
   * Gets all registered middleware
   */
  getMiddleware(): Middleware<TStage, TData>[] {
    return [...this.middleware];
  }

  /**
   * Gets middleware by name
   */
  getMiddlewareByName(name: string): Middleware<TStage, TData> | undefined {
    return this.middleware.find(m => m.name === name);
  }

  /**
   * Clears all middleware from the pipeline
   */
  clearMiddleware(): void {
    this.middleware = [];
  }

  /**
   * Gets the number of registered middleware
   */
  getMiddlewareCount(): number {
    return this.middleware.length;
  }

  /**
   * Executes middleware pipeline for a transition
   */
  async executePipeline(
    transitionContext: TransitionContext<TStage, TData>,
    transition: Transition<TStage, TData>
  ): Promise<void> {
    // Combine global middleware with transition-specific middleware
    const allMiddleware = [
      ...this.middleware,
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
        // Preserve TransitionError and MiddlewareError, wrap others
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
   * Serializes middleware state for persistence
   */
  serializeMiddlewareState(): string {
    return JSON.stringify({
      middlewareCount: this.middleware.length,
      middlewareNames: this.middleware.map(m => m.name)
    });
  }

  /**
   * Restores middleware state from serialized data
   * Note: This only restores the structure, not the actual middleware instances
   */
  restoreMiddlewareState(serializedState: string): void {
    try {
      JSON.parse(serializedState); // Validate JSON format
      // Note: We can't restore actual middleware instances from serialized data
      // This is mainly for debugging and state tracking purposes
      console.warn('Middleware state restoration is limited to structure only');
    } catch (error) {
      throw new MiddlewareError('Failed to restore middleware state from serialized data');
    }
  }
} 