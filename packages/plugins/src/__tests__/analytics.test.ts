/**
 * Tests for the analytics plugin
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsPlugin, type AnalyticsEvent, type AnalyticsEventHandler } from '../analytics';
import type { Plugin, StageContext, StageFlowEngine, TransitionContext } from '@stage-flow/core';

// Type alias for the engine interface that plugins receive
type PluginEngine<TStage extends string, TData = unknown> = Parameters<Plugin<TStage, TData>['install']>[0];

// Mock engine for testing
const createMockEngine = (): PluginEngine<string, any> => ({
  getCurrentStage: vi.fn().mockReturnValue('initial'),
  getCurrentData: vi.fn().mockReturnValue(undefined),
  send: vi.fn(),
  goTo: vi.fn(),
  subscribe: vi.fn(),
  installPlugin: vi.fn(),
  uninstallPlugin: vi.fn(),
  getInstalledPlugins: vi.fn().mockReturnValue(['analytics']),
  getPlugin: vi.fn(),
  getPluginState: vi.fn(),
  setPluginState: vi.fn(),
  addMiddleware: vi.fn(),
  removeMiddleware: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  reset: vi.fn()
});

// Mock localStorage
const createMockLocalStorage = () => {
  const storage = new Map<string, string>();
  return {
    _storage: storage,
    getItem: vi.fn((key: string) => storage.get(key) || null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key)),
    clear: vi.fn(() => storage.clear())
  };
};

const mockLocalStorage = createMockLocalStorage();

// Mock global window object for Node.js compatibility
const globalWindow = globalThis as typeof globalThis & { localStorage: typeof mockLocalStorage };

Object.defineProperty(globalWindow, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('AnalyticsPlugin', () => {
  let plugin: AnalyticsPlugin<string, any>;
  let mockEngine: PluginEngine<string, any>;
  let mockEventHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockEngine = createMockEngine();
    mockEventHandler = vi.fn().mockResolvedValue(undefined);
    plugin = new AnalyticsPlugin({
      eventHandlers: [mockEventHandler as AnalyticsEventHandler<string, any>],
      persistMetrics: false // Disable persistence for cleaner tests
    });

    vi.clearAllMocks();
    mockLocalStorage._storage.clear();
  });

  describe('Plugin Installation', () => {
    it('should install successfully', async () => {
      await plugin.install();

      expect(plugin.name).toBe('analytics');
      expect(plugin.version).toBe('1.0.0');
    });

    it('should uninstall successfully', async () => {
      await plugin.install();
      await plugin.uninstall();

      // Should not throw any errors
      expect(true).toBe(true);
    });

    it('should load persisted metrics on install when enabled', async () => {
      const persistedData = {
        totalTransitions: 5,
        stageDurations: [['stage1', [1000, 2000]]],
        transitionDurations: [['stage1->stage2', [500, 600]]]
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(persistedData));

      plugin = new AnalyticsPlugin({ persistMetrics: true });
      await plugin.install();

      const metrics = plugin.getMetrics();
      expect(metrics.totalTransitions).toBe(5);
      expect(metrics.averageStageDurations.stage1).toBe(1500);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = plugin.getConfig();

      expect(config.trackStageEvents).toBe(true);
      expect(config.trackTransitions).toBe(true);
      expect(config.collectMetrics).toBe(true);
      expect(config.trackStageDurations).toBe(true);
      expect(config.trackTransitionDurations).toBe(true);
      expect(config.batchEvents).toBe(false);
      expect(config.batchSize).toBe(10);
      expect(config.batchTimeout).toBe(5000);
    });

    it('should allow configuration updates', () => {
      plugin.updateConfig({
        trackStageEvents: false,
        batchEvents: true,
        batchSize: 20
      });

      const config = plugin.getConfig();
      expect(config.trackStageEvents).toBe(false);
      expect(config.batchEvents).toBe(true);
      expect(config.batchSize).toBe(20);
      expect(config.trackTransitions).toBe(true); // Should remain unchanged
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await plugin.install();
    });

    it('should add and remove event handlers', () => {
      const newHandler = vi.fn();

      plugin.addEventHandler(newHandler);
      const config = plugin.getConfig();
      expect(config.eventHandlers).toContain(newHandler);

      plugin.removeEventHandler(newHandler);
      const updatedConfig = plugin.getConfig();
      expect(updatedConfig.eventHandlers).not.toContain(newHandler);
    });

    it('should emit custom events', async () => {
      await plugin.emitCustomEvent('performance_metric', {
        stage: 'test-stage',
        metrics: { duration: 1000 }
      });

      expect(mockEventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'performance_metric',
          stage: 'test-stage',
          metrics: { duration: 1000 }
        })
      );
    });

    it('should include global properties in events', async () => {
      plugin.updateConfig({
        globalProperties: { userId: '123', sessionId: 'abc' }
      });

      await plugin.emitCustomEvent('stage_enter', { stage: 'test-stage' });

      expect(mockEventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: {
            userId: '123',
            sessionId: 'abc'
          }
        })
      );
    });
  });

  describe('Stage Event Tracking', () => {
    beforeEach(async () => {
      await plugin.install();
      mockEventHandler.mockClear();
    });

    it('should track stage enter events', async () => {
      const context: StageContext<string, any> = {
        current: 'stage1',
        data: { test: 'data' },
        timestamp: 1234567890,
        send: vi.fn(),
        goTo: vi.fn()
      };

      await plugin.hooks.onStageEnter!(context);

      expect(mockEventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'stage_enter',
          timestamp: 1234567890,
          stage: 'stage1',
          data: { test: 'data' }
        })
      );
    });

    it('should track stage exit events with duration', async () => {
      const enterContext: StageContext<string, any> = {
        current: 'stage1',
        timestamp: Date.now(),
        send: vi.fn(),
        goTo: vi.fn()
      };

      // Enter stage
      await plugin.hooks.onStageEnter!(enterContext);

      // Wait a bit and exit stage
      await new Promise(resolve => setTimeout(resolve, 10));

      const exitContext: StageContext<string, any> = {
        current: 'stage1',
        timestamp: Date.now(),
        send: vi.fn(),
        goTo: vi.fn()
      };

      await plugin.hooks.onStageExit!(exitContext);

      expect(mockEventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'stage_exit',
          stage: 'stage1',
          metrics: expect.objectContaining({
            stageDuration: expect.any(Number)
          })
        })
      );
    });

    it('should not track stage events when disabled', async () => {
      plugin.updateConfig({ trackStageEvents: false });

      const context: StageContext<string, any> = {
        current: 'stage1',
        timestamp: Date.now(),
        send: vi.fn(),
        goTo: vi.fn()
      };

      await plugin.hooks.onStageEnter!(context);

      expect(mockEventHandler).not.toHaveBeenCalled();
    });
  });

  describe('Transition Tracking', () => {
    beforeEach(async () => {
      await plugin.install();
      mockEventHandler.mockClear();
    });

    it('should track transition start events', async () => {
      const context: TransitionContext<string, any> = {
        from: 'stage1',
        to: 'stage2',
        event: 'next',
        data: { test: 'data' },
        timestamp: 1234567890,
        cancel: vi.fn(),
        modify: vi.fn()
      };

      await plugin.hooks.beforeTransition!(context);

      expect(mockEventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'transition_start',
          timestamp: 1234567890,
          fromStage: 'stage1',
          toStage: 'stage2',
          event: 'next',
          data: { test: 'data' }
        })
      );
    });

    it('should track transition complete events with duration', async () => {
      const context: TransitionContext<string, any> = {
        from: 'stage1',
        to: 'stage2',
        timestamp: Date.now(),
        cancel: vi.fn(),
        modify: vi.fn()
      };

      // Start transition
      await plugin.hooks.beforeTransition!(context);

      // Wait a bit and complete transition
      await new Promise(resolve => setTimeout(resolve, 10));
      await plugin.hooks.afterTransition!(context);

      expect(mockEventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'transition_complete',
          fromStage: 'stage1',
          toStage: 'stage2',
          metrics: expect.objectContaining({
            transitionTime: expect.any(Number),
            duration: expect.any(Number)
          })
        })
      );
    });

    it('should not track transitions when disabled', async () => {
      plugin.updateConfig({ trackTransitions: false });

      const context: TransitionContext<string, any> = {
        from: 'stage1',
        to: 'stage2',
        timestamp: Date.now(),
        cancel: vi.fn(),
        modify: vi.fn()
      };

      await plugin.hooks.beforeTransition!(context);

      expect(mockEventHandler).not.toHaveBeenCalled();
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(async () => {
      await plugin.install();
    });

    it('should collect stage duration metrics', async () => {
      const enterContext: StageContext<string, any> = {
        current: 'stage1',
        timestamp: Date.now(),
        send: vi.fn(),
        goTo: vi.fn()
      };

      const exitContext: StageContext<string, any> = {
        current: 'stage1',
        timestamp: Date.now() + 100,
        send: vi.fn(),
        goTo: vi.fn()
      };

      // Simulate stage enter and exit
      await plugin.hooks.onStageEnter!(enterContext);
      await new Promise(resolve => setTimeout(resolve, 10));
      await plugin.hooks.onStageExit!(exitContext);

      const metrics = plugin.getMetrics();
      expect(metrics.stageDurationStats.stage1).toBeDefined();
      expect(metrics.stageDurationStats.stage1.count).toBe(1);
      expect(metrics.stageDurationStats.stage1.avg).toBeGreaterThan(0);
    });

    it('should collect transition duration metrics', async () => {
      const context: TransitionContext<string, any> = {
        from: 'stage1',
        to: 'stage2',
        timestamp: Date.now(),
        cancel: vi.fn(),
        modify: vi.fn()
      };

      // Simulate transition
      await plugin.hooks.beforeTransition!(context);
      await new Promise(resolve => setTimeout(resolve, 10));
      await plugin.hooks.afterTransition!(context);

      const metrics = plugin.getMetrics();
      expect(metrics.totalTransitions).toBe(1);
      expect(metrics.transitionDurationStats['stage1->stage2']).toBeDefined();
      expect(metrics.transitionDurationStats['stage1->stage2'].count).toBe(1);
    });

    it('should calculate average durations correctly', async () => {
      // Simulate multiple stage visits
      for (let i = 0; i < 3; i++) {
        const enterContext: StageContext<string, any> = {
          current: 'stage1',
          timestamp: Date.now(),
          send: vi.fn(),
          goTo: vi.fn()
        };

        await plugin.hooks.onStageEnter!(enterContext);
        await new Promise(resolve => setTimeout(resolve, 10 + i * 5));

        const exitContext: StageContext<string, any> = {
          current: 'stage1',
          timestamp: Date.now(),
          send: vi.fn(),
          goTo: vi.fn()
        };

        await plugin.hooks.onStageExit!(exitContext);
      }

      const metrics = plugin.getMetrics();
      expect(metrics.stageDurationStats.stage1.count).toBe(3);
      expect(metrics.averageStageDurations.stage1).toBeGreaterThan(0);
    });

    it('should reset metrics', () => {
      // Add some metrics first
      const context: TransitionContext<string, any> = {
        from: 'stage1',
        to: 'stage2',
        timestamp: Date.now(),
        cancel: vi.fn(),
        modify: vi.fn()
      };

      plugin.hooks.afterTransition!(context);

      let metrics = plugin.getMetrics();
      expect(metrics.totalTransitions).toBe(1);

      // Reset metrics
      plugin.resetMetrics();

      metrics = plugin.getMetrics();
      expect(metrics.totalTransitions).toBe(0);
      expect(Object.keys(metrics.stageDurationStats)).toHaveLength(0);
      expect(Object.keys(metrics.transitionDurationStats)).toHaveLength(0);
    });
  });

  describe('Event Batching', () => {
    beforeEach(async () => {
      plugin = new AnalyticsPlugin({
        eventHandlers: [mockEventHandler as AnalyticsEventHandler<string, any>],
        batchEvents: true,
        batchSize: 3,
        batchTimeout: 100
      });
      await plugin.install();
    });

    it('should batch events until batch size is reached', async () => {
      // Emit 2 events (below batch size)
      await plugin.emitCustomEvent('stage_enter', { stage: 'stage1' });
      await plugin.emitCustomEvent('stage_enter', { stage: 'stage2' });

      // Should not have called handler yet
      expect(mockEventHandler).not.toHaveBeenCalled();

      // Emit 3rd event (reaches batch size)
      await plugin.emitCustomEvent('stage_enter', { stage: 'stage3' });

      // Should have called handler 3 times (once for each batched event)
      expect(mockEventHandler).toHaveBeenCalledTimes(3);
    });

    it('should flush events on timeout', async () => {
      // Emit 1 event (below batch size)
      await plugin.emitCustomEvent('stage_enter', { stage: 'stage1' });

      // Should not have called handler yet
      expect(mockEventHandler).not.toHaveBeenCalled();

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should have called handler once
      expect(mockEventHandler).toHaveBeenCalledTimes(1);
    });

    it('should flush events on uninstall', async () => {
      // Emit events without reaching batch size
      await plugin.emitCustomEvent('stage_enter', { stage: 'stage1' });
      await plugin.emitCustomEvent('stage_enter', { stage: 'stage2' });

      expect(mockEventHandler).not.toHaveBeenCalled();

      // Uninstall should flush pending events
      await plugin.uninstall();

      expect(mockEventHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('Metrics Persistence', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockLocalStorage._storage.clear();
      plugin = new AnalyticsPlugin({
        persistMetrics: true,
        metricsStorageKey: 'test-analytics-metrics'
      });
    });

    it('should persist metrics on uninstall', async () => {
      await plugin.install();

      // Reset metrics to ensure we start fresh
      plugin.resetMetrics();

      // Generate some metrics
      const context: TransitionContext<string, any> = {
        from: 'stage1',
        to: 'stage2',
        timestamp: Date.now(),
        cancel: vi.fn(),
        modify: vi.fn()
      };

      await plugin.hooks.afterTransition!(context);

      // Clear the setItem mock to only capture the uninstall call
      mockLocalStorage.setItem.mockClear();

      // Uninstall should persist metrics
      await plugin.uninstall();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'test-analytics-metrics',
        expect.stringContaining('"totalTransitions":1')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle event handler errors gracefully', async () => {
      const errorHandler = vi.fn().mockRejectedValue(new Error('Handler error'));
      plugin.addEventHandler(errorHandler);

      await plugin.install();

      // Should not throw error
      await expect(plugin.emitCustomEvent('stage_enter', { stage: 'test' })).resolves.not.toThrow();

      expect(errorHandler).toHaveBeenCalled();
    });

    it('should handle synchronous event handler errors', async () => {
      const errorHandler = vi.fn().mockImplementation(() => {
        throw new Error('Sync handler error');
      });
      plugin.addEventHandler(errorHandler);

      await plugin.install();

      // Should not throw error
      await expect(plugin.emitCustomEvent('stage_enter', { stage: 'test' })).resolves.not.toThrow();

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Static Factory Methods', () => {
    it('should create default plugin', () => {
      const defaultPlugin = AnalyticsPlugin.create();
      const config = defaultPlugin.getConfig();

      expect(config.trackStageEvents).toBe(true);
      expect(defaultPlugin.name).toBe('analytics');
    });

    it('should create plugin with custom handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const plugin = AnalyticsPlugin.createWithHandlers([handler1, handler2]);
      const config = plugin.getConfig();

      expect(config.eventHandlers).toContain(handler1);
      expect(config.eventHandlers).toContain(handler2);
    });

    it('should create performance-only plugin', () => {
      const plugin = AnalyticsPlugin.createForPerformance();
      const config = plugin.getConfig();

      expect(config.trackStageEvents).toBe(false);
      expect(config.trackTransitions).toBe(false);
      expect(config.collectMetrics).toBe(true);
      expect(config.trackStageDurations).toBe(true);
      expect(config.trackTransitionDurations).toBe(true);
    });

    it('should create plugin with batching', () => {
      const plugin = AnalyticsPlugin.createWithBatching(5, 1000);
      const config = plugin.getConfig();

      expect(config.batchEvents).toBe(true);
      expect(config.batchSize).toBe(5);
      expect(config.batchTimeout).toBe(1000);
    });
  });
});