/**
 * Integration tests for testing utilities with plugins and middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StageFlowTestEngine } from '../test-engine';
import {
  createMockPlugin,
  createMockMiddleware,
  createSpyPlugin,
  createSpyMiddleware,
  createAsyncPlugin,
  createAsyncMiddleware
} from '../mocks';
import { StageFlowConfig, Plugin, Middleware } from '@stage-flow/core';

type TestStage = 'init' | 'processing' | 'complete' | 'error';
interface TestData {
  step: number;
  message: string;
}

describe('Integration Tests', () => {
  let config: StageFlowConfig<TestStage, TestData>;

  beforeEach(() => {
    config = {
      initial: 'init',
      stages: [
        {
          name: 'init',
          transitions: [
            { target: 'processing', event: 'start' },
            { target: 'error', event: 'fail' }
          ],
          data: { step: 0, message: 'Initializing' }
        },
        {
          name: 'processing',
          transitions: [
            { target: 'complete', event: 'finish' },
            { target: 'error', event: 'fail' },
            { target: 'complete', after: 2000 } // Auto-transition after 2 seconds
          ],
          data: { step: 1, message: 'Processing' }
        },
        {
          name: 'complete',
          transitions: [
            { target: 'init', event: 'reset' }
          ],
          data: { step: 2, message: 'Complete' }
        },
        {
          name: 'error',
          transitions: [
            { target: 'init', event: 'retry' }
          ],
          data: { step: -1, message: 'Error occurred' }
        }
      ]
    };
  });

  describe('Plugin and Middleware Interaction', () => {
    it('should execute plugins and middleware in correct order', async () => {
      const engine = StageFlowTestEngine.create(config);
      
      const plugin1 = createSpyPlugin<TestStage, TestData>('plugin1');
      const plugin2 = createSpyPlugin<TestStage, TestData>('plugin2');
      const middleware1 = createSpyMiddleware<TestStage, TestData>('middleware1');
      const middleware2 = createSpyMiddleware<TestStage, TestData>('middleware2');

      await engine.installPlugin(plugin1);
      await engine.installPlugin(plugin2);
      engine.addMiddleware(middleware1);
      engine.addMiddleware(middleware2);

      await engine.send('start');

      // Check that middleware executed in order
      expect(middleware1.calls).toHaveLength(1);
      expect(middleware2.calls).toHaveLength(1);
      expect(middleware1.calls[0].timestamp).toBeLessThanOrEqual(middleware2.calls[0].timestamp);

      // Check that plugin hooks were called
      expect(plugin1.calls.beforeTransition).toHaveLength(1);
      expect(plugin2.calls.beforeTransition).toHaveLength(1);
      expect(plugin1.calls.afterTransition).toHaveLength(1);
      expect(plugin2.calls.afterTransition).toHaveLength(1);
    });

    it('should handle middleware cancellation', async () => {
      const engine = StageFlowTestEngine.create(config);
      
      const cancellingMiddleware = createMockMiddleware({
        name: 'cancelling-middleware',
        shouldCancel: true
      }) as Middleware<TestStage, TestData>;

      const plugin = createSpyPlugin<TestStage, TestData>('test-plugin');

      engine.addMiddleware(cancellingMiddleware);
      await engine.installPlugin(plugin);

      expect(engine.getCurrentStage()).toBe('init');

      // Expect the transition to be cancelled and throw an error
      await expect(engine.send('start')).rejects.toThrow('Transition cancelled');

      // Should still be in init stage
      expect(engine.getCurrentStage()).toBe('init');

      // Plugin hooks should not have been called for the cancelled transition
      expect(plugin.calls.afterTransition).toHaveLength(0);
    });

    it('should handle middleware modification', async () => {
      const engine = StageFlowTestEngine.create(config);
      
      const modifyingMiddleware = createMockMiddleware({
        name: 'modifying-middleware',
        shouldModify: { to: 'error', data: { step: -1, message: 'Modified by middleware' } }
      }) as Middleware<TestStage, TestData>;

      const plugin = createSpyPlugin<TestStage, TestData>('test-plugin');

      engine.addMiddleware(modifyingMiddleware);
      await engine.installPlugin(plugin);

      expect(engine.getCurrentStage()).toBe('init');

      await engine.send('start'); // This should go to 'processing' but middleware modifies to 'error'

      expect(engine.getCurrentStage()).toBe('error');
      expect(engine.getCurrentData()).toEqual({ step: -1, message: 'Modified by middleware' });
    });

    it.skip('should handle async plugins and middleware', async () => {
      const engine = StageFlowTestEngine.create(config);
      
      const asyncPlugin = createAsyncPlugin<TestStage, TestData>('async-plugin', {
        beforeTransition: 100,
        afterTransition: 50
      });

      const asyncMiddleware = createAsyncMiddleware<TestStage, TestData>('async-middleware', 75);

      await engine.installPlugin(asyncPlugin);
      engine.addMiddleware(asyncMiddleware);

      const startTime = Date.now();
      await engine.send('start');
      const endTime = Date.now();

      // Should take at least the sum of all delays (100 + 75 + 50 = 225ms)
      expect(endTime - startTime).toBeGreaterThanOrEqual(200); // Allow some tolerance

      expect(engine.getCurrentStage()).toBe('processing');
    });

    it('should handle plugin errors gracefully', async () => {
      const engine = StageFlowTestEngine.create(config);
      
      const errorPlugin = createMockPlugin({
        name: 'error-plugin',
        hooks: {
          beforeTransition: vi.fn().mockRejectedValue(new Error('Plugin error'))
        }
      }) as Plugin<TestStage, TestData>;

      const normalPlugin = createSpyPlugin<TestStage, TestData>('normal-plugin');

      await engine.installPlugin(errorPlugin);
      await engine.installPlugin(normalPlugin);

      // Transition should still succeed despite plugin error
      await engine.send('start');

      expect(engine.getCurrentStage()).toBe('processing');
      expect(normalPlugin.calls.beforeTransition).toHaveLength(1);
    });

    it('should handle middleware errors', async () => {
      const engine = StageFlowTestEngine.create(config);
      
      const errorMiddleware = createMockMiddleware({
        name: 'error-middleware',
        throwError: new Error('Middleware error')
      }) as Middleware<TestStage, TestData>;

      engine.addMiddleware(errorMiddleware);

      await expect(engine.send('start')).rejects.toThrow('Middleware error');

      // Should still be in initial stage
      expect(engine.getCurrentStage()).toBe('init');
    });
  });

  describe.skip('Time-based Transitions with Plugins', () => {
    it('should handle timed transitions with plugin hooks', async () => {
      const engine = StageFlowTestEngine.create(config);
      
      const plugin = createSpyPlugin<TestStage, TestData>('timer-plugin');
      await engine.installPlugin(plugin);

      // Start in processing stage which has a 2-second auto-transition
      await engine.send('start');
      expect(engine.getCurrentStage()).toBe('processing');

      // Clear previous calls
      plugin.calls.beforeTransition = [];
      plugin.calls.afterTransition = [];

      // Advance time to trigger auto-transition
      engine.advanceTime(2000);

      expect(engine.getCurrentStage()).toBe('complete');
      expect(plugin.calls.beforeTransition).toHaveLength(1);
      expect(plugin.calls.afterTransition).toHaveLength(1);
    });

    it('should handle multiple timed transitions', async () => {
      const timedConfig: StageFlowConfig<TestStage, TestData> = {
        ...config,
        stages: [
          {
            ...config.stages[0],
            transitions: [
              ...config.stages[0].transitions,
              { target: 'processing', after: 1000 }
            ]
          },
          ...config.stages.slice(1)
        ]
      };

      const engine = StageFlowTestEngine.create(timedConfig);
      const plugin = createSpyPlugin<TestStage, TestData>('multi-timer-plugin');
      await engine.installPlugin(plugin);

      expect(engine.getCurrentStage()).toBe('init');

      // First auto-transition (init -> processing after 1s)
      engine.advanceTime(1000);
      expect(engine.getCurrentStage()).toBe('processing');

      // Second auto-transition (processing -> complete after 2s)
      engine.advanceTime(2000);
      expect(engine.getCurrentStage()).toBe('complete');

      // Should have 2 transitions total
      expect(plugin.calls.beforeTransition).toHaveLength(2);
      expect(plugin.calls.afterTransition).toHaveLength(2);
    });
  });

  describe('Complex Workflow Testing', () => {
    it('should handle a complete workflow with multiple interactions', async () => {
      const engine = StageFlowTestEngine.create(config);
      
      const loggingPlugin = createSpyPlugin<TestStage, TestData>('logging-plugin');
      const validationMiddleware = createMockMiddleware({
        name: 'validation-middleware',
        execute: vi.fn(async (context, next) => {
          // Add validation logic
          if (context.from === 'init' && context.to === 'error') {
            // Don't allow direct transition from init to error
            context.cancel();
            return;
          }
          await next();
        })
      }) as Middleware<TestStage, TestData>;

      await engine.installPlugin(loggingPlugin);
      engine.addMiddleware(validationMiddleware);

      // Test the workflow
      expect(engine.getCurrentStage()).toBe('init');

      // Try to go directly to error (should be blocked by middleware)
      await expect(engine.send('fail')).rejects.toThrow('Transition cancelled');
      expect(engine.getCurrentStage()).toBe('init'); // Should still be in init

      // Normal flow: init -> processing -> complete
      await engine.send('start');
      expect(engine.getCurrentStage()).toBe('processing');

      await engine.send('finish');
      expect(engine.getCurrentStage()).toBe('complete');

      // Reset back to init
      await engine.send('reset');
      expect(engine.getCurrentStage()).toBe('init');

      // Verify plugin was called for all successful transitions
      expect(loggingPlugin.calls.beforeTransition).toHaveLength(3); // start, finish, reset
      expect(loggingPlugin.calls.afterTransition).toHaveLength(3);

      // Verify middleware was called for all attempts (including cancelled one)
      expect(validationMiddleware.execute).toHaveBeenCalledTimes(4); // fail, start, finish, reset
    });

    it('should handle state inspection during complex workflows', async () => {
      const engine = StageFlowTestEngine.create(config);
      
      const stateTrackingPlugin = createMockPlugin({
        name: 'state-tracking-plugin',
        hooks: {
          afterTransition: vi.fn((context) => {
            const state = engine.getState();
            // Plugin can inspect state after each transition
            expect(state.current).toBe(context.to);
            expect(state.history.length).toBeGreaterThan(0);
          })
        }
      }) as Plugin<TestStage, TestData>;

      await engine.installPlugin(stateTrackingPlugin);

      // Execute a series of transitions
      await engine.send('start');
      await engine.send('finish');
      await engine.send('reset');

      // Verify the plugin hook was called for each transition
      expect(stateTrackingPlugin.hooks?.afterTransition).toHaveBeenCalledTimes(3);

      // Verify final state
      const finalState = engine.getState();
      expect(finalState.current).toBe('init');
      expect(finalState.history).toHaveLength(4); // init, processing, complete, init
    });
  });


});