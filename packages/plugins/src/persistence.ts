/**
 * Persistence plugin for stage flow library
 * Provides state persistence with localStorage/sessionStorage support
 */

import type { Plugin, TransitionContext } from '@stage-flow/core';

// Type alias for the engine parameter that plugins receive
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

/**
 * Storage types supported by the persistence plugin
 */
export type StorageType = 'localStorage' | 'sessionStorage' | 'custom';

/**
 * Serialized state structure
 */
export interface SerializedState<TStage extends string, TData = unknown> {
  stage: TStage;
  data?: TData;
  timestamp: number;
  version?: string;
}

/**
 * Custom storage interface for implementing custom storage backends
 */
export interface CustomStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Configuration options for the persistence plugin
 */
export interface PersistencePluginConfig<TStage extends string, TData = unknown> {
  /** Storage type to use */
  storage: StorageType;
  /** Storage key for persisting state */
  key: string;
  /** Custom storage implementation (required when storage is 'custom') */
  customStorage?: CustomStorage;
  /** Custom serializer for state */
  serializer?: {
    serialize: (state: SerializedState<TStage, TData>) => string;
    deserialize: (serialized: string) => SerializedState<TStage, TData>;
  };
  /** Time-to-live in milliseconds (0 means no expiration) */
  ttl: number;
  /** Whether to restore state on plugin installation */
  autoRestore: boolean;
  /** Whether to automatically persist state on transitions */
  autoPersist: boolean;
  /** Version string for state compatibility checking */
  version?: string;
  /** Callback for handling storage errors */
  onError?: (error: Error, operation: 'save' | 'load' | 'clear') => void;
  /** Whether to clear expired state automatically */
  clearExpired: boolean;
}

/**
 * Default configuration for the persistence plugin
 */
const DEFAULT_CONFIG: PersistencePluginConfig<string, unknown> = {
  storage: 'localStorage',
  key: 'stage-flow-state',
  ttl: 0, // No expiration by default
  autoRestore: true,
  autoPersist: true,
  clearExpired: true
};

/**
 * Persistence plugin implementation
 */
export class PersistencePlugin<TStage extends string, TData = unknown> implements Plugin<TStage, TData> {
  public readonly name = 'persistence';
  public readonly version = '1.0.0';

  private config: PersistencePluginConfig<TStage, TData>;
  private engine?: PluginEngine<TStage, TData>;
  private storage?: Storage | CustomStorage;

  constructor(config: Partial<PersistencePluginConfig<TStage, TData>> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as PersistencePluginConfig<TStage, TData>;
  }

  /**
   * Install the plugin
   */
  public async install(engine: PluginEngine<TStage, TData>): Promise<void> {
    this.engine = engine;

    // Initialize storage
    try {
      this.storage = this.initializeStorage();
    } catch (error) {
      this.handleError(error as Error, 'load');
      return; // Don't proceed if storage initialization fails
    }

    // Auto-restore state if enabled
    if (this.config.autoRestore) {
      await this.restoreState();
    }
  }

  /**
   * Uninstall the plugin
   */
  public async uninstall(): Promise<void> {
    this.engine = undefined;
    this.storage = undefined;
  }

  /**
   * Plugin lifecycle hooks
   */
  public hooks = {
    afterTransition: async (context: TransitionContext<TStage, TData>): Promise<void> => {
      if (this.config.autoPersist) {
        await this.saveState(context.to, context.data);
      }
    }
  };

  /**
   * Manually save the current state
   */
  public async saveState(stage?: TStage, data?: TData): Promise<void> {
    if (!this.engine || !this.storage) return;

    try {
      const currentStage = stage ?? this.engine.getCurrentStage();
      const currentData = data ?? this.engine.getCurrentData();

      const state: SerializedState<TStage, TData> = {
        stage: currentStage,
        data: currentData,
        timestamp: Date.now(),
        version: this.config.version
      };

      const serialized = this.config.serializer
        ? this.config.serializer.serialize(state)
        : JSON.stringify(state);

      this.storage.setItem(this.config.key, serialized);
    } catch (error) {
      this.handleError(error as Error, 'save');
    }
  }

  /**
   * Manually restore state from storage
   */
  public async restoreState(): Promise<boolean> {
    if (!this.engine || !this.storage) return false;

    try {
      const serialized = this.storage.getItem(this.config.key);
      if (!serialized) return false;

      const state = this.config.serializer
        ? this.config.serializer.deserialize(serialized)
        : JSON.parse(serialized) as SerializedState<TStage, TData>;

      // Check if state has expired
      if (this.isStateExpired(state)) {
        if (this.config.clearExpired) {
          await this.clearState();
        }
        return false;
      }

      // Check version compatibility
      if (this.config.version && state.version && state.version !== this.config.version) {
        if (this.config.clearExpired) {
          await this.clearState();
        }
        return false;
      }

      // Restore the state
      await this.engine.goTo(state.stage, state.data);
      return true;
    } catch (error) {
      this.handleError(error as Error, 'load');
      return false;
    }
  }

