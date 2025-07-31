---
id: api-plugins
title: Plugins API
sidebar_label: Plugins API
---

# Plugins API

Plugin system for extending Stage Flow functionality.

## Plugin Interface

Base interface for all plugins.

```tsx
interface Plugin<TStage extends string, TData = unknown> {
  /** Unique plugin name */
  name: string;
  
  /** Optional plugin version */
  version?: string;
  
  /** Optional plugin dependencies */
  dependencies?: string[];
  
  /** Plugin installation function */
  install: (engine: StageFlowEngine<TStage, TData>) => void | Promise<void>;
  
  /** Optional plugin uninstallation function */
  uninstall?: (engine: StageFlowEngine<TStage, TData>) => void | Promise<void>;
  
  /** Optional lifecycle hooks */
  hooks?: {
    beforeTransition?: (context: TransitionContext<TStage, TData>) => void | Promise<void>;
    afterTransition?: (context: TransitionContext<TStage, TData>) => void | Promise<void>;
    onStageEnter?: (context: StageContext<TStage, TData>) => void | Promise<void>;
    onStageExit?: (context: StageContext<TStage, TData>) => void | Promise<void>;
  };
  
  /** Optional plugin-specific state */
  state?: Record<string, unknown>;
}
```

## LoggingPlugin

Plugin for logging stage transitions and events.

```tsx
import { LoggingPlugin } from '@stage-flow/plugins';

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

interface LoggingPluginConfig {
  /** Minimum log level to output */
  level: LogLevel;
  /** Whether to include timestamps in logs */
  includeTimestamp: boolean;
  /** Whether to include stage context in logs */
  includeContext: boolean;
  /** Whether to log stage transitions */
  logTransitions: boolean;
  /** Whether to log stage enter/exit events */
  logStageEvents: boolean;
  /** Custom log prefix */
  prefix: string;
  /** Custom logger function (defaults to console) */
  logger?: {
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
  };
  /** Whether to enable development mode features */
  developmentMode: boolean;
}

class LoggingPlugin<TStage extends string, TData = unknown> implements Plugin<TStage, TData> {
  constructor(config?: Partial<LoggingPluginConfig>);
  
  /** Update plugin configuration */
  updateConfig(config: Partial<LoggingPluginConfig>): void;
  
  /** Get current configuration */
  getConfig(): LoggingPluginConfig;
  
  /** Create a logging plugin instance with default configuration */
  static create<TStage extends string, TData = unknown>(
    config?: Partial<LoggingPluginConfig>
  ): LoggingPlugin<TStage, TData>;
  
  /** Create a logging plugin instance for development */
  static createForDevelopment<TStage extends string, TData = unknown>(
    config?: Partial<LoggingPluginConfig>
  ): LoggingPlugin<TStage, TData>;
  
  /** Create a logging plugin instance for production */
  static createForProduction<TStage extends string, TData = unknown>(
    config?: Partial<LoggingPluginConfig>
  ): LoggingPlugin<TStage, TData>;
}
```

## PersistencePlugin

Plugin for saving and restoring application state.

```tsx
import { PersistencePlugin } from '@stage-flow/plugins';

interface PersistencePluginConfig {
  /** Storage key for saving state */
  key: string;
  /** Storage implementation to use */
  storage: Storage;
  /** Optional custom serializer */
  serialize?: (data: any) => string;
  /** Optional custom deserializer */
  deserialize?: (str: string) => any;
  /** Optional time-to-live in milliseconds */
  ttl?: number;
  /** Whether to auto-save on every transition */
  autoSave?: boolean;
  /** Whether to restore state on engine start */
  autoRestore?: boolean;
}

class PersistencePlugin<TStage extends string, TData = unknown> implements Plugin<TStage, TData> {
  constructor(config: PersistencePluginConfig);
  
  /** Save current state to storage */
  save(): void;
  
  /** Restore state from storage */
  restore(): boolean;
  
  /** Clear saved state */
  clear(): void;
  
  /** Check if saved state exists */
  hasSavedState(): boolean;
}
```

## AnalyticsPlugin

Plugin for tracking user interactions and stage transitions.

