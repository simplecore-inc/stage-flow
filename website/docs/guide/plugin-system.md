# Plugin System

Learn how to extend Stage Flow functionality with plugins for logging, persistence, analytics, and more.

## Overview

Stage Flow's plugin system allows you to extend the core functionality with additional features like logging, persistence, analytics, and custom behaviors. Plugins are modular, type-safe, and can be composed together.

## Built-in Plugins

### Logging Plugin

Track stage transitions and events:

```tsx
import { LoggingPlugin } from '@stage-flow/plugins';

const engine = new StageFlowEngine(config, {
  plugins: [
    new LoggingPlugin({
      level: 'info',
      includeContext: true,
      logger: console
    })
  ]
});
```

### Persistence Plugin

Save and restore application state:

```tsx
import { PersistencePlugin } from '@stage-flow/plugins';

const engine = new StageFlowEngine(config, {
  plugins: [
    new PersistencePlugin({
      key: 'app-state',
      storage: localStorage,
      serialize: (data) => JSON.stringify(data),
      deserialize: (str) => JSON.parse(str)
    })
  ]
});
```

### Analytics Plugin

Track user interactions and stage transitions:

```tsx
import { AnalyticsPlugin } from '@stage-flow/plugins';

const engine = new StageFlowEngine(config, {
  plugins: [
    new AnalyticsPlugin({
      trackStageTime: true,
      trackStageDurations: true,
      eventHandlers: {
        onStageEnter: (stage, data) => {
          analytics.track('stage_entered', { stage, data });
        },
        onStageExit: (stage, data) => {
          analytics.track('stage_exited', { stage, data });
        }
      }
    })
  ]
});
```

## Creating Custom Plugins

### Basic Plugin Structure

```tsx
import { Plugin, StageFlowEngine } from '@stage-flow/core';

interface MyPluginConfig {
  enabled?: boolean;
  customOption?: string;
}

class MyPlugin implements Plugin {
  name = 'my-plugin';
  private config: MyPluginConfig;
  
  constructor(config: MyPluginConfig = {}) {
    this.config = { enabled: true, ...config };
  }
  
  install(engine: StageFlowEngine<any, any>): void {
    if (!this.config.enabled) return;
    
    // Subscribe to engine events
    engine.on('transition', this.handleTransition.bind(this));
    engine.on('error', this.handleError.bind(this));
  }
  
  uninstall(engine: StageFlowEngine<any, any>): void {
    // Clean up event listeners
    engine.off('transition', this.handleTransition.bind(this));
    engine.off('error', this.handleError.bind(this));
  }
  
  private handleTransition(from: string, to: string, data: any): void {
    console.log(`[MyPlugin] Transition from ${from} to ${to}`, data);
  }
  
  private handleError(error: Error): void {
    console.error(`[MyPlugin] Error:`, error);
  }
}

// Usage
const engine = new StageFlowEngine(config, {
  plugins: [
    new MyPlugin({ enabled: true, customOption: 'value' })
  ]
});
```

### Advanced Plugin with Type Safety

```tsx
import { Plugin, StageFlowEngine } from '@stage-flow/core';

interface ValidationPluginConfig<TData> {
  rules: Record<string, (data: TData) => boolean | string>;
  onValidationError?: (field: string, error: string) => void;
}

class ValidationPlugin<TStage extends string, TData> implements Plugin {
  name = 'validation-plugin';
  private config: ValidationPluginConfig<TData>;
  
  constructor(config: ValidationPluginConfig<TData>) {
    this.config = config;
  }
  
  install(engine: StageFlowEngine<TStage, TData>): void {
    // Add validation to transitions
    engine.on('beforeTransition', this.validateTransition.bind(this));
  }
  
  uninstall(engine: StageFlowEngine<TStage, TData>): void {
    engine.off('beforeTransition', this.validateTransition.bind(this));
  }
  
  private validateTransition(from: TStage, to: TStage, data: TData): void {
    for (const [field, rule] of Object.entries(this.config.rules)) {
      const result = rule(data);
      
      if (result === false) {
        const error = `Validation failed for field: ${field}`;
        this.config.onValidationError?.(field, error);
        throw new Error(error);
      } else if (typeof result === 'string') {
        this.config.onValidationError?.(field, result);
        throw new Error(result);
      }
    }
  }
}

// Usage
const validationPlugin = new ValidationPlugin<AppStage, AppData>({
  rules: {
    email: (data) => {
      if (!data.email) return 'Email is required';
      if (!data.email.includes('@')) return 'Invalid email format';
      return true;
    },
    password: (data) => {
      if (!data.password) return 'Password is required';
      if (data.password.length < 6) return 'Password must be at least 6 characters';
      return true;
    }
  },
  onValidationError: (field, error) => {
    console.error(`Validation error for ${field}:`, error);
  }
});

const engine = new StageFlowEngine(config, {
  plugins: [validationPlugin]
});
```

