# Core Concepts

Learn the fundamental concepts that power Stage Flow.

## Overview

Stage Flow is built around several core concepts that work together to provide a powerful state management solution:

- **Stages**: The different states your application can be in
- **Transitions**: How your application moves between stages
- **Data**: The information that flows through your application
- **Engine**: The core that manages everything
- **Configuration**: How you define your stage machine
- **Lifecycle**: The events that occur during stage changes
- **StageRenderer**: The component that automatically renders stages
- **StageFlowProvider**: The context provider that makes the engine available

## Stages

Stages represent the different states your application can be in. Each stage has a unique name and can contain specific data and behavior.

```tsx
type AppStage = 'loading' | 'form' | 'success' | 'error';

const config = {
  initial: 'loading' as const,
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
```

### Stage Properties

Each stage can have the following properties:

- **name**: Unique identifier for the stage
- **transitions**: Rules for moving to other stages
- **effect**: Optional effect to apply during transitions
- **data**: Optional initial data for the stage

## Transitions

Transitions define how your application moves from one stage to another. They are triggered by events and can include data transformation.

```tsx
{
  name: 'form',
  transitions: [
    {
      target: 'success',
      event: 'submit',
      condition: (context) => context.data?.email && context.data?.password
    },
    {
      target: 'error',
      event: 'fail'
    }
  ]
}
```

### Transition Properties

- **target**: The stage to transition to
- **event**: The event that triggers the transition
- **condition**: Optional condition that must be true for the transition
- **duration**: Optional duration for automatic transition
- **middleware**: Optional middleware specific to this transition

## Data

Data flows through your application and can be modified at each stage. Data is type-safe and can be accessed throughout your application.

```tsx
interface AppData {
  email?: string;
  password?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  error?: string;
}

// Data is automatically typed and validated
// Stage components receive data as props
function FormComponent({ data, send }) {
  // Access current data
  console.log(data?.email);

  // Send data with events
  send('submit', { email: 'user@example.com', password: 'secret' });
}
```

## Engine

The StageFlowEngine is the core component that manages your stage machine. It handles transitions, data management, and lifecycle events.

```tsx
import { StageFlowEngine } from '@stage-flow/core';

const engine = new StageFlowEngine(config, {
  plugins: [loggingPlugin],
  middleware: [validationMiddleware]
});

// Start the engine
await engine.start();

// Send events
await engine.send('submit', { email: 'user@example.com' });

// Get current state
console.log(engine.getCurrentStage()); // 'success'
console.log(engine.getCurrentData()); // { user: { email: 'user@example.com' } }
```

### Engine Configuration

The engine can be configured with:

- **plugins**: Extend functionality (logging, persistence, analytics)
- **middleware**: Process data and events

## StageFlowProvider

The StageFlowProvider is a React context provider that makes the engine available to all child components.

```tsx
import { StageFlowProvider } from '@stage-flow/react';

function App() {
  const engine = new StageFlowEngine(config);
  
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

## StageRenderer

The StageRenderer is the main component that automatically renders the appropriate stage component based on the current stage.

```tsx
import { StageRenderer } from '@stage-flow/react';

function App() {
  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        stageComponents={{
          loading: LoadingComponent,
          form: FormComponent,
          success: SuccessComponent,
          error: ErrorComponent
        }}
        // Optional props
        effects={{
          form: { type: 'fade', duration: 300 }
        }}
        fallbackComponent={DefaultComponent}
      />
    </StageFlowProvider>
  );
}
```

### StageRenderer Props

- **stageComponents**: Object mapping stage names to React components
- **effects**: Optional animation effects for stage transitions
- **fallbackComponent**: Component to render for undefined stages
- **engine**: Optional engine prop (if not using context)

## Stage Components

Stage components are React components that receive the current data and send function as props.

```tsx
function FormComponent({ data, send }) {
  const handleSubmit = (email: string, password: string) => {
    send('submit', { email, password });
  };
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleSubmit(
        formData.get('email') as string,
        formData.get('password') as string
      );
    }}>
      <input name="email" type="email" defaultValue={data?.email} />
      <input name="password" type="password" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Stage Component Props

- **data**: Current stage data
- **send**: Function to send events to the engine
- **currentStage**: Current stage name (optional)

## Configuration

Configuration defines your stage machine structure. It's type-safe and provides excellent developer experience.

