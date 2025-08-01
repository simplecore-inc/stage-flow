# React Integration

Stage Flow provides seamless React integration through a comprehensive set of hooks, components, and utilities that make complex state management simple and predictable.

## Overview

Stage Flow's React integration transforms your application state management from imperative to declarative. Instead of manually managing state transitions with `useState` and `useEffect`, Stage Flow gives you a declarative way to define your application's behavior.

### Why Use Stage Flow with React?

- **Declarative State Management**: Define your app's states and transitions in one place
- **Type Safety**: Full TypeScript support with compile-time error checking
- **Predictable Behavior**: Clear rules for when and how state changes occur
- **Reusable Logic**: Share state logic across components
- **Better Testing**: Easy to test state transitions and user flows
- **Smooth Animations**: Built-in animation support with Framer Motion
- **Error Handling**: Comprehensive error boundaries and recovery

## Quick Start

```tsx
import { StageFlowProvider, StageRenderer, useStageFlow } from '@stage-flow/react';
import { StageFlowEngine } from '@stage-flow/core';

// Define your stages and data
type AppStage = 'idle' | 'loading' | 'success' | 'error';
type AppData = { email?: string; user?: User; error?: string };

// Create your engine
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
        { target: 'error', event: 'fail' }
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

// Use in your app
function App() {
  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        stageComponents={{
          idle: IdleView,
          loading: LoadingView,
          success: SuccessView,
          error: ErrorView
        }}
        disableAnimations={false}
        style={{ minHeight: "400px" }}
      />
    </StageFlowProvider>
  );
}

// Stage components receive props from StageRenderer
function IdleView({ stage, data, send, goTo, isTransitioning }) {
  const handleStart = () => {
    send('start');
  };
  
  return (
    <div>
      <h1>Welcome</h1>
      <button onClick={handleStart} disabled={isTransitioning}>
        {isTransitioning ? 'Starting...' : 'Start'}
      </button>
    </div>
  );
}

function LoadingView({ stage, data, send, goTo, isTransitioning }) {
  return (
    <div>
      <h1>Loading...</h1>
      <div className="spinner" />
    </div>
  );
}

function SuccessView({ stage, data, send, goTo, isTransitioning }) {
  const handleReset = () => {
    send('reset');
  };
  
  return (
    <div>
      <h1>Success!</h1>
      <p>Welcome, {data.user?.name}!</p>
      <button onClick={handleReset}>Reset</button>
    </div>
  );
}

function ErrorView({ stage, data, send, goTo, isTransitioning }) {
  const handleRetry = () => {
    send('retry');
  };
  
  return (
    <div>
      <h1>Error</h1>
      <p>{data.error}</p>
      <button onClick={handleRetry}>Try Again</button>
    </div>
  );
}
```

## Core Concepts

### Components
- **[StageFlowProvider](./components.md#stageflowprovider)** - Main provider component
- **[StageRenderer](./components.md#stagerenderer)** - Automatic stage-based rendering
- **[StageAnimation](./components.md#stageanimation)** - Smooth transitions with Framer Motion
- **[StageErrorBoundary](./components.md#stageerrorboundary)** - Error handling

### Hooks
- **[useStageFlow](./hooks.md#usestageflow)** - Main hook for stage machine interaction
- **[useStageData](./hooks.md#usestagedata)** - Read-only access to stage data
- **[useStageEffect](./hooks.md#usestageeffect)** - Animation effect configuration

### Advanced Patterns
- **[Custom Hooks](./patterns.md)** - Reusable logic encapsulation
- **[Context Providers](./patterns.md)** - Complex state sharing
- **[Higher-Order Components](./patterns.md)** - Component composition

### Performance & Integration
- **[Performance Optimization](./performance.md)** - Memoization and lazy loading
- **[Library Integration](./integration.md)** - React Router, Redux, and more
- **[Best Practices](./best-practices.md)** - Maintainable code patterns

## What's Next?

- **[Components](./components.md)** - Learn about React components
- **[Hooks](./hooks.md)** - Explore React hooks
- **[Patterns](./patterns.md)** - Discover advanced patterns
- **[Performance](./performance.md)** - Optimize your applications
- **[Integration](./integration.md)** - Integrate with other libraries
- **[Best Practices](./best-practices.md)** - Follow best practices

## Related Guides

- **[Getting Started](/docs/guide/getting-started)** - Set up your first Stage Flow project
- **[Core Concepts](/docs/guide/core-concepts)** - Learn the fundamental concepts
- **[Basic Usage](/docs/guide/basic-usage)** - See basic usage patterns
- **[TypeScript Usage](/docs/guide/typescript-usage)** - Advanced TypeScript features
- **[Plugin System](/docs/guide/plugin-system)** - Extend functionality with plugins
- **[Middleware](/docs/guide/middleware)** - Add processing layers

- **[Testing](/docs/guide/testing)** - Test your stage machines 