### Plugin with Side Effects

```tsx
class APIPlugin<TStage extends string, TData> implements Plugin {
  name = 'api-plugin';
  private apiClient: any;
  
  constructor(apiClient: any) {
    this.apiClient = apiClient;
  }
  
  install(engine: StageFlowEngine<TStage, TData>): void {
    // Add API effects to specific stages
    engine.on('stageEnter', this.handleStageEnter.bind(this));
  }
  
  uninstall(engine: StageFlowEngine<TStage, TData>): void {
    engine.off('stageEnter', this.handleStageEnter.bind(this));
  }
  
  private async handleStageEnter(stage: TStage, data: TData): Promise<void> {
    switch (stage) {
      case 'loading':
        await this.fetchData(data);
        break;
      case 'submitting':
        await this.submitData(data);
        break;
    }
  }
  
  private async fetchData(data: TData): Promise<void> {
    try {
      const response = await this.apiClient.get('/api/data');
      // Handle response
    } catch (error) {
      // Handle error
    }
  }
  
  private async submitData(data: TData): Promise<void> {
    try {
      const response = await this.apiClient.post('/api/submit', data);
      // Handle response
    } catch (error) {
      // Handle error
    }
  }
}
```

## Plugin Composition

### Combining Multiple Plugins

```tsx
import { LoggingPlugin, PersistencePlugin, AnalyticsPlugin } from '@stage-flow/plugins';

// Create a plugin composition
const plugins = [
  new LoggingPlugin({
    level: 'info',
    includeContext: true
  }),
  new PersistencePlugin({
    key: 'app-state',
    storage: localStorage
  }),
  new AnalyticsPlugin({
    trackStageTime: true,
    eventHandlers: {
      onStageEnter: (stage, data) => {
        analytics.track('stage_entered', { stage, data });
      }
    }
  }),
  new ValidationPlugin({
    rules: {
      email: (data) => data.email?.includes('@') || 'Invalid email',
      password: (data) => data.password?.length >= 6 || 'Password too short'
    }
  })
];

const engine = new StageFlowEngine(config, { plugins });
```

### Plugin Manager

```tsx
class PluginManager<TStage extends string, TData> {
  private plugins: Map<string, Plugin> = new Map();
  private engine: StageFlowEngine<TStage, TData> | null = null;
  
  register(plugin: Plugin): this {
    this.plugins.set(plugin.name, plugin);
    return this;
  }
  
  unregister(name: string): this {
    this.plugins.delete(name);
    return this;
  }
  
  install(engine: StageFlowEngine<TStage, TData>): void {
    this.engine = engine;
    this.plugins.forEach(plugin => plugin.install(engine));
  }
  
  uninstall(): void {
    if (this.engine) {
      this.plugins.forEach(plugin => plugin.uninstall(this.engine!));
      this.engine = null;
    }
  }
  
  getPlugin<T extends Plugin>(name: string): T | undefined {
    return this.plugins.get(name) as T;
  }
  
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }
}

// Usage
const pluginManager = new PluginManager<AppStage, AppData>();

pluginManager
  .register(new LoggingPlugin())
  .register(new PersistencePlugin())
  .register(new AnalyticsPlugin());

const engine = new StageFlowEngine(config);
pluginManager.install(engine);
```

## Plugin Lifecycle

### Plugin Installation

```tsx
class LifecyclePlugin implements Plugin {
  name = 'lifecycle-plugin';
  
  install(engine: StageFlowEngine<any, any>): void {
    console.log('Plugin installed');
    
    // Subscribe to engine events
    engine.on('start', this.onEngineStart.bind(this));
    engine.on('stop', this.onEngineStop.bind(this));
    engine.on('transition', this.onTransition.bind(this));
  }
  
  uninstall(engine: StageFlowEngine<any, any>): void {
    console.log('Plugin uninstalled');
    
    // Clean up event listeners
    engine.off('start', this.onEngineStart.bind(this));
    engine.off('stop', this.onEngineStop.bind(this));
    engine.off('transition', this.onTransition.bind(this));
  }
  
  private onEngineStart(): void {
    console.log('Engine started');
  }
  
  private onEngineStop(): void {
    console.log('Engine stopped');
  }
  
  private onTransition(from: string, to: string, data: any): void {
    console.log(`Transition: ${from} -> ${to}`, data);
  }
}
```