```tsx
import { AnalyticsPlugin } from '@stage-flow/plugins';

interface AnalyticsPluginConfig {
  /** Whether to track stage time spent */
  trackStageTime?: boolean;
  /** Whether to track stage transition durations */
  trackStageDurations?: boolean;
  /** Custom event handlers */
  eventHandlers?: {
    onStageEnter?: (stage: string, data: any) => void;
    onStageExit?: (stage: string, data: any) => void;
    onTransition?: (from: string, to: string, data: any) => void;
    onError?: (error: Error, context: any) => void;
  };
  /** Whether to include stage data in events */
  includeData?: boolean;
  /** Custom event prefix */
  eventPrefix?: string;
}

class AnalyticsPlugin<TStage extends string, TData = unknown> implements Plugin<TStage, TData> {
  constructor(config?: AnalyticsPluginConfig);
  
  /** Track a custom event */
  track(event: string, data?: any): void;
  
  /** Get analytics data */
  getAnalytics(): {
    stageTimes: Record<string, number>;
    transitionCounts: Record<string, number>;
    totalTime: number;
  };
  
  /** Reset analytics data */
  reset(): void;
}
```

## Usage Examples

### Basic Plugin Usage

```tsx
import { StageFlowEngine } from '@stage-flow/core';
import { LoggingPlugin, PersistencePlugin, AnalyticsPlugin } from '@stage-flow/plugins';

const engine = new StageFlowEngine(config, {
  plugins: [
    new LoggingPlugin({ 
      level: LogLevel.INFO,
      includeContext: true 
    }),
    new PersistencePlugin({ 
      key: 'app-state', 
      storage: localStorage,
      autoSave: true,
      autoRestore: true
    }),
    new AnalyticsPlugin({
      trackStageTime: true,
      trackStageDurations: true,
      eventHandlers: {
        onStageEnter: (stage, data) => {
          console.log(`Entered stage: ${stage}`, data);
        },
        onTransition: (from, to, data) => {
          console.log(`Transition: ${from} -> ${to}`, data);
        }
      }
    })
  ]
});
```

### Custom Plugin

```tsx
import { Plugin, StageFlowEngine } from '@stage-flow/core';

class CustomPlugin<TStage extends string, TData = unknown> implements Plugin<TStage, TData> {
  name = 'custom-plugin';
  version = '1.0.0';
  
  private engine?: StageFlowEngine<TStage, TData>;
  private state: Record<string, unknown> = {};

  async install(engine: StageFlowEngine<TStage, TData>): Promise<void> {
    this.engine = engine;
    
    // Subscribe to engine events
    const unsubscribe = engine.subscribe((stage, data) => {
      console.log(`Custom plugin: Stage changed to ${stage}`, data);
      this.state.lastStage = stage;
      this.state.lastData = data;
    });
    
    // Store unsubscribe function for cleanup
    this.state.unsubscribe = unsubscribe;
    
    console.log('Custom plugin installed');
  }

  async uninstall(): Promise<void> {
    if (this.state.unsubscribe) {
      (this.state.unsubscribe as () => void)();
    }
    
    this.engine = undefined;
    this.state = {};
    
    console.log('Custom plugin uninstalled');
  }

  hooks = {
    beforeTransition: async (context) => {
      console.log(`Custom plugin: Before transition ${context.from} -> ${context.to}`);
    },
    
    afterTransition: async (context) => {
      console.log(`Custom plugin: After transition ${context.from} -> ${context.to}`);
    },
    
    onStageEnter: async (context) => {
      console.log(`Custom plugin: Entered stage ${context.current}`);
    },
    
    onStageExit: async (context) => {
      console.log(`Custom plugin: Exited stage ${context.current}`);
    }
  };
}

const engine = new StageFlowEngine(config, {
  plugins: [new CustomPlugin()]
});
```

### Plugin Configuration

