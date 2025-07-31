/**
 * Tests for mock utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createMockPlugin,
  createMockMiddleware,
  createSpyPlugin,
  createSpyMiddleware,
  createAsyncPlugin,
  createAsyncMiddleware,
  createErrorPlugin,
  createErrorMiddleware,
  waitForCalls,
  resetPluginMocks,
  resetMiddlewareMocks
} from '../mocks';
import { StageFlowTestEngine } from '../test-engine';
import { StageFlowConfig } from '@stage-flow/core';

type TestStage = 'start' | 'end';
interface TestData {
  value: number;
}

describe('Mock Utilities', () => {
  let config: StageFlowConfig<TestStage, TestData>;
  let engine: StageFlowTestEngine<TestStage, TestData>;

  beforeEach(() => {
    config = {
      initial: 'start',
      stages: [
        {
          name: 'start',
          transitions: [{ target: 'end', event: 'next' }],
          data: { value: 1 }
        },
        {
          name: 'end',
          transitions: [],
          data: { value: 2 }
        }
      ]
    };
    engine = StageFlowTestEngine.create(config);
  });

  describe('createMockPlugin', () => {
    it('should create a mock plugin with default mocks', () => {
      const plugin = createMockPlugin({
        name: 'test-plugin'
      });

      expect(plugin.name).toBe('test-plugin');
      expect(vi.isMockFunction(plugin.install)).toBe(true);
      expect(vi.isMockFunction(plugin.uninstall)).toBe(true);
      expect(plugin.hooks).toBeDefined();
      expect(vi.isMockFunction(plugin.hooks?.beforeTransition)).toBe(true);
    });

    it('should create a mock plugin with custom hooks', () => {
      const customHook = vi.fn();
      const plugin = createMockPlugin({
        name: 'test-plugin',
        hooks: {
          onStageEnter: customHook
        }
      });

      expect(plugin.hooks?.onStageEnter).toBe(customHook);
      expect(vi.isMockFunction(plugin.hooks?.beforeTransition)).toBe(true);
    });

    it('should create a mock plugin with dependencies', () => {
      const plugin = createMockPlugin({
        name: 'test-plugin',
        dependencies: ['dep1', 'dep2']
      });

      expect(plugin.dependencies).toEqual(['dep1', 'dep2']);
    });

    it('should create a mock plugin with initial state', () => {
      const plugin = createMockPlugin({
        name: 'test-plugin',
        state: { initialized: true }
      });

      expect(plugin.state).toEqual({ initialized: true });
    });
  });

  describe('createMockMiddleware', () => {
    it('should create a mock middleware with default behavior', () => {
      const middleware = createMockMiddleware({
        name: 'test-middleware'
      });

      expect(middleware.name).toBe('test-middleware');
      expect(vi.isMockFunction(middleware.execute)).toBe(true);
    });

    it('should create a middleware that cancels transitions', async () => {
      const middleware = createMockMiddleware({
        name: 'cancel-middleware',
        shouldCancel: true
      });

      const context = {
        from: 'start' as TestStage,
        to: 'end' as TestStage,
        timestamp: Date.now(),
        cancel: vi.fn(),
        modify: vi.fn()
      };

      const next = vi.fn();

      await middleware.execute(context, next);

      expect(context.cancel).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should create a middleware that modifies transitions', async () => {
      const middleware = createMockMiddleware({
        name: 'modify-middleware',
        shouldModify: { to: 'end', data: { value: 99 } }
      });

      const context = {
        from: 'start' as TestStage,
        to: 'start' as TestStage,
        timestamp: Date.now(),
        cancel: vi.fn(),
        modify: vi.fn()
      } as any;

      const next = vi.fn();

      await middleware.execute(context, next);

      expect(context.modify).toHaveBeenCalledWith({ to: 'end', data: { value: 99 } });
      expect(next).toHaveBeenCalled();
    });

    it.skip('should create a middleware with delay', async () => {
      const middleware = createMockMiddleware({
        name: 'delay-middleware',
        delay: 100
      });

      const context = {
        from: 'start' as TestStage,
        to: 'end' as TestStage,
        timestamp: Date.now(),
        cancel: vi.fn(),
        modify: vi.fn()
      };

      const next = vi.fn();
      const startTime = Date.now();

      await middleware.execute(context, next);

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(90); // Allow some tolerance
      expect(next).toHaveBeenCalled();
    });

    it('should create a middleware that throws errors', async () => {
      const error = new Error('Test error');
      const middleware = createMockMiddleware({
        name: 'error-middleware',
        throwError: error
      });

      const context = {
        from: 'start' as TestStage,
        to: 'end' as TestStage,
        timestamp: Date.now(),
        cancel: vi.fn(),
        modify: vi.fn()
      };

      const next = vi.fn();

      await expect(middleware.execute(context, next)).rejects.toThrow('Test error');
    });
  });

  describe('createSpyPlugin', () => {
    it('should create a spy plugin that tracks calls', async () => {
      const plugin = createSpyPlugin<TestStage, TestData>('spy-plugin');

      expect(plugin.name).toBe('spy-plugin');
      expect(plugin.calls).toBeDefined();
      expect(plugin.calls.install).toEqual([]);

      // Install the plugin
      await engine.installPlugin(plugin);

      expect(plugin.calls.install).toHaveLength(1);
      expect(plugin.calls.install[0]).toMatchObject({
        engine: expect.any(Object),
        timestamp: expect.any(Number)
      });
    });

    it('should track hook calls', async () => {
      const plugin = createSpyPlugin<TestStage, TestData>('spy-plugin');
      await engine.installPlugin(plugin);

      // Trigger a transition to test hooks
      await engine.send('next');

      expect(plugin.calls.beforeTransition).toHaveLength(1);
      expect(plugin.calls.afterTransition).toHaveLength(1);
      expect(plugin.calls.onStageExit).toHaveLength(1);
      expect(plugin.calls.onStageEnter).toHaveLength(1);
    });
  });

  describe('createSpyMiddleware', () => {
    it('should create a spy middleware that tracks calls', async () => {
      const middleware = createSpyMiddleware<TestStage, TestData>('spy-middleware');

      expect(middleware.name).toBe('spy-middleware');
      expect(middleware.calls).toEqual([]);

      engine.addMiddleware(middleware);
      await engine.send('next');

      expect(middleware.calls).toHaveLength(1);
      expect(middleware.calls[0]).toMatchObject({
        context: expect.any(Object),
        timestamp: expect.any(Number),
        completed: true
      });
    });

    it('should track errors in middleware calls', async () => {
      const middleware = createSpyMiddleware<TestStage, TestData>('spy-middleware');
      
      // Mock the execute function to throw an error
      (middleware.execute as any).mockImplementation(async () => {
        throw new Error('Test error');
      });

      engine.addMiddleware(middleware);

      await expect(engine.send('next')).rejects.toThrow();

      expect(middleware.calls).toHaveLength(1);
      expect(middleware.calls[0].completed).toBe(false);
      expect(middleware.calls[0].error).toBeInstanceOf(Error);
    });
  });

  describe('createAsyncPlugin', () => {
    it.skip('should create a plugin with async delays', async () => {
      const plugin = createAsyncPlugin<TestStage, TestData>('async-plugin', {
        install: 50,
        onStageEnter: 30
      });

      const startTime = Date.now();
      await engine.installPlugin(plugin);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(40); // Allow some tolerance
      expect(plugin.install).toHaveBeenCalled();
    });
  });

  describe('createAsyncMiddleware', () => {
    it.skip('should create middleware with async delay', async () => {
      const middleware = createAsyncMiddleware<TestStage, TestData>('async-middleware', 50);

      engine.addMiddleware(middleware);

      const startTime = Date.now();
      await engine.send('next');
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(40); // Allow some tolerance
      expect(middleware.execute).toHaveBeenCalled();
    });
  });

  describe('createErrorPlugin', () => {
    it('should create a plugin that throws errors', async () => {
      const error = new Error('Install error');
      const plugin = createErrorPlugin<TestStage, TestData>('error-plugin', {
        install: error
      });

      await expect(engine.installPlugin(plugin)).rejects.toThrow('Install error');
    });

    it('should create a plugin that throws errors in hooks', async () => {
      const error = new Error('Hook error');
      const plugin = createErrorPlugin<TestStage, TestData>('error-plugin', {
        beforeTransition: error
      });

      await engine.installPlugin(plugin);

      // The transition should still succeed, but the hook error should be logged
      await engine.send('next');
      expect(engine.getCurrentStage()).toBe('end');
    });
  });

  describe('createErrorMiddleware', () => {
    it('should create middleware that throws errors', async () => {
      const error = new Error('Middleware error');
      const middleware = createErrorMiddleware<TestStage, TestData>('error-middleware', error);

      engine.addMiddleware(middleware);

      await expect(engine.send('next')).rejects.toThrow('Middleware error');
    });
  });

  describe.skip('waitForCalls', () => {
    it('should wait for expected number of calls', async () => {
      const mockFn = vi.fn();

      // Call the function after a delay
      setTimeout(() => {
        mockFn();
        mockFn();
      }, 50);

      await expect(waitForCalls(mockFn, 2, 200)).resolves.toBeUndefined();
    });

    it('should timeout if expected calls are not reached', async () => {
      const mockFn = vi.fn();

      await expect(waitForCalls(mockFn, 2, 100)).rejects.toThrow('Timeout waiting for 2 calls. Got 0');
    });
  });

  describe('resetPluginMocks', () => {
    it('should reset all mocks in a plugin', () => {
      const plugin = createMockPlugin({
        name: 'test-plugin'
      });

      // Call some methods
      plugin.install?.(engine as any);
      plugin.hooks?.beforeTransition?.({} as any);

      expect(plugin.install).toHaveBeenCalled();
      expect(plugin.hooks?.beforeTransition).toHaveBeenCalled();

      // Reset mocks
      resetPluginMocks(plugin);

      expect(plugin.install).not.toHaveBeenCalled();
      expect(plugin.hooks?.beforeTransition).not.toHaveBeenCalled();
    });
  });

  describe('resetMiddlewareMocks', () => {
    it('should reset all mocks in middleware', async () => {
      const middleware = createMockMiddleware({
        name: 'test-middleware'
      });

      // Call the middleware
      await middleware.execute({} as any, vi.fn());

      expect(middleware.execute).toHaveBeenCalled();

      // Reset mocks
      resetMiddlewareMocks(middleware);

      expect(middleware.execute).not.toHaveBeenCalled();
    });
  });
});