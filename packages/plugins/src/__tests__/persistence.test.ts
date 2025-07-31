/**
 * Tests for the persistence plugin
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PersistencePlugin, type CustomStorage, type SerializedState } from '../persistence';
import type { Plugin, TransitionContext } from '@stage-flow/core';

// Type alias for the engine interface that plugins receive
type PluginEngine<TStage extends string, TData = unknown> = Parameters<Plugin<TStage, TData>['install']>[0];

// Define Storage interface for Node.js compatibility
interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  key(index: number): string | null;
  readonly length: number;
}

// Mock engine for testing
const createMockEngine = (): PluginEngine<string, any> => ({
  getCurrentStage: vi.fn(),
  getCurrentData: vi.fn(),
  send: vi.fn(),
  goTo: vi.fn(),
  subscribe: vi.fn(),
  installPlugin: vi.fn(),
  uninstallPlugin: vi.fn(),
  getInstalledPlugins: vi.fn().mockReturnValue(['persistence']),
  getPlugin: vi.fn(),
  getPluginState: vi.fn(),
  setPluginState: vi.fn(),
  addMiddleware: vi.fn(),
  removeMiddleware: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  reset: vi.fn()
});

// Mock storage for testing
const createMockStorage = (): Storage & { _storage: Map<string, string> } => {
  const storage = new Map<string, string>();
  return {
    _storage: storage,
    getItem: vi.fn((key: string) => storage.get(key) || null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
    key: vi.fn(),
    length: 0
  };
};

// Mock custom storage for testing
const createMockCustomStorage = (): CustomStorage & { _storage: Map<string, string> } => {
  const storage = new Map<string, string>();
  return {
    _storage: storage,
    getItem: vi.fn((key: string) => storage.get(key) || null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key))
  };
};

// Mock window.localStorage and window.sessionStorage
const mockLocalStorage = createMockStorage();
const mockSessionStorage = createMockStorage();

// Mock global window object for Node.js compatibility
const globalWindow = globalThis as typeof globalThis & { 
  localStorage: Storage; 
  sessionStorage: Storage; 
};

Object.defineProperty(globalWindow, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

Object.defineProperty(globalWindow, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

describe('PersistencePlugin', () => {
  let plugin: PersistencePlugin<string, any>;
  let mockEngine: PluginEngine<string, any>;

  beforeEach(() => {
    mockEngine = createMockEngine();
    
    // Set default return values
    (mockEngine.getCurrentStage as ReturnType<typeof vi.fn>).mockReturnValue('initial');
    (mockEngine.getCurrentData as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
    
    plugin = new PersistencePlugin({
      autoRestore: false // Disable auto-restore for cleaner tests
    });

    // Clear all storage mocks
    vi.clearAllMocks();
    mockLocalStorage._storage.clear();
    mockSessionStorage._storage.clear();
  });

  describe('Plugin Installation', () => {
    it('should install successfully with localStorage', async () => {
      plugin = new PersistencePlugin({ storage: 'localStorage' });
      await plugin.install(mockEngine);

      expect(plugin.name).toBe('persistence');
      expect(plugin.version).toBe('1.0.0');
    });

    it('should install successfully with sessionStorage', async () => {
      plugin = new PersistencePlugin({ storage: 'sessionStorage' });
      await plugin.install(mockEngine);

      expect(plugin.name).toBe('persistence');
    });

    it('should install successfully with custom storage', async () => {
      const customStorage = createMockCustomStorage();
      plugin = new PersistencePlugin({
        storage: 'custom',
        customStorage
      });

      await plugin.install(mockEngine);

      expect(plugin.name).toBe('persistence');
    });

    it('should handle storage initialization errors gracefully', async () => {
      const onError = vi.fn();
      plugin = new PersistencePlugin({
        storage: 'custom', // No customStorage provided
        onError
      });

      await plugin.install(mockEngine);

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        'load'
      );
    });

    it('should uninstall successfully', async () => {
      await plugin.install(mockEngine);
      await plugin.uninstall();

      // Should not throw any errors
      expect(true).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = plugin.getConfig();

      expect(config.storage).toBe('localStorage');
      expect(config.key).toBe('stage-flow-state');
      expect(config.ttl).toBe(0);
      expect(config.autoRestore).toBe(false); // We set this in beforeEach
      expect(config.autoPersist).toBe(true);
      expect(config.clearExpired).toBe(true);
    });

    it('should allow configuration updates', () => {
      plugin.updateConfig({
        key: 'custom-key',
        ttl: 3600000 // 1 hour
      });

      const config = plugin.getConfig();
      expect(config.key).toBe('custom-key');
      expect(config.ttl).toBe(3600000);
      expect(config.storage).toBe('localStorage'); // Should remain unchanged
    });
  });

  describe('State Persistence', () => {
    beforeEach(async () => {
      await plugin.install(mockEngine);
    });

    it('should save state manually', async () => {
      (mockEngine.getCurrentStage as ReturnType<typeof vi.fn>).mockReturnValue('stage1');
      (mockEngine.getCurrentData as ReturnType<typeof vi.fn>).mockReturnValue({ test: 'data' });

      await plugin.saveState();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'stage-flow-state',
        expect.stringContaining('"stage":"stage1"')
      );
    });

    it('should save state with custom stage and data', async () => {
      await plugin.saveState('custom-stage', { custom: 'data' });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'stage-flow-state',
        expect.stringContaining('"stage":"custom-stage"')
      );
    });

    it('should restore state successfully', async () => {
      const state: SerializedState<string, any> = {
        stage: 'restored-stage',
        data: { restored: 'data' },
        timestamp: Date.now()
      };

      (mockLocalStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(state));

      const result = await plugin.restoreState();

      expect(result).toBe(true);
      expect(mockEngine.goTo).toHaveBeenCalledWith('restored-stage', { restored: 'data' });
    });

    it('should return false when no state exists', async () => {
      (mockLocalStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

      const result = await plugin.restoreState();

      expect(result).toBe(false);
      expect(mockEngine.goTo).not.toHaveBeenCalled();
    });

    it('should clear state', async () => {
      await plugin.clearState();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('stage-flow-state');
    });

    it('should check if persisted state exists', async () => {
      // No state exists
      (mockLocalStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
      expect(plugin.hasPersistedState()).toBe(false);

      // State exists
      const state: SerializedState<string, any> = {
        stage: 'test-stage',
        timestamp: Date.now()
      };
      (mockLocalStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(state));
      expect(plugin.hasPersistedState()).toBe(true);
    });

    it('should get persisted state without restoring', async () => {
      const state: SerializedState<string, any> = {
        stage: 'test-stage',
        data: { test: 'data' },
        timestamp: Date.now()
      };

      (mockLocalStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(state));

      const result = plugin.getPersistedState();

      expect(result).toEqual(state);
      expect(mockEngine.goTo).not.toHaveBeenCalled();
    });
  });

  describe('Auto-persistence', () => {
    beforeEach(async () => {
      plugin = new PersistencePlugin({ autoPersist: true });
      await plugin.install(mockEngine);
    });

    it('should auto-persist on transition', async () => {
      const context: TransitionContext<string, any> = {
        from: 'stage1',
        to: 'stage2',
        data: { test: 'data' },
        timestamp: Date.now(),
        cancel: vi.fn(),
        modify: vi.fn()
      };

      await plugin.hooks.afterTransition!(context);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'stage-flow-state',
        expect.stringContaining('"stage":"stage2"')
      );
    });

    it('should not auto-persist when disabled', async () => {
      plugin.updateConfig({ autoPersist: false });

      const context: TransitionContext<string, any> = {
        from: 'stage1',
        to: 'stage2',
        timestamp: Date.now(),
        cancel: vi.fn(),
        modify: vi.fn()
      };

      await plugin.hooks.afterTransition!(context);

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('TTL (Time-to-Live)', () => {
    beforeEach(async () => {
      plugin = new PersistencePlugin({ ttl: 1000 }); // 1 second TTL
      await plugin.install(mockEngine);
    });

    it('should restore non-expired state', async () => {
      const state: SerializedState<string, any> = {
        stage: 'test-stage',
        timestamp: Date.now() - 500 // 500ms ago (not expired)
      };

      (mockLocalStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(state));

      const result = await plugin.restoreState();

      expect(result).toBe(true);
      expect(mockEngine.goTo).toHaveBeenCalledWith('test-stage', undefined);
    });

    it('should not restore expired state', async () => {
      // Clear the mock from beforeEach and create a fresh one
      vi.clearAllMocks();

      const state: SerializedState<string, any> = {
        stage: 'test-stage',
        timestamp: Date.now() - 2000 // 2 seconds ago (expired)
      };

      (mockLocalStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(state));

      const result = await plugin.restoreState();

      expect(result).toBe(false);
      expect(mockEngine.goTo).not.toHaveBeenCalled();
    });

    it('should clear expired state when clearExpired is enabled', async () => {
      plugin.updateConfig({ clearExpired: true });

      const state: SerializedState<string, any> = {
        stage: 'test-stage',
        timestamp: Date.now() - 2000 // Expired
      };

      (mockLocalStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(state));

      await plugin.restoreState();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('stage-flow-state');
    });

    it('should not clear expired state when clearExpired is disabled', async () => {
      plugin.updateConfig({ clearExpired: false });

      // Clear the mock from beforeEach and create a fresh one
      vi.clearAllMocks();

      const state: SerializedState<string, any> = {
        stage: 'test-stage',
        timestamp: Date.now() - 2000 // Expired
      };

      (mockLocalStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(state));

      await plugin.restoreState();

      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('Version Compatibility', () => {
    beforeEach(async () => {
      plugin = new PersistencePlugin({ version: '2.0.0' });
      await plugin.install(mockEngine);
    });

    it('should restore state with matching version', async () => {
      const state: SerializedState<string, any> = {
        stage: 'test-stage',
        timestamp: Date.now(),
        version: '2.0.0'
      };

      (mockLocalStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(state));

      const result = await plugin.restoreState();

      expect(result).toBe(true);
      expect(mockEngine.goTo).toHaveBeenCalled();
    });

    it('should not restore state with mismatched version', async () => {
      // Clear the mock from beforeEach and create a fresh one
      vi.clearAllMocks();

      const state: SerializedState<string, any> = {
        stage: 'test-stage',
        timestamp: Date.now(),
        version: '1.0.0' // Different version
      };

      (mockLocalStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(state));

      const result = await plugin.restoreState();

      expect(result).toBe(false);
      expect(mockEngine.goTo).not.toHaveBeenCalled();
    });

    it('should restore state when no version is specified in config', async () => {
      plugin = new PersistencePlugin(); // No version specified
      await plugin.install(mockEngine);

      const state: SerializedState<string, any> = {
        stage: 'test-stage',
        timestamp: Date.now(),
        version: '1.0.0'
      };

      (mockLocalStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(state));

      const result = await plugin.restoreState();

      expect(result).toBe(true);
      expect(mockEngine.goTo).toHaveBeenCalled();
    });
  });

  describe('Custom Serialization', () => {
    beforeEach(async () => {
      const customSerializer = {
        serialize: vi.fn((state: SerializedState<string, any>) => `custom:${JSON.stringify(state)}`),
        deserialize: vi.fn((serialized: string) => JSON.parse(serialized.replace('custom:', '')))
      };

      plugin = new PersistencePlugin({ serializer: customSerializer });
      await plugin.install(mockEngine);
    });

    it('should use custom serializer for saving', async () => {
      (mockEngine.getCurrentStage as ReturnType<typeof vi.fn>).mockReturnValue('test-stage');

      await plugin.saveState();

      const config = plugin.getConfig();
      expect(config.serializer!.serialize).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'stage-flow-state',
        expect.stringContaining('custom:')
      );
    });

    it('should use custom serializer for loading', async () => {
      const state: SerializedState<string, any> = {
        stage: 'test-stage',
        timestamp: Date.now()
      };

      (mockLocalStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(`custom:${JSON.stringify(state)}`);

      await plugin.restoreState();

      const config = plugin.getConfig();
      expect(config.serializer!.deserialize).toHaveBeenCalled();
      expect(mockEngine.goTo).toHaveBeenCalledWith('test-stage', undefined);
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors', async () => {
      const onError = vi.fn();
      plugin = new PersistencePlugin({ onError });
      await plugin.install(mockEngine);

      // Mock storage error
      (mockLocalStorage.setItem as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      await plugin.saveState();

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        'save'
      );
    });

    it('should handle load errors', async () => {
      const onError = vi.fn();
      plugin = new PersistencePlugin({ onError });
      await plugin.install(mockEngine);

      // Mock invalid JSON
      (mockLocalStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('invalid-json');

      const result = await plugin.restoreState();

      expect(result).toBe(false);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        'load'
      );
    });

    it('should handle clear errors', async () => {
      const onError = vi.fn();
      plugin = new PersistencePlugin({ onError });
      await plugin.install(mockEngine);

      // Mock storage error
      (mockLocalStorage.removeItem as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Storage error');
      });

      await plugin.clearState();

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        'clear'
      );
    });
  });

  describe('Static Factory Methods', () => {
    it('should create default plugin', () => {
      const defaultPlugin = PersistencePlugin.create();
      const config = defaultPlugin.getConfig();

      expect(config.storage).toBe('localStorage');
      expect(defaultPlugin.name).toBe('persistence');
    });

    it('should create localStorage plugin', () => {
      const plugin = PersistencePlugin.createForLocalStorage('custom-key');
      const config = plugin.getConfig();

      expect(config.storage).toBe('localStorage');
      expect(config.key).toBe('custom-key');
    });

    it('should create sessionStorage plugin', () => {
      const plugin = PersistencePlugin.createForSessionStorage('session-key');
      const config = plugin.getConfig();

      expect(config.storage).toBe('sessionStorage');
      expect(config.key).toBe('session-key');
    });

    it('should create custom storage plugin', () => {
      const customStorage = createMockCustomStorage();
      const plugin = PersistencePlugin.createWithCustomStorage(customStorage, 'custom-key');
      const config = plugin.getConfig();

      expect(config.storage).toBe('custom');
      expect(config.customStorage).toBe(customStorage);
      expect(config.key).toBe('custom-key');
    });

    it('should create plugin with TTL', () => {
      const plugin = PersistencePlugin.createWithTTL(5000);
      const config = plugin.getConfig();

      expect(config.ttl).toBe(5000);
    });
  });
});