/**
 * Tests for the logging plugin
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoggingPlugin, LogLevel } from '../logging';
import type { Plugin, StageContext, TransitionContext } from '@stage-flow/core';

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
  getInstalledPlugins: vi.fn().mockReturnValue(['logging']),
  getPlugin: vi.fn(),
  getPluginState: vi.fn(),
  setPluginState: vi.fn(),
  addMiddleware: vi.fn(),
  removeMiddleware: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  reset: vi.fn()
});

// Mock logger for testing
const createMockLogger = () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
});

describe('LoggingPlugin', () => {
  let plugin: LoggingPlugin<string, any>;
  let mockEngine: PluginEngine<string, any>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockEngine = createMockEngine();
    mockLogger = createMockLogger();
    plugin = new LoggingPlugin({
      logger: mockLogger,
      developmentMode: false // Disable dev mode for cleaner tests
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Plugin Installation', () => {
    it('should install successfully', async () => {
      await plugin.install(mockEngine);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Logging plugin installed'),
        expect.objectContaining({
          config: expect.any(Object),
          currentStage: 'initial'
        })
      );
    });

    it('should uninstall successfully', async () => {
      await plugin.install(mockEngine);
      await plugin.uninstall();
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Logging plugin uninstalled')
      );
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = plugin.getConfig();
      
      expect(config.level).toBe(LogLevel.INFO);
      expect(config.includeTimestamp).toBe(true);
      expect(config.includeContext).toBe(true);
      expect(config.logTransitions).toBe(true);
      expect(config.logStageEvents).toBe(true);
      expect(config.prefix).toBe('[StageFlow]');
    });

    it('should allow configuration updates', () => {
      plugin.updateConfig({
        level: LogLevel.DEBUG,
        includeTimestamp: false
      });
      
      const config = plugin.getConfig();
      expect(config.level).toBe(LogLevel.DEBUG);
      expect(config.includeTimestamp).toBe(false);
      expect(config.includeContext).toBe(true); // Should remain unchanged
    });
  });

  describe('Log Levels', () => {
    it('should respect log level filtering', async () => {
      plugin.updateConfig({ level: LogLevel.WARN });
      await plugin.install(mockEngine);
      
      // Clear previous calls
      mockLogger.info.mockClear();
      
      // Simulate a transition (INFO level)
      const transitionContext: TransitionContext<string, any> = {
        from: 'stage1',
        to: 'stage2',
        timestamp: Date.now(),
        cancel: vi.fn(),
        modify: vi.fn()
      };
      
      await plugin.hooks.beforeTransition!(transitionContext);
      
      // Should not log INFO level messages when level is WARN
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should log messages at or above the configured level', async () => {
      plugin.updateConfig({ level: LogLevel.INFO });
      await plugin.install(mockEngine);
      
      mockLogger.info.mockClear();
      
      const transitionContext: TransitionContext<string, any> = {
        from: 'stage1',
        to: 'stage2',
        timestamp: Date.now(),
        cancel: vi.fn(),
        modify: vi.fn()
      };
      
      await plugin.hooks.beforeTransition!(transitionContext);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Transition starting'),
        expect.objectContaining({
          from: 'stage1',
          to: 'stage2'
        })
      );
    });
  });

  describe('Transition Logging', () => {
    beforeEach(async () => {
      await plugin.install(mockEngine);
      mockLogger.info.mockClear();
    });

    it('should log transition start', async () => {
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
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Transition starting'),
        expect.objectContaining({
          from: 'stage1',
          to: 'stage2',
          event: 'next',
          timestamp: 1234567890,
          data: { test: 'data' }
        })
      );
    });

    it('should log transition completion with duration', async () => {
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
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Transition completed'),
        expect.objectContaining({
          from: 'stage1',
          to: 'stage2',
          duration: expect.stringMatching(/\d+ms/)
        })
      );
    });

    it('should not log transitions when disabled', async () => {
      plugin.updateConfig({ logTransitions: false });
      
      const context: TransitionContext<string, any> = {
        from: 'stage1',
        to: 'stage2',
        timestamp: Date.now(),
        cancel: vi.fn(),
        modify: vi.fn()
      };
      
      await plugin.hooks.beforeTransition!(context);
      
      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });

  describe('Stage Event Logging', () => {
    beforeEach(async () => {
      await plugin.install(mockEngine);
      mockLogger.info.mockClear();
    });

    it('should log stage enter events', async () => {
      const context: StageContext<string, any> = {
        current: 'stage1',
        data: { test: 'data' },
        timestamp: 1234567890,
        send: vi.fn(),
        goTo: vi.fn()
      };
      
      await plugin.hooks.onStageEnter!(context);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Stage entered'),
        expect.objectContaining({
          stage: 'stage1',
          timestamp: 1234567890,
          data: { test: 'data' }
        })
      );
    });

    it('should log stage exit events', async () => {
      const context: StageContext<string, any> = {
        current: 'stage1',
        timestamp: Date.now(),
        send: vi.fn(),
        goTo: vi.fn()
      };
      
      await plugin.hooks.onStageExit!(context);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Stage exited'),
        expect.objectContaining({
          stage: 'stage1'
        })
      );
    });

    it('should not log stage events when disabled', async () => {
      plugin.updateConfig({ logStageEvents: false });
      
      const context: StageContext<string, any> = {
        current: 'stage1',
        timestamp: Date.now(),
        send: vi.fn(),
        goTo: vi.fn()
      };
      
      await plugin.hooks.onStageEnter!(context);
      
      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });

  describe('Context Inclusion', () => {
    beforeEach(async () => {
      await plugin.install(mockEngine);
      mockLogger.info.mockClear();
    });

    it('should include context when enabled', async () => {
      plugin.updateConfig({ includeContext: true });
      
      const context: StageContext<string, any> = {
        current: 'stage1',
        data: { important: 'data' },
        timestamp: Date.now(),
        send: vi.fn(),
        goTo: vi.fn()
      };
      
      await plugin.hooks.onStageEnter!(context);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          data: { important: 'data' }
        })
      );
    });

    it('should exclude context when disabled', async () => {
      plugin.updateConfig({ includeContext: false });
      
      const context: StageContext<string, any> = {
        current: 'stage1',
        data: { secret: 'data' },
        timestamp: Date.now(),
        send: vi.fn(),
        goTo: vi.fn()
      };
      
      await plugin.hooks.onStageEnter!(context);
      
      // When includeContext is false, only the message string is passed, no context object
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Stage entered')
      );
      expect(mockLogger.info).toHaveBeenCalledTimes(1);
      // Should only have one argument (the message string) when includeContext is false
      const callArgs = mockLogger.info.mock.calls[0];
      expect(callArgs).toHaveLength(1);
    });
  });

  describe('Static Factory Methods', () => {
    it('should create default plugin', () => {
      const defaultPlugin = LoggingPlugin.create();
      const config = defaultPlugin.getConfig();
      
      expect(config.level).toBe(LogLevel.INFO);
      expect(defaultPlugin.name).toBe('logging');
    });

    it('should create development plugin', () => {
      const devPlugin = LoggingPlugin.createForDevelopment();
      const config = devPlugin.getConfig();
      
      expect(config.level).toBe(LogLevel.DEBUG);
      expect(config.developmentMode).toBe(true);
      expect(config.includeContext).toBe(true);
    });

    it('should create production plugin', () => {
      const prodPlugin = LoggingPlugin.createForProduction();
      const config = prodPlugin.getConfig();
      
      expect(config.level).toBe(LogLevel.WARN);
      expect(config.developmentMode).toBe(false);
      expect(config.includeContext).toBe(false);
      expect(config.logTransitions).toBe(false);
      expect(config.logStageEvents).toBe(false);
    });
  });

  describe('Timestamp Formatting', () => {
    it('should include timestamps when enabled', async () => {
      plugin.updateConfig({ includeTimestamp: true });
      await plugin.install(mockEngine);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z.*Logging plugin installed/),
        expect.any(Object)
      );
    });

    it('should exclude timestamps when disabled', async () => {
      plugin.updateConfig({ includeTimestamp: false });
      await plugin.install(mockEngine);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(/^\[StageFlow\] Logging plugin installed$/),
        expect.any(Object)
      );
    });
  });
});