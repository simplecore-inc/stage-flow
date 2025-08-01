# Stage Flow

A type-safe, plugin-based stage flow library for React applications.

[![npm version](https://img.shields.io/npm/v/@stage-flow/core.svg)](https://www.npmjs.com/package/@stage-flow/core)
[![npm downloads](https://img.shields.io/npm/dm/@stage-flow/core.svg)](https://www.npmjs.com/package/@stage-flow/core)
[![GitHub stars](https://img.shields.io/github/stars/stage-flow/stage-flow.svg)](https://github.com/stage-flow/stage-flow)
[![License](https://img.shields.io/npm/l/@stage-flow/core.svg)](https://github.com/stage-flow/stage-flow/blob/main/LICENSE)

## Features

- **Type Safe**: Full TypeScript support with generic types
- **Plugin Based**: Extensible architecture with built-in plugins
- **React Ready**: Seamless React integration with hooks and components
- **Animated**: Built-in animation system with Framer Motion
- **Testable**: Comprehensive testing utilities
- **Well Documented**: Extensive documentation and examples

## Installation

```bash
# Core package
npm install @stage-flow/core

# React integration
npm install @stage-flow/react

# Plugins (optional)
npm install @stage-flow/plugins
```

## Quick Start

```tsx
import { StageFlowEngine } from '@stage-flow/core';
import { StageFlowProvider, StageRenderer } from '@stage-flow/react';

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

// Use in React
function App() {
  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        stageComponents={{
          idle: IdleComponent,
          loading: LoadingComponent,
          success: SuccessComponent,
          error: ErrorComponent
        }}
      />
    </StageFlowProvider>
  );
}
```

## Documentation

- [Getting Started](https://stage-flow.dev/docs/guide/getting-started)
- [Core Concepts](https://stage-flow.dev/docs/guide/core-concepts)
- [API Reference](https://stage-flow.dev/docs/api/)
- [Examples](https://stage-flow.dev/docs/examples/basic/simple-counter)

## Packages

- **@stage-flow/core**: Framework-agnostic core engine
- **@stage-flow/react**: React integration with hooks and components
- **@stage-flow/plugins**: Built-in plugins for logging, persistence, and analytics
- **@stage-flow/testing**: Testing utilities and helpers

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2024 SimpleCORE Inc. 