### Plugin Configuration

```tsx
interface PluginConfig {
  enabled: boolean;
  options: Record<string, any>;
}

class ConfigurablePlugin implements Plugin {
  name = 'configurable-plugin';
  private config: PluginConfig;
  
  constructor(config: Partial<PluginConfig> = {}) {
    this.config = {
      enabled: true,
      options: {},
      ...config
    };
  }
  
  install(engine: StageFlowEngine<any, any>): void {
    if (!this.config.enabled) return;
    
    // Apply configuration
    this.applyConfig(engine);
  }
  
  uninstall(engine: StageFlowEngine<any, any>): void {
    // Clean up configuration
    this.cleanup(engine);
  }
  
  private applyConfig(engine: StageFlowEngine<any, any>): void {
    // Apply plugin configuration to engine
    console.log('Applying configuration:', this.config.options);
  }
  
  private cleanup(engine: StageFlowEngine<any, any>): void {
    // Clean up any applied configuration
    console.log('Cleaning up configuration');
  }
}
```

## Advanced Plugin Patterns

### Plugin with Middleware

```tsx
class MiddlewarePlugin implements Plugin {
  name = 'middleware-plugin';
  private middleware: Array<(data: any) => any> = [];
  
  constructor(middleware: Array<(data: any) => any> = []) {
    this.middleware = middleware;
  }
  
  install(engine: StageFlowEngine<any, any>): void {
    // Add middleware to data processing
    engine.on('beforeTransition', this.processData.bind(this));
  }
  
  uninstall(engine: StageFlowEngine<any, any>): void {
    engine.off('beforeTransition', this.processData.bind(this));
  }
  
  private processData(from: string, to: string, data: any): any {
    return this.middleware.reduce((processedData, middleware) => {
      return middleware(processedData);
    }, data);
  }
}

// Usage
const middlewarePlugin = new MiddlewarePlugin([
  (data) => ({ ...data, timestamp: Date.now() }),
  (data) => ({ ...data, processed: true }),
  (data) => ({ ...data, version: '1.0.0' })
]);
```

### Plugin with State Management

```tsx
class StatePlugin implements Plugin {
  name = 'state-plugin';
  private state: Map<string, any> = new Map();
  
  install(engine: StageFlowEngine<any, any>): void {
    // Add state management to engine
    engine.on('transition', this.updateState.bind(this));
  }
  
  uninstall(engine: StageFlowEngine<any, any>): void {
    engine.off('transition', this.updateState.bind(this));
  }
  
  setState(key: string, value: any): void {
    this.state.set(key, value);
  }
  
  getState(key: string): any {
    return this.state.get(key);
  }
  
  private updateState(from: string, to: string, data: any): void {
    this.setState('currentStage', to);
    this.setState('lastTransition', { from, to, timestamp: Date.now() });
    this.setState('data', data);
  }
}
```

### Plugin with Event Emitter

```tsx
import { EventEmitter } from 'events';

class EventPlugin extends EventEmitter implements Plugin {
  name = 'event-plugin';
  
  install(engine: StageFlowEngine<any, any>): void {
    // Forward engine events to plugin
    engine.on('transition', (from, to, data) => {
      this.emit('transition', { from, to, data });
    });
    
    engine.on('error', (error) => {
      this.emit('error', error);
    });
  }
  
  uninstall(engine: StageFlowEngine<any, any>): void {
    // Remove event listeners
    this.removeAllListeners();
  }
}

// Usage
const eventPlugin = new EventPlugin();

eventPlugin.on('transition', ({ from, to, data }) => {
  console.log(`Stage changed from ${from} to ${to}`, data);
});

eventPlugin.on('error', (error) => {
  console.error('Engine error:', error);
});
```

## Testing Plugins

### Plugin Testing Utilities