```tsx
// Logging Plugin with custom configuration
const loggingPlugin = new LoggingPlugin({
  level: LogLevel.DEBUG,
  includeContext: true,
  logTransitions: true,
  logStageEvents: true,
  prefix: '[MyApp]',
  logger: {
    debug: (msg) => console.debug(`[DEBUG] ${msg}`),
    info: (msg) => console.info(`[INFO] ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`)
  },
  developmentMode: process.env.NODE_ENV === 'development'
});

// Persistence Plugin with custom serialization
const persistencePlugin = new PersistencePlugin({
  key: 'my-app-state',
  storage: sessionStorage,
  serialize: (data) => JSON.stringify(data, null, 2),
  deserialize: (str) => JSON.parse(str),
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  autoSave: true,
  autoRestore: true
});

// Analytics Plugin with custom event handlers
const analyticsPlugin = new AnalyticsPlugin({
  trackStageTime: true,
  trackStageDurations: true,
  includeData: true,
  eventPrefix: 'stage_flow',
  eventHandlers: {
    onStageEnter: (stage, data) => {
      if (window.gtag) {
        window.gtag('event', 'stage_enter', {
          stage_name: stage,
          stage_data: data
        });
      }
    },
    onTransition: (from, to, data) => {
      if (window.gtag) {
        window.gtag('event', 'stage_transition', {
          from_stage: from,
          to_stage: to,
          transition_data: data
        });
      }
    },
    onError: (error, context) => {
      if (window.gtag) {
        window.gtag('event', 'stage_error', {
          error_message: error.message,
          error_stack: error.stack,
          context: context
        });
      }
    }
  }
});
```

### Plugin Lifecycle

```tsx
class LifecyclePlugin<TStage extends string, TData = unknown> implements Plugin<TStage, TData> {
  name = 'lifecycle-plugin';
  version = '1.0.0';
  
  private engine?: StageFlowEngine<TStage, TData>;

  async install(engine: StageFlowEngine<TStage, TData>): Promise<void> {
    this.engine = engine;
    console.log('Lifecycle plugin installed');
    
    // Subscribe to engine events
    const unsubscribe = engine.subscribe((stage, data) => {
      console.log(`Engine state changed: ${stage}`, data);
    });
    
    // Store for cleanup
    this.state = { unsubscribe };
  }

  async uninstall(): Promise<void> {
    console.log('Lifecycle plugin uninstalling');
    
    if (this.state?.unsubscribe) {
      (this.state.unsubscribe as () => void)();
    }
    
    this.engine = undefined;
    console.log('Lifecycle plugin uninstalled');
  }

  hooks = {
    beforeTransition: async (context) => {
      console.log(`[Lifecycle] Before transition: ${context.from} -> ${context.to}`);
    },
    
    afterTransition: async (context) => {
      console.log(`[Lifecycle] After transition: ${context.from} -> ${context.to}`);
    },
    
    onStageEnter: async (context) => {
      console.log(`[Lifecycle] Entered stage: ${context.current}`);
    },
    
    onStageExit: async (context) => {
      console.log(`[Lifecycle] Exited stage: ${context.current}`);
    }
  };
}
```

### Error Handling in Plugins

```tsx
class ErrorHandlingPlugin<TStage extends string, TData = unknown> implements Plugin<TStage, TData> {
  name = 'error-handling-plugin';
  version = '1.0.0';

  async install(engine: StageFlowEngine<TStage, TData>): Promise<void> {
    // Subscribe to engine errors
    engine.on('error', (error) => {
      console.error('Stage Flow Error:', error);
      
      // Send error to monitoring service
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: false
        });
      }
      
      // Send to custom error tracking
      if (window.Sentry) {
        window.Sentry.captureException(error);
      }
    });
  }

  hooks = {
    onStageEnter: async (context) => {
      try {
        // Validate stage data
        if (context.data && typeof context.data === 'object') {
          // Perform validation
          console.log('Stage data validated:', context.data);
        }
      } catch (error) {
        console.error('Stage validation error:', error);
        throw error;
      }
    }
  };
}
```

### Plugin Dependencies

```tsx
class DependentPlugin<TStage extends string, TData = unknown> implements Plugin<TStage, TData> {
  name = 'dependent-plugin';
  version = '1.0.0';
  dependencies = ['logging', 'persistence']; // Requires logging and persistence plugins

  async install(engine: StageFlowEngine<TStage, TData>): Promise<void> {
    // Check if required plugins are installed
    const installedPlugins = engine.getInstalledPlugins();
    
    for (const dependency of this.dependencies) {
      if (!installedPlugins.includes(dependency)) {
        throw new Error(`Required plugin '${dependency}' is not installed`);
      }
    }
    
    console.log('Dependent plugin installed with all dependencies');
  }
}
``` 