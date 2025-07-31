/**
 * Tests for async flow scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StageFlowTestEngine } from '../test-engine';
import {
  createMockPlugin,
  createMockMiddleware,
  createAsyncPlugin,
  createAsyncMiddleware,
  waitForCalls
} from '../mocks';
import { StageFlowConfig } from '@stage-flow/core';
import { Plugin } from '@stage-flow/core';
import { Middleware } from '@stage-flow/core';

type AsyncStage = 'idle' | 'loading' | 'processing' | 'success' | 'error';
interface AsyncData {
  progress: number;
  result?: string;
  error?: string;
}

describe('Async Flow Testing', () => {
  let config: StageFlowConfig<AsyncStage, AsyncData>;

  beforeEach(() => {
    config = {
      initial: 'idle',
      stages: [
        {
          name: 'idle',
          transitions: [
            { target: 'loading', event: 'start' }
          ],
          data: { progress: 0 }
        },
        {
          name: 'loading',
          transitions: [
            { 
              target: 'processing', 
              event: 'loaded',
              condition: async (context) => {
                // Simulate async condition check
                await new Promise(resolve => setTimeout(resolve, 50));
                return context.data?.progress !== undefined && context.data.progress >= 10;
              }
            },
            { target: 'error', event: 'failed' }
          ],
          data: { progress: 10 }
        },
        {
          name: 'processing',
          transitions: [
            { target: 'success', event: 'completed' },
            { target: 'error', event: 'failed' },
            { 
              target: 'success', 
              duration: 3000,
              condition: async (context) => {
                // Auto-complete if progress reaches 100
                return context.data?.progress === 100;
              }
            }
          ],
          data: { progress: 50 }
        },
        {
          name: 'success',
          transitions: [
            { target: 'idle', event: 'reset' }
          ],
          data: { progress: 100, result: 'Success!' }
        },
        {
          name: 'error',
          transitions: [
            { target: 'idle', event: 'reset' },
            { target: 'loading', event: 'retry' }
          ],
          data: { progress: 0, error: 'Something went wrong' }
        }
      ]
    };
  });

  describe.skip('Async Conditions', () => {
    it('should handle async transition conditions', async () => {
      const engine = StageFlowTestEngine.create(config);

      expect(engine.getCurrentStage()).toBe('idle');

      await engine.send('start');
      expect(engine.getCurrentStage()).toBe('loading');

      // This should trigger the async condition
      await engine.send('loaded');
      expect(engine.getCurrentStage()).toBe('processing');
    });

    it('should handle failed async conditions', async () => {
      const engine = StageFlowTestEngine.create(config);

      await engine.send('start');
      expect(engine.getCurrentStage()).toBe('loading');

      // Modify data to make condition fail
      await engine.goTo('loading', { progress: 5 }); // Less than required 10

      // This should not transition due to failed condition
      await engine.send('loaded');
      expect(engine.getCurrentStage()).toBe('loading');
    });

    it('should handle async conditions with time-based transitions', async () => {
      const engine = StageFlowTestEngine.create(config);

      // Navigate to processing stage
      await engine.send('start');
      await engine.send('loaded');
      expect(engine.getCurrentStage()).toBe('processing');

      // Set progress to 100 to satisfy the condition
      await engine.goTo('processing', { progress: 100 });

      // Advance time to trigger the timed transition
      engine.advanceTime(3000);

      expect(engine.getCurrentStage()).toBe('success');
    });
  });

  describe.skip('Async Plugin Hooks', () => {
    it('should handle async plugin hooks', async () => {
      const engine = StageFlowTestEngine.create(config);

      const asyncPlugin = createAsyncPlugin<AsyncStage, AsyncData>('async-plugin', {
        beforeTransition: 100,
        afterTransition: 150,
        onStageEnter: 75,
        onStageExit: 50
      });

      await engine.installPlugin(asyncPlugin);

      const startTime = Date.now();
      await engine.send('start');
      const endTime = Date.now();

      // Should take at least the sum of hook delays
      expect(endTime - startTime).toBeGreaterThanOrEqual(300); // 100 + 150 + 75 + 50 - some tolerance

      expect(engine.getCurrentStage()).toBe('loading');
    });

    it('should handle multiple async plugins', async () => {
      const engine = StageFlowTestEngine.create(config);

      const plugin1 = createAsyncPlugin<AsyncStage, AsyncData>('async-plugin-1', {
        beforeTransition: 50
      });

      const plugin2 = createAsyncPlugin<AsyncStage, AsyncData>('async-plugin-2', {
        beforeTransition: 75
      });

      await engine.installPlugin(plugin1);
      await engine.installPlugin(plugin2);

      const startTime = Date.now();
      await engine.send('start');
      const endTime = Date.now();

      // Both plugins should execute sequentially
      expect(endTime - startTime).toBeGreaterThanOrEqual(120); // 50 + 75 - tolerance

      expect(engine.getCurrentStage()).toBe('loading');
    });

    it('should handle async plugin errors', async () => {
      const engine = StageFlowTestEngine.create(config);

      const errorPlugin = createMockPlugin({
        name: 'error-plugin',
        hooks: {
          beforeTransition: vi.fn().mockRejectedValue(new Error('Async plugin error'))
        }
      }) as Plugin<AsyncStage, AsyncData>;

      const normalPlugin = createAsyncPlugin<AsyncStage, AsyncData>('normal-plugin', {
        beforeTransition: 50
      });

      await engine.installPlugin(errorPlugin);
      await engine.installPlugin(normalPlugin);

      // Transition should still succeed despite async plugin error
      await engine.send('start');

      expect(engine.getCurrentStage()).toBe('loading');
      expect(normalPlugin.hooks?.beforeTransition).toHaveBeenCalled();
    });
  });

  describe.skip('Async Middleware', () => {
    it('should handle async middleware', async () => {
      const engine = StageFlowTestEngine.create(config);

      const asyncMiddleware = createAsyncMiddleware<AsyncStage, AsyncData>('async-middleware', 100);

      engine.addMiddleware(asyncMiddleware);

      const startTime = Date.now();
      await engine.send('start');
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(90); // Allow some tolerance
      expect(engine.getCurrentStage()).toBe('loading');
    });

    it('should handle middleware chain with async operations', async () => {
      const engine = StageFlowTestEngine.create(config);

      const middleware1 = createAsyncMiddleware<AsyncStage, AsyncData>('async-middleware-1', 50);
      const middleware2 = createAsyncMiddleware<AsyncStage, AsyncData>('async-middleware-2', 75);
      const middleware3 = createMockMiddleware({
        name: 'sync-middleware',
        execute: vi.fn(async (context, next) => {
          // Modify data asynchronously
          await new Promise(resolve => setTimeout(resolve, 25));
          context.modify({ data: { ...context.data, progress: 15 } });
          await next();
        })
      }) as Middleware<AsyncStage, AsyncData>;

      engine.addMiddleware(middleware1);
      engine.addMiddleware(middleware2);
      engine.addMiddleware(middleware3);

      const startTime = Date.now();
      await engine.send('start');
      const endTime = Date.now();

      // All middleware should execute sequentially
      expect(endTime - startTime).toBeGreaterThanOrEqual(140); // 50 + 75 + 25 - tolerance

      expect(engine.getCurrentStage()).toBe('loading');
      expect(engine.getCurrentData()?.progress).toBe(15);
    });

    it('should handle async middleware errors', async () => {
      const engine = StageFlowTestEngine.create(config);

      const errorMiddleware = createMockMiddleware({
        name: 'async-error-middleware',
        execute: vi.fn(async (context, next) => {
          await new Promise(resolve => setTimeout(resolve, 50));
          throw new Error('Async middleware error');
        })
      }) as Middleware<AsyncStage, AsyncData>;

      engine.addMiddleware(errorMiddleware);

      await expect(engine.send('start')).rejects.toThrow('Async middleware error');
      expect(engine.getCurrentStage()).toBe('idle');
    });
  });

  describe.skip('Complex Async Scenarios', () => {
    it('should handle async operations with time control', async () => {
      const engine = StageFlowTestEngine.create(config);

      const asyncPlugin = createMockPlugin({
        name: 'time-aware-plugin',
        hooks: {
          onStageEnter: vi.fn(async (context) => {
            if (context.current === 'processing') {
              // Simulate async work that takes time
              await new Promise(resolve => setTimeout(resolve, 200));
              
              // Update progress over time
              const updateProgress = () => {
                const currentData = engine.getCurrentData();
                if (currentData && currentData.progress < 100) {
                  engine.goTo('processing', { 
                    ...currentData, 
                    progress: currentData.progress + 10 
                  });
                  setTimeout(updateProgress, 100);
                }
              };
              updateProgress();
            }
          })
        }
      }) as Plugin<AsyncStage, AsyncData>;

      await engine.installPlugin(asyncPlugin);

      // Start the flow
      await engine.send('start');
      await engine.send('loaded');
      expect(engine.getCurrentStage()).toBe('processing');

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Progress should have been updated
      const finalData = engine.getCurrentData();
      expect(finalData?.progress).toBeGreaterThan(50);
    });

    it('should handle concurrent async operations', async () => {
      const engine = StageFlowTestEngine.create(config);

      const concurrentPlugin = createMockPlugin({
        name: 'concurrent-plugin',
        hooks: {
          beforeTransition: vi.fn(async (context) => {
            // Simulate multiple concurrent async operations
            const operations = [
              new Promise(resolve => setTimeout(resolve, 50)),
              new Promise(resolve => setTimeout(resolve, 75)),
              new Promise(resolve => setTimeout(resolve, 100))
            ];
            
            await Promise.all(operations);
          })
        }
      }) as Plugin<AsyncStage, AsyncData>;

      await engine.installPlugin(concurrentPlugin);

      const startTime = Date.now();
      await engine.send('start');
      const endTime = Date.now();

      // Should take about 100ms (the longest operation), not 225ms (sum)
      expect(endTime - startTime).toBeGreaterThanOrEqual(90);
      expect(endTime - startTime).toBeLessThan(200);

      expect(engine.getCurrentStage()).toBe('loading');
    });

    it('should handle async operations with cancellation', async () => {
      const engine = StageFlowTestEngine.create(config);

      let cancelled = false;
      const cancellablePlugin = createMockPlugin({
        name: 'cancellable-plugin',
        hooks: {
          onStageEnter: vi.fn(async (context) => {
            if (context.current === 'loading') {
              // Start a long-running async operation
              const longOperation = new Promise((resolve) => {
                const timeout = setTimeout(() => {
                  if (!cancelled) {
                    resolve('completed');
                  }
                }, 1000);
                
                // Simulate cancellation mechanism
                const checkCancellation = () => {
                  if (cancelled) {
                    clearTimeout(timeout);
                    resolve('cancelled');
                  } else {
                    setTimeout(checkCancellation, 10);
                  }
                };
                checkCancellation();
              });

              await longOperation;
            }
          }),
          onStageExit: vi.fn(async (context) => {
            if (context.current === 'loading') {
              cancelled = true;
            }
          })
        }
      }) as Plugin<AsyncStage, AsyncData>;

      await engine.installPlugin(cancellablePlugin);

      // Start the async operation
      await engine.send('start');

      // Cancel by transitioning away quickly
      setTimeout(async () => {
        await engine.send('failed');
      }, 100);

      // Wait for the operation to complete or be cancelled
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(engine.getCurrentStage()).toBe('error');
      expect(cancelled).toBe(true);
    });
  });

  describe.skip('Async Testing Utilities', () => {
    it('should use waitForCalls with async operations', async () => {
      const engine = StageFlowTestEngine.create(config);

      const asyncPlugin = createMockPlugin({
        name: 'test-plugin',
        hooks: {
          afterTransition: vi.fn()
        }
      }) as Plugin<AsyncStage, AsyncData>;

      await engine.installPlugin(asyncPlugin);

      // Start multiple async transitions
      const transitions = [
        engine.send('start'),
        engine.send('loaded').then(() => engine.send('completed'))
      ];

      // Wait for all transitions to complete
      await Promise.all(transitions);

      // Wait for the hook to be called the expected number of times
      await waitForCalls(asyncPlugin.hooks!.afterTransition as any, 3, 1000);

      expect(asyncPlugin.hooks!.afterTransition).toHaveBeenCalledTimes(3);
    });

    it('should handle async state inspection', async () => {
      const engine = StageFlowTestEngine.create(config);

      const stateInspectionPlugin = createMockPlugin({
        name: 'state-inspection-plugin',
        hooks: {
          afterTransition: vi.fn(async (context) => {
            // Async state inspection
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const state = engine.getState();
            expect(state.current).toBe(context.to);
            expect(state.isTransitioning).toBe(false);
          })
        }
      }) as Plugin<AsyncStage, AsyncData>;

      await engine.installPlugin(stateInspectionPlugin);

      await engine.send('start');
      await engine.send('loaded');

      expect(stateInspectionPlugin.hooks!.afterTransition).toHaveBeenCalledTimes(2);
    });

    it('should handle async waiting utilities', async () => {
      const engine = StageFlowTestEngine.create(config);

      // Start an async transition
      const transitionPromise = engine.send('start');

      // Wait for the transition to complete
      await engine.waitForTransition();
      await transitionPromise;

      expect(engine.getCurrentStage()).toBe('loading');

      // Wait for a specific stage
      const stagePromise = engine.send('loaded');
      await engine.waitForStage('processing');
      await stagePromise;

      expect(engine.getCurrentStage()).toBe('processing');
    });
  });
});