```tsx
import { createTestEngine } from '@stage-flow/testing';

describe('MyPlugin', () => {
  let engine: StageFlowEngine<AppStage, AppData>;
  let plugin: MyPlugin;
  
  beforeEach(() => {
    plugin = new MyPlugin({ enabled: true });
    engine = createTestEngine(config, { plugins: [plugin] });
  });
  
  it('should install correctly', () => {
    expect(plugin.name).toBe('my-plugin');
  });
  
  it('should handle transitions', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await engine.start();
    await engine.send('next');
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Transition from idle to loading')
    );
    
    consoleSpy.mockRestore();
  });
  
  it('should handle errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Trigger an error
    await engine.send('invalid-event');
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error:'),
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });
});
```

## Best Practices

### 1. Keep Plugins Focused

```tsx
// ✅ Good: Focused plugin with single responsibility
class LoggingPlugin implements Plugin {
  name = 'logging-plugin';
  
  install(engine: StageFlowEngine<any, any>): void {
    engine.on('transition', this.logTransition.bind(this));
  }
  
  private logTransition(from: string, to: string, data: any): void {
    console.log(`Transition: ${from} -> ${to}`, data);
  }
}

// ❌ Avoid: Plugin with multiple responsibilities
class ComplexPlugin implements Plugin {
  name = 'complex-plugin';
  
  install(engine: StageFlowEngine<any, any>): void {
    // Logging
    engine.on('transition', this.log.bind(this));
    
    // Validation
    engine.on('beforeTransition', this.validate.bind(this));
    
    // Analytics
    engine.on('transition', this.track.bind(this));
    
    // Persistence
    engine.on('transition', this.save.bind(this));
  }
}
```

### 2. Use Type Safety

```tsx
// ✅ Good: Type-safe plugin
class TypedPlugin<TStage extends string, TData> implements Plugin {
  name = 'typed-plugin';
  
  install(engine: StageFlowEngine<TStage, TData>): void {
    engine.on('transition', this.handleTransition.bind(this));
  }
  
  private handleTransition(from: TStage, to: TStage, data: TData): void {
    // TypeScript ensures type safety
    console.log(`Transition from ${from} to ${to}`, data);
  }
}

// ❌ Avoid: Using any types
class UntypedPlugin implements Plugin {
  name = 'untyped-plugin';
  
  install(engine: any): void {
    engine.on('transition', (from: any, to: any, data: any) => {
      // No type safety
    });
  }
}
```

### 3. Handle Errors Gracefully

```tsx
// ✅ Good: Proper error handling
class SafePlugin implements Plugin {
  name = 'safe-plugin';
  
  install(engine: StageFlowEngine<any, any>): void {
    try {
      engine.on('transition', this.handleTransition.bind(this));
    } catch (error) {
      console.error('Failed to install plugin:', error);
    }
  }
  
  private handleTransition(from: string, to: string, data: any): void {
    try {
      // Plugin logic
    } catch (error) {
      console.error('Plugin error:', error);
      // Don't throw - let the engine continue
    }
  }
}

// ❌ Avoid: No error handling
class UnsafePlugin implements Plugin {
  name = 'unsafe-plugin';
  
  install(engine: StageFlowEngine<any, any>): void {
    engine.on('transition', (from, to, data) => {
      // No error handling - could crash the engine
      throw new Error('Plugin error');
    });
  }
}
```

### 4. Clean Up Resources

```tsx
// ✅ Good: Proper cleanup
class CleanPlugin implements Plugin {
  name = 'clean-plugin';
  private listeners: Array<{ event: string; handler: Function }> = [];
  
  install(engine: StageFlowEngine<any, any>): void {
    const transitionHandler = this.handleTransition.bind(this);
    const errorHandler = this.handleError.bind(this);
    
    engine.on('transition', transitionHandler);
    engine.on('error', errorHandler);
    
    this.listeners.push(
      { event: 'transition', handler: transitionHandler },
      { event: 'error', handler: errorHandler }
    );
  }
  
  uninstall(engine: StageFlowEngine<any, any>): void {
    this.listeners.forEach(({ event, handler }) => {
      engine.off(event, handler);
    });
    this.listeners = [];
  }
}

// ❌ Avoid: No cleanup
class DirtyPlugin implements Plugin {
  name = 'dirty-plugin';
  
  install(engine: StageFlowEngine<any, any>): void {
    engine.on('transition', this.handleTransition.bind(this));
  }
  
  // No uninstall method - memory leak!
}
```

## Next Steps

- [Middleware](/docs/guide/middleware) - Add processing layers

- [Testing](/docs/guide/testing) - Test your stage machines 