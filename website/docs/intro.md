---
id: intro
title: Introduction
sidebar_label: Introduction
---

# Stage Flow

A powerful, type-safe stage management library for React applications.

## What is Stage Flow?

Stage Flow helps you manage complex application states with ease. Whether you're building user onboarding flows, multi-step forms, or game states, Stage Flow provides the tools you need with full TypeScript support.

## Key Features

- **Type-Safe**: Full TypeScript support with compile-time error checking
- **Performant**: Lightweight and optimized for React applications
- **Extensible**: Plugin system for custom functionality
- **Middleware**: Intercept and modify transitions
- **Effects**: Built-in animation effects system
- **Testable**: Comprehensive testing utilities
- **React Ready**: First-class React integration with automatic stage rendering

## Quick Start

```bash
npm install @stage-flow/core @stage-flow/react
```

```tsx
import { StageFlowEngine } from '@stage-flow/core';
import { StageFlowProvider, StageRenderer } from '@stage-flow/react';

type AppStage = 'loading' | 'form' | 'success' | 'error';
type AppData = { email?: string; error?: string };

const config = {
  initial: 'loading',
  stages: [
    {
      name: 'loading',
      transitions: [{ target: 'form', event: 'ready' }]
    },
    {
      name: 'form',
      transitions: [
        { target: 'success', event: 'submit' },
        { target: 'error', event: 'fail' }
      ]
    },
    {
      name: 'success',
      transitions: [{ target: 'form', event: 'reset' }]
    },
    {
      name: 'error',
      transitions: [{ target: 'form', event: 'retry' }]
    }
  ]
};

// Stage components
function LoadingComponent({ data, send }) {
  return (
    <div>
      <p>Loading...</p>
      <button onClick={() => send('ready')}>Start</button>
    </div>
  );
}

function FormComponent({ data, send }) {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      send('submit', { email: formData.get('email') as string });
    }}>
      <input name="email" type="email" placeholder="Email" />
      <button type="submit">Submit</button>
    </form>
  );
}

function SuccessComponent({ data, send }) {
  return (
    <div>
      <h2>Success!</h2>
      <p>Email: {data?.email}</p>
      <button onClick={() => send('reset')}>Reset</button>
    </div>
  );
}

function ErrorComponent({ data, send }) {
  return (
    <div>
      <h2>Error</h2>
      <p>{data?.error}</p>
      <button onClick={() => send('retry')}>Retry</button>
    </div>
  );
}

function App() {
  const engine = new StageFlowEngine<AppStage, AppData>(config);
  
  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        stageComponents={{
          loading: LoadingComponent,
          form: FormComponent,
          success: SuccessComponent,
          error: ErrorComponent
        }}
      />
    </StageFlowProvider>
  );
}
```

## Why Stage Flow?

### Traditional State Management Problems

- **Complex State Logic**: Managing multiple states and transitions becomes messy
- **Type Safety**: No compile-time guarantees for state transitions
- **Testing Difficulty**: Hard to test complex state flows
- **Code Duplication**: Similar patterns repeated across components
- **Manual Rendering**: Conditional rendering logic scattered throughout components

### Stage Flow Solutions

- **Declarative Configuration**: Define states and transitions clearly
- **Type Safety**: Compile-time validation of all transitions
- **Testable**: Built-in testing utilities for state flows
- **Reusable**: Share state logic across components
- **Extensible**: Plugin system for custom functionality
- **Automatic Rendering**: StageRenderer automatically renders the correct component

## Architecture

Stage Flow is built around four core concepts:

1. **Stages**: The different states your application can be in
2. **Transitions**: How you move between stages
3. **Data**: The information that flows through your stages
4. **Stage Components**: React components that render for each stage

This simple but powerful model makes it easy to reason about your application's state and build complex flows with confidence. The `StageRenderer` automatically handles which component to render based on the current stage, eliminating the need for complex conditional rendering logic.
