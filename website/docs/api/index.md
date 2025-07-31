---
id: api-index
title: API Reference
sidebar_label: Overview
---

# API Reference

Complete API documentation for Stage Flow.

## Overview

Stage Flow provides a comprehensive API for building state machines and managing application flow. The API is organized into several key areas:

- **Core API**: Main engine and configuration interfaces
- **React API**: React components and hooks for integration
- **Plugins API**: Plugin system for extending functionality
- **Testing API**: Testing utilities and helpers

## Quick Start

```tsx
import { StageFlowEngine } from '@stage-flow/core';
import { StageFlowProvider } from '@stage-flow/react';

// Create engine configuration
const config = {
  initial: 'idle',
  stages: [
    {
      name: 'idle',
      transitions: [{ target: 'loading', event: 'start' }]
    },
    {
      name: 'loading',
      transitions: [{ target: 'success', event: 'complete' }]
    },
    {
      name: 'success',
      transitions: [{ target: 'idle', event: 'reset' }]
    }
  ]
};

// Create engine
const engine = new StageFlowEngine(config);

// Use in React
function App() {
  return (
    <StageFlowProvider engine={engine}>
      <YourApp />
    </StageFlowProvider>
  );
}
```

## API Sections

### [Core API](./core.md)
Core functionality including `StageFlowEngine`, configuration interfaces, middleware, effects, and error types.

### [React API](./react.md)
React components and hooks for integrating Stage Flow with React applications.

### [Plugins API](./plugins.md)
Plugin system for extending Stage Flow with logging, persistence, analytics, and custom functionality.

### [Testing API](./testing.md)
Testing utilities for unit testing, integration testing, and React component testing.

## Configuration Examples

### Basic Configuration

```tsx
const config: StageFlowConfig<'idle' | 'loading' | 'success', { email?: string }> = {
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
        { target: 'idle', event: 'cancel' }
      ]
    },
    {
      name: 'success',
      transitions: [{ target: 'idle', event: 'reset' }]
    }
  ]
};
```

### Advanced Configuration

```tsx
const config: StageFlowConfig<AppStage, AppData> = {
  initial: 'idle',
  stages: [
    {
      name: 'idle',
      transitions: [
        {
          target: 'loading',
          event: 'start',
          condition: (context) => context.data?.email && context.data?.password,
          middleware: [
            {
              name: 'validation',
              execute: async (context, next) => {
                if (!context.data?.email) {
                  throw new Error('Email required');
                }
                await next();
              }
            }
          ]
        }
      ],
      // Note: Lifecycle hooks are not currently supported
    }
  ],
  effects: {
    fadeIn: { type: 'fade', duration: 300, easing: 'easeInOut' },
    slideIn: { type: 'slide', duration: 400, easing: 'easeOut' }
  },
  plugins: [
    new LoggingPlugin({ level: LogLevel.INFO }),
    new PersistencePlugin({ key: 'app-state', storage: localStorage })
  ],
  middleware: [
    {
      name: 'logger',
      execute: async (context, next) => {
        console.log(`Transition: ${context.from} -> ${context.to}`);
        await next();
        console.log('Transition completed');
      }
    }
  ]
};
```

## Migration Guide

### From XState

```tsx
// XState
const machine = createMachine({
  initial: 'idle',
  states: {
    idle: {
      on: { START: 'loading' }
    },
    loading: {
      on: { COMPLETE: 'success', CANCEL: 'idle' }
    },
    success: {
      on: { RESET: 'idle' }
    }
  }
});

// Stage Flow
const config: StageFlowConfig<'idle' | 'loading' | 'success'> = {
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
        { target: 'idle', event: 'cancel' }
      ]
    },
    {
      name: 'success',
      transitions: [{ target: 'idle', event: 'reset' }]
    }
  ]
};
```

### From Redux

```tsx
// Redux
const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'START_LOADING':
      return { ...state, stage: 'loading' };
    case 'LOADING_SUCCESS':
      return { ...state, stage: 'success', data: action.payload };
    case 'LOADING_ERROR':
      return { ...state, stage: 'error', error: action.payload };
    default:
      return state;
  }
};

// Stage Flow
const config: StageFlowConfig<'idle' | 'loading' | 'success' | 'error'> = {
  initial: 'idle',
  stages: [
    {
      name: 'idle',
      transitions: [{ target: 'loading', event: 'start' }]
    },
    {
      name: 'loading',
      transitions: [
        { target: 'success', event: 'success' },
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
};
```

## Type Safety

Stage Flow provides full TypeScript support with generic types:

```tsx
// Define your stage types
type AppStages = 'idle' | 'loading' | 'success' | 'error';

// Define your data types
interface AppData {
  username?: string;
  error?: string;
  result?: any;
}

// Create type-safe configuration
const config: StageFlowConfig<AppStages, AppData> = {
  initial: 'idle',
  stages: [
    {
      name: 'idle',
      transitions: [{ target: 'loading', event: 'start' }]
    }
  ]
};

// Create type-safe engine
const engine = new StageFlowEngine<AppStages, AppData>(config);

// Type-safe event sending
await engine.send('start', { username: 'john' });

// Type-safe direct navigation
await engine.goTo('success', { result: 'completed' });
```

## Error Handling

Stage Flow provides comprehensive error handling:

```tsx
import { 
  StageFlowError, 
  ValidationError, 
  TransitionError,
  ConfigurationError,
  PluginError,
  MiddlewareError
} from '@stage-flow/core';

try {
  await engine.send('invalid-event');
} catch (error) {
  if (error instanceof TransitionError) {
    console.error('Transition failed:', error.from, error.to);
  } else if (error instanceof ValidationError) {
    console.error('Validation failed:', error.field);
  }
}
``` 