  /**
   * Clear persisted state
   */
  public async clearState(): Promise<void> {
    if (!this.storage) return;

    try {
      this.storage.removeItem(this.config.key);
    } catch (error) {
      this.handleError(error as Error, 'clear');
    }
  }

  /**
   * Check if persisted state exists
   */
  public hasPersistedState(): boolean {
    if (!this.storage) return false;

    try {
      const serialized = this.storage.getItem(this.config.key);
      if (!serialized) return false;

      const state = this.config.serializer
        ? this.config.serializer.deserialize(serialized)
        : JSON.parse(serialized) as SerializedState<TStage, TData>;

      return !this.isStateExpired(state);
    } catch {
      return false;
    }
  }

  /**
   * Get persisted state without restoring it
   */
  public getPersistedState(): SerializedState<TStage, TData> | null {
    if (!this.storage) return null;

    try {
      const serialized = this.storage.getItem(this.config.key);
      if (!serialized) return null;

      const state = this.config.serializer
        ? this.config.serializer.deserialize(serialized)
        : JSON.parse(serialized) as SerializedState<TStage, TData>;

      return this.isStateExpired(state) ? null : state;
    } catch (error) {
      this.handleError(error as Error, 'load');
      return null;
    }
  }

  /**
   * Update plugin configuration
   */
  public updateConfig(config: Partial<PersistencePluginConfig<TStage, TData>>): void {
    this.config = { ...this.config, ...config };

    // Reinitialize storage if storage type changed
    if (config.storage || config.customStorage) {
      try {
        this.storage = this.initializeStorage();
      } catch (error) {
        this.handleError(error as Error, 'load');
      }
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): PersistencePluginConfig<TStage, TData> {
    return { ...this.config };
  }

  /**
   * Initialize storage based on configuration
   */
  private initializeStorage(): Storage | CustomStorage {
    switch (this.config.storage) {
      case 'localStorage':
        if (typeof globalThis === 'undefined' || !globalThis.localStorage) {
          throw new Error('localStorage is not available');
        }
        return globalThis.localStorage;

      case 'sessionStorage':
        if (typeof globalThis === 'undefined' || !globalThis.sessionStorage) {
          throw new Error('sessionStorage is not available');
        }
        return globalThis.sessionStorage;

      case 'custom':
        if (!this.config.customStorage) {
          throw new Error('Custom storage implementation is required when storage type is "custom"');
        }
        return this.config.customStorage;

      default:
        throw new Error(`Unsupported storage type: ${this.config.storage}`);
    }
  }

  /**
   * Check if state has expired based on TTL
   */
  private isStateExpired(state: SerializedState<TStage, TData>): boolean {
    if (this.config.ttl <= 0) return false; // No expiration

    const now = Date.now();
    const age = now - state.timestamp;
    return age > this.config.ttl;
  }

  /**
   * Handle storage errors
   */
  private handleError(error: Error, operation: 'save' | 'load' | 'clear'): void {
    if (this.config.onError) {
      this.config.onError(error, operation);
    } else {
      // Default error handling - log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[StageFlow Persistence] ${operation} error:`, error);
      }
    }
  }

  /**
   * Create a persistence plugin instance with default configuration
   */
  static create<TStage extends string, TData = unknown>(
    config: Partial<PersistencePluginConfig<TStage, TData>> = {}
  ): PersistencePlugin<TStage, TData> {
    return new PersistencePlugin<TStage, TData>(config);
  }

  /**
   * Create a persistence plugin instance for localStorage
   */
  static createForLocalStorage<TStage extends string, TData = unknown>(
    key: string = 'stage-flow-state',
    config: Partial<PersistencePluginConfig<TStage, TData>> = {}
  ): PersistencePlugin<TStage, TData> {
    return new PersistencePlugin<TStage, TData>({
      storage: 'localStorage',
      key,
      ...config
    });
  }

  /**
   * Create a persistence plugin instance for sessionStorage
   */
  static createForSessionStorage<TStage extends string, TData = unknown>(
    key: string = 'stage-flow-state',
    config: Partial<PersistencePluginConfig<TStage, TData>> = {}
  ): PersistencePlugin<TStage, TData> {
    return new PersistencePlugin<TStage, TData>({
      storage: 'sessionStorage',
      key,
      ...config
    });
  }

  /**
   * Create a persistence plugin instance with custom storage
   */
  static createWithCustomStorage<TStage extends string, TData = unknown>(
    customStorage: CustomStorage,
    key: string = 'stage-flow-state',
    config: Partial<PersistencePluginConfig<TStage, TData>> = {}
  ): PersistencePlugin<TStage, TData> {
    return new PersistencePlugin<TStage, TData>({
      storage: 'custom',
      customStorage,
      key,
      ...config
    });
  }

  /**
   * Create a persistence plugin instance with TTL
   */
  static createWithTTL<TStage extends string, TData = unknown>(
    ttl: number,
    config: Partial<PersistencePluginConfig<TStage, TData>> = {}
  ): PersistencePlugin<TStage, TData> {
    return new PersistencePlugin<TStage, TData>({
      ttl,
      ...config
    });
  }
}