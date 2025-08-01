# @stage-flow/core

Framework-agnostic core stage flow engine for building type-safe state machines.

[![npm version](https://img.shields.io/npm/v/@stage-flow/core.svg)](https://www.npmjs.com/package/@stage-flow/core)
[![npm downloads](https://img.shields.io/npm/dm/@stage-flow/core.svg)](https://www.npmjs.com/package/@stage-flow/core)
[![License](https://img.shields.io/npm/l/@stage-flow/core.svg)](https://github.com/simplecore-inc/stage-flow/blob/main/LICENSE)

## Installation

```bash
npm install @stage-flow/core
```

## Quick Start

```tsx
import { StageFlowEngine } from '@stage-flow/core';

// Define your stages
type AppStages = 'idle' | 'loading' | 'success' | 'error';

// Create engine
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
    },
    {
      name: 'success',
      transitions: [{ target: 'idle', event: 'reset' }]
    },
    {
      name: 'error',
      transitions: [{ target: 'idle', event: 'retry' }]
    }
  ]
});

// Start the engine
engine.start();

// Send events
engine.send('start');
engine.send('complete');
engine.send('reset');
```

## API Reference

### StageFlowEngine

The core engine class for managing state transitions.

```tsx
const engine = new StageFlowEngine(config);
```

#### Configuration

```tsx
interface EngineConfig {
  initial: string;
  stages: Stage[];
  data?: any;
  plugins?: Plugin[];
}
```

#### Methods

- `start()`: Initialize the engine
- `send(event, data?)`: Send an event to trigger transitions
- `setStageData(data)`: Update current stage data
- `getCurrentStage()`: Get current stage name
- `getData()`: Get current stage data

## Documentation

- [Getting Started](https://simplecore-inc.github.io/stage-flow/docs/guide/getting-started)
- [Core Concepts](https://simplecore-inc.github.io/stage-flow/docs/guide/core-concepts)
- [API Reference](https://simplecore-inc.github.io/stage-flow/docs/api/core)

## License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2024 SimpleCORE Inc. 