```tsx
import { StageFlowConfig } from '@stage-flow/core';

const config: StageFlowConfig<AppStage, AppData> = {
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
```

### Configuration Properties

- **initial**: The starting stage
- **stages**: Array of stage definitions
- **plugins**: Global plugins for the engine
- **middleware**: Global middleware for the engine
- **effects**: Global effects for the engine

## Lifecycle

Stage Flow provides a rich lifecycle system that allows you to hook into different stages of your application's execution.

### Stage Lifecycle

```tsx
const config = {
  stages: [
    {
      name: 'form',
      transitions: [
        { target: 'success', event: 'submit' },
        { target: 'error', event: 'fail' }
      ]
    }
  ]
};
```

### Engine Lifecycle

```tsx
const engine = new StageFlowEngine(config);

// Subscribe to engine changes
const unsubscribe = engine.subscribe((stage, data) => {
  console.log(`Current stage: ${stage}`, data);
});

// Start the engine
await engine.start();

// Send events
await engine.send('submit', { email: 'user@example.com' });

// Clean up subscription
unsubscribe();
```

## Type Safety

Stage Flow provides comprehensive type safety throughout your application.

### Type Definitions

```tsx
// Define your types
type AppStage = 'loading' | 'form' | 'success' | 'error';
type AppEvent = 'ready' | 'submit' | 'fail' | 'reset' | 'retry';

interface AppData {
  email?: string;
  password?: string;
  user?: User;
  error?: string;
}

// Type-safe configuration
const config: StageFlowConfig<AppStage, AppData> = {
  // TypeScript will ensure all stages are defined
  initial: 'loading',
  stages: [
    // TypeScript will validate stage names
    { name: 'loading', transitions: [] },
    { name: 'form', transitions: [] },
    { name: 'success', transitions: [] },
    { name: 'error', transitions: [] }
  ]
};
```

### Type Inference

Stage Flow automatically infers types from your configuration:

```tsx
// Types are automatically inferred in stage components
function FormComponent({ data, send }: StageProps<AppStage, AppData>) {
  // TypeScript knows the current stage
  // TypeScript knows data has email and password
  console.log(data?.email, data?.password);

  // TypeScript validates event names
  send('submit', { email: 'user@example.com' }); // ✅ Valid
  send('invalid', {}); // ❌ TypeScript error
}
```

## Error Handling

Stage Flow provides robust error handling at multiple levels.

### Validation Errors

```tsx
const config = {
  stages: [
    {
      name: 'form',
      transitions: [
        {
          target: 'success',
          event: 'submit',
          condition: (context) => {
            if (!context.data?.email) {
              throw new Error('Email is required');
            }
            return true;
          }
        }
      ]
    }
  ]
};
```

### Error Recovery

```tsx
const engine = new StageFlowEngine(config);

try {
  await engine.send('submit', {});
} catch (error) {
  // Handle validation errors
  console.error('Validation failed:', error.message);
  
  // Transition to error stage
  await engine.send('fail', { error: error.message });
}
```

### Error Boundaries (React)

```tsx
import { StageErrorBoundary } from '@stage-flow/react';

function App() {
  return (
    <StageErrorBoundary
      fallback={(error) => (
        <div>
          <h2>Something went wrong</h2>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      )}
    >
      <StageFlowProvider engine={engine}>
        <StageRenderer stageComponents={stageComponents} />
      </StageFlowProvider>
    </StageErrorBoundary>
  );
}
```

## Performance

Stage Flow is optimized for performance with several built-in optimizations.

### Minimal Re-renders

```tsx
function FormComponent({ data, send }) {
  // Only re-renders when data changes
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      send('submit', { email: 'user@example.com' });
    }}>
      <input type="email" defaultValue={data?.email} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Lazy Loading

```tsx
const config = {
  stages: [
    {
      name: 'form',
      transitions: [
        {
          target: 'success',
          event: 'submit',
          condition: async (context) => {
            // Lazy load user data
            const user = await fetchUser(context.data?.email);
            context.data = { ...context.data, user };
            return true;
          }
        }
      ]
    }
  ]
};
```

### Memory Management

```tsx
const engine = new StageFlowEngine(config, {
  plugins: [
    new PersistencePlugin({
      key: 'app-state',
      storage: sessionStorage, // Use session storage for temporary data
      serialize: (data) => JSON.stringify(data),
      deserialize: (str) => JSON.parse(str)
    })
  ]
});
```

## Best Practices

### 1. Keep Stages Simple

```tsx
// ✅ Good: Simple, focused stages
const config = {
  stages: [
    { name: 'loading', transitions: [{ target: 'form', event: 'ready' }] },
    { name: 'form', transitions: [{ target: 'success', event: 'submit' }] },
    { name: 'success', transitions: [{ target: 'form', event: 'reset' }] }
  ]
};

