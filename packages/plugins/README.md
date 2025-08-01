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
import { loggingPlugin, persistencePlugin, analyticsPlugin } from '@stage-flow/plugins';

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
    loggingPlugin({
      level: 'info',
      includeData: true
    }),
    persistencePlugin({
      key: 'my-app-state',
      storage: localStorage
    }),
    analyticsPlugin({
      trackEvents: true,
      trackTransitions: true
    })
  ]
});
```

## Available Plugins

### Logging Plugin

Logs stage transitions and events for debugging.

```tsx
import { loggingPlugin } from '@stage-flow/plugins';

const plugin = loggingPlugin({
  level: 'info', // 'debug' | 'info' | 'warn' | 'error'
  includeData: true,
  includeTimestamps: true
});
```

### Persistence Plugin

Automatically saves and restores stage data to/from storage.

```tsx
import { persistencePlugin } from '@stage-flow/plugins';

const plugin = persistencePlugin({
  key: 'app-state',
  storage: localStorage, // or sessionStorage
  debounce: 1000, // ms
  includeStage: true
});
```

### Analytics Plugin

Tracks user interactions and stage transitions for analytics.

```tsx
import { analyticsPlugin } from '@stage-flow/plugins';

const plugin = analyticsPlugin({
  trackEvents: true,
  trackTransitions: true,
  trackData: false,
  customTracker: (event, data) => {
    // Custom analytics implementation
    analytics.track(event, data);
  }
});
```

## Plugin Configuration

All plugins support common configuration options:

```tsx
interface PluginConfig {
  enabled?: boolean;
  debug?: boolean;
  filter?: (event: string, data?: any) => boolean;
}
```

## Creating Custom Plugins

```tsx
import { Plugin } from '@stage-flow/core';

const customPlugin: Plugin = {
  name: 'custom-plugin',
  
  onInit(engine) {
    console.log('Plugin initialized');
  },
  
  onStageChange(from, to, data) {
    console.log(`Stage changed from ${from} to ${to}`);
  },
  
  onEvent(event, data) {
    console.log(`Event: ${event}`, data);
  }
};
```

## Documentation

- [Plugin System](https://stage-flow.simplecore.dev/docs/guide/plugin-system)
- [Built-in Plugins](https://stage-flow.simplecore.dev/docs/api/plugins)
- [Creating Custom Plugins](https://stage-flow.simplecore.dev/docs/guide/plugin-system#custom-plugins)

## License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2024 SimpleCORE Inc. 