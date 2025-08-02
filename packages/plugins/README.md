# @stage-flow/plugins

Built-in plugins for stage flow library including logging, persistence, and analytics.

[![npm version](https://img.shields.io/npm/v/@stage-flow/plugins.svg)](https://www.npmjs.com/package/@stage-flow/plugins)
[![npm downloads](https://img.shields.io/npm/dm/@stage-flow/plugins.svg)](https://www.npmjs.com/package/@stage-flow/plugins)
[![License](https://img.shields.io/npm/l/@stage-flow/plugins.svg)](https://github.com/simplecore-inc/stage-flow/blob/main/LICENSE)

## Installation

```bash
npm install @stage-flow/plugins @stage-flow/core
```

## Quick Start

```tsx
import { StageFlowEngine } from '@stage-flow/core';
import { LoggingPlugin, PersistencePlugin, AnalyticsPlugin, LogLevel } from '@stage-flow/plugins';

// Create engine with plugins
const engine = new StageFlowEngine({
  initial: 'idle',
  stages: [
    {
      name: 'idle',
      transitions: [{ target: 'loading', event: 'start' }]
    },
    {
      name: 'loading',
      transitions: [
        { target: 'success', event: 'complete' },
        { target: 'error', event: 'error' }
      ]
    }
  ],
  plugins: [
    LoggingPlugin.create({
      level: LogLevel.INFO,
      includeTimestamp: true,
      includeContext: true
    }),
    PersistencePlugin.createForLocalStorage('my-app-state'),
    AnalyticsPlugin.create({
      trackStageEvents: true,
      trackTransitions: true,
      collectMetrics: true
    })
  ]
});

// Start the engine
await engine.start();

// Use the engine
await engine.send('start');
```

## Available Plugins

### Logging Plugin

Logs stage transitions and events for debugging.

```tsx
import { LoggingPlugin, LogLevel } from '@stage-flow/plugins';

// Create with default configuration
const plugin = LoggingPlugin.create();

// Create with custom configuration
const plugin = LoggingPlugin.create({
  level: LogLevel.INFO,
  includeTimestamp: true,
  includeContext: true,
  logTransitions: true,
  logStageEvents: true,
  prefix: '[MyApp]',
  developmentMode: true
});

// Create for development
const devPlugin = LoggingPlugin.createForDevelopment();

// Create for production
const prodPlugin = LoggingPlugin.createForProduction();
```

#### Configuration Options

- `level`: LogLevel (DEBUG, INFO, WARN, ERROR, NONE)
- `includeTimestamp`: Whether to include timestamps in logs
- `includeContext`: Whether to include stage context in logs
- `logTransitions`: Whether to log stage transitions
- `logStageEvents`: Whether to log stage enter/exit events
- `prefix`: Custom log prefix
- `logger`: Custom logger implementation
- `developmentMode`: Enable development mode features

### Persistence Plugin

Automatically saves and restores stage data to/from storage.

```tsx
import { PersistencePlugin } from '@stage-flow/plugins';

// Create for localStorage
const localStoragePlugin = PersistencePlugin.createForLocalStorage('my-app-state');

// Create for sessionStorage
const sessionStoragePlugin = PersistencePlugin.createForSessionStorage('my-app-state');

// Create with custom storage
const customStoragePlugin = PersistencePlugin.create({
  key: 'my-app-state',
  storage: {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: (key) => localStorage.removeItem(key)
  },
  autoRestore: true,
  autoPersist: true,
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  version: '1.0.0'
});
```

#### Configuration Options

- `key`: Storage key for saving state
- `storage`: Custom storage implementation
- `autoRestore`: Whether to automatically restore state on engine start
- `autoPersist`: Whether to automatically persist state on changes
- `ttl`: Time to live for persisted data (in milliseconds)
- `version`: Version for data migration
- `onError`: Error handler function
- `clearExpired`: Whether to clear expired data on restore

### Analytics Plugin

Tracks stage events and transitions for analytics.

```tsx
import { AnalyticsPlugin, AnalyticsEventType } from '@stage-flow/plugins';

// Create with default configuration
const plugin = AnalyticsPlugin.create();

// Create with custom configuration
const plugin = AnalyticsPlugin.create({
  trackStageEvents: true,
  trackTransitions: true,
  collectMetrics: true,
  trackStageDurations: true,
  trackTransitionDurations: true,
  eventHandlers: [
    (event) => console.log('Analytics event:', event),
    (event) => fetch('/api/analytics', { method: 'POST', body: JSON.stringify(event) })
  ],
  globalProperties: {
    appVersion: '1.0.0',
    userId: 'user123'
  },
  batchEvents: true,
  batchSize: 10,
  batchTimeout: 5000,
  persistMetrics: true,
  metricsStorageKey: 'analytics-metrics'
});
```

#### Configuration Options

- `trackStageEvents`: Whether to track stage enter/exit events
- `trackTransitions`: Whether to track stage transitions
- `collectMetrics`: Whether to collect performance metrics
- `trackStageDurations`: Whether to track how long stages are active
- `trackTransitionDurations`: Whether to track transition durations
- `eventHandlers`: Array of event handler functions
- `globalProperties`: Global properties to include in all events
- `batchEvents`: Whether to batch events before sending
- `batchSize`: Maximum number of events in a batch
- `batchTimeout`: Timeout for sending batched events
- `persistMetrics`: Whether to persist metrics to storage
- `metricsStorageKey`: Storage key for metrics data

## Creating Custom Plugins

You can create custom plugins by implementing the `Plugin` interface:

```tsx
import { Plugin, StageContext, TransitionContext } from '@stage-flow/core';

class MyCustomPlugin implements Plugin {
  name = 'my-custom-plugin';
  
  hooks = {
    onStageEnter: async (context: StageContext) => {
      console.log(`Entered stage: ${context.current}`);
    },
    
    onStageExit: async (context: StageContext) => {
      console.log(`Exited stage: ${context.current}`);
    },
    
    beforeTransition: async (context: TransitionContext) => {
      console.log(`Transition: ${context.from} -> ${context.to}`);
    }
  };
}

// Use custom plugin
const engine = new StageFlowEngine({
  // ... config
  plugins: [
    new MyCustomPlugin()
  ]
});

await engine.start();
```

## Plugin Lifecycle

Plugins follow this lifecycle:

1. **Initialization**: Plugin is created and configured
2. **Installation**: Plugin is installed into the engine
3. **Engine Start**: Engine starts and plugins are activated
4. **Event Handling**: Plugins receive events during engine operation
5. **Engine Stop**: Engine stops and plugins are deactivated
6. **Cleanup**: Plugin resources are cleaned up

## Best Practices

- **Use appropriate log levels**: Use DEBUG for development, INFO for general logging, WARN for warnings, ERROR for errors
- **Handle errors gracefully**: Implement error handlers for persistence and analytics plugins
- **Batch analytics events**: Use batching for analytics to improve performance
- **Version your data**: Use versioning for persistence plugins to handle data migrations
- **Clean up resources**: Implement proper cleanup in custom plugins

## API Reference

### LoggingPlugin

```tsx
// Static methods
LoggingPlugin.create(config?: LoggingConfig): LoggingPlugin
LoggingPlugin.createForDevelopment(): LoggingPlugin
LoggingPlugin.createForProduction(): LoggingPlugin

// Instance methods
plugin.setLevel(level: LogLevel): void
plugin.setLogger(logger: Logger): void
plugin.log(message: string, level?: LogLevel): void
```

### PersistencePlugin

```tsx
// Static methods
PersistencePlugin.create(config: PersistenceConfig): PersistencePlugin
PersistencePlugin.createForLocalStorage(key: string): PersistencePlugin
PersistencePlugin.createForSessionStorage(key: string): PersistencePlugin

// Instance methods
plugin.save(): Promise<void>
plugin.restore(): Promise<void>
plugin.clear(): Promise<void>
plugin.clearExpired(): Promise<void>
```

### AnalyticsPlugin

```tsx
// Static methods
AnalyticsPlugin.create(config?: AnalyticsConfig): AnalyticsPlugin

// Instance methods
plugin.trackEvent(event: AnalyticsEvent): void
plugin.trackStageEvent(stage: string, eventType: AnalyticsEventType): void
plugin.trackTransition(from: string, to: string): void
plugin.flush(): Promise<void>
plugin.getMetrics(): AnalyticsMetrics
```

## License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2024 SimpleCORE Inc. 