// ❌ Avoid: Complex stages with many responsibilities
const config = {
  stages: [
    { 
      name: 'complex',
      transitions: [
        { target: 'success', event: 'submit' },
        { target: 'error', event: 'fail' },
        { target: 'loading', event: 'retry' },
        { target: 'form', event: 'back' }
      ]
    }
  ]
};
```

### 2. Use Type Safety

```tsx
// ✅ Good: Define types explicitly
type AppStage = 'loading' | 'form' | 'success' | 'error';
type AppData = { email?: string; user?: User; error?: string };

const config: StageFlowConfig<AppStage, AppData> = {
  // TypeScript will catch errors
};

// ❌ Avoid: Using any types
const config: any = {
  // No type safety
};
```

### 3. Handle Errors Gracefully

```tsx
// ✅ Good: Proper error handling
const config = {
  stages: [
    {
      name: 'form',
      transitions: [
        {
          target: 'success',
          event: 'submit',
          condition: (context) => {
            if (!context.data?.email || !context.data?.password) {
              throw new Error('Email and password are required');
            }
            return true;
          }
        },
        {
          target: 'error',
          event: 'fail'
        }
      ]
    }
  ]
};
```

### 4. Use Effects for Side Effects

```tsx
// ✅ Good: Use conditions for API calls
const config = {
  stages: [
    {
      name: 'form',
      transitions: [
        {
          target: 'loading',
          event: 'submit',
          condition: async (context) => {
            const user = await login(context.data?.email, context.data?.password);
            context.data = { ...context.data, user };
            return true;
          }
        }
      ]
    }
  ]
};
```

## Timers

Stage Flow provides built-in timer functionality for automatic transitions. Timers allow stages to automatically advance to the next stage after a specified duration.

### Automatic Transitions

Use the `after` property in transitions to create automatic transitions:

```tsx
const config = {
  stages: [
    {
      name: 'loading',
      transitions: [
        { target: 'success', event: 'complete' },
        { target: 'error', event: 'fail' },
        { target: 'error', after: 10000 } // Auto-timeout after 10 seconds
      ]
    },
    {
      name: 'success',
      transitions: [
        { target: 'form', event: 'reset' },
        { target: 'form', after: 5000 } // Auto-reset after 5 seconds
      ]
    }
  ]
};
```

### Timer Control

Stage Flow provides comprehensive timer control methods:

- **pauseTimers()**: Pause all timers for the current stage
- **resumeTimers()**: Resume paused timers for the current stage
- **resetTimers()**: Reset timers to their original duration
- **getTimerRemainingTime()**: Get remaining time in milliseconds
- **areTimersPaused()**: Check if timers are currently paused

### Timer State Management

Timers are managed internally by the StageFlowEngine and provide real-time state information:

```tsx
// Real-time timer monitoring in stage components
function LoadingComponent({ data, send, getTimerRemainingTime, areTimersPaused }) {
  const [remaining, setRemaining] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getTimerRemainingTime());
      setPaused(areTimersPaused());
    }, 100);
    
    return () => clearInterval(interval);
  }, [getTimerRemainingTime, areTimersPaused]);

  return (
    <div>
      <p>Loading... {remaining}ms {paused ? '(Paused)' : ''}</p>
    </div>
  );
}
```

### Timer Best Practices

1. **Use for Auto-advance**: Configure timers for automatic progression through stages
2. **Provide User Control**: Allow users to pause, resume, and reset timers
3. **Show Visual Feedback**: Display remaining time and pause status
4. **Handle Edge Cases**: Consider what happens when timers expire during user interaction
5. **Stage-specific Logic**: Only apply timer controls to stages that need them

## Next Steps

- [Basic Usage](/docs/guide/basic-usage) - See basic usage patterns
- [TypeScript Usage](/docs/guide/typescript-usage) - Advanced TypeScript features
- [React Integration](/docs/react/index) - React-specific features
- [Plugin System](/docs/guide/plugin-system) - Extend functionality with plugins
- [Middleware](/docs/guide/middleware) - Add processing layers
 