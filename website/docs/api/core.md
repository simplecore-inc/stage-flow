---
id: api-core
title: Core API
sidebar_label: Core API
---

# Core API

Core functionality and classes for Stage Flow.

## StageFlowEngine

The main engine class that manages stage machines.

```tsx
import { StageFlowEngine } from '@stage-flow/core';

class StageFlowEngine<TStage extends string, TData = unknown> {
  constructor(config: StageFlowConfig<TStage, TData>, validationOptions?: ValidationOptions);
  
  // State Management
  getCurrentStage(): TStage;
  getCurrentData(): TData | undefined;
  getCurrentStageEffect(): string | undefined;
  getStageEffect(stage: TStage): string | undefined;
  
  // Event Handling
  send(event: string, data?: TData): Promise<void>;
  goTo(stage: TStage, data?: TData): Promise<void>;
  setStageData(data: TData): void;
  
  // Subscription
  subscribe(callback: (stage: TStage, data?: TData) => void): () => void;
  
  // Plugin Management
  installPlugin(plugin: Plugin<TStage, TData>): Promise<void>;
  uninstallPlugin(name: string): Promise<void>;
  getInstalledPlugins(): string[];
  getPlugin(name: string): Plugin<TStage, TData> | undefined;
  getPluginState(name: string): Record<string, unknown> | undefined;
  setPluginState(name: string, state: Record<string, unknown>): void;
  
  // Middleware Management
  addMiddleware(middleware: Middleware<TStage, TData>): void;
  removeMiddleware(name: string): void;
  
  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
  reset(): Promise<void>;
  
  // Timer Control
  pauseTimers(): void;
  resumeTimers(): void;
  resetTimers(): void;
  getTimerRemainingTime(): number;
  areTimersPaused(): boolean;
}
```

## StageFlowConfig

Configuration interface for stage machines.

```tsx
interface StageFlowConfig<TStage extends string, TData = unknown> {
  /** Initial stage to start with */
  initial: TStage;
  
  /** Array of stage configurations */
  stages: StageConfig<TStage, TData>[];
  
  /** Optional effect configurations for stage transitions */
  effects?: Record<string, EffectConfig>;
  
  /** Optional plugins to install when the engine is created */
  plugins?: Plugin<TStage, TData>[];
  
  /** Optional middleware to register for intercepting transitions */
  middleware?: Middleware<TStage, TData>[];
  
  /** Optional persistence configuration for saving/restoring state */
  persistence?: PersistenceConfig<TStage, TData>;
}
```

## StageConfig

Configuration for individual stages.

```tsx
interface StageConfig<TStage extends string, TData = unknown> {
  /** Unique name/identifier for the stage */
  name: TStage;
  
  /** Array of possible transitions from this stage */
  transitions: Transition<TStage, TData>[];
  
  /** Optional effect to apply during transitions to/from this stage */
  effect?: string;
  
  /** Optional stage-specific data */
  data?: TData;
  
  // Note: Lifecycle hooks are not currently supported in the core API
}
```

## Transition

Configuration for stage transitions.

```tsx
interface Transition<TStage extends string, TData = unknown> {
  /** Target stage to transition to */
  target: TStage;
  
  /** Optional event that triggers this transition */
  event?: string;
  
  /** Optional condition that must be met for transition */
  condition?: (context: StageContext<TStage, TData>) => boolean | Promise<boolean>;
  
  /** Optional after in milliseconds for automatic transition */
  after?: number;
  
  /** Optional middleware specific to this transition */
  middleware?: Middleware<TStage, TData>[];
}
```

## EffectConfig

Configuration for visual effects during transitions.

```tsx
interface EffectConfig {
  /** Type of effect (fade, slide, scale, etc.) */
  type: string;
  
  /** Duration of the effect in milliseconds */
  duration?: number;
  
  /** Easing function for the effect */
  easing?: string;
  
  /** Delay before the effect starts in milliseconds */
  delay?: number;
  
  /** Additional effect-specific options */
  options?: Record<string, unknown>;
}
```

## Built-in Effect Types

```tsx
type BuiltInEffectType = 
  | 'fade'
  | 'slide'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scale'
  | 'scaleUp'
  | 'scaleDown'
  | 'flip'
  | 'flipX'
  | 'flipY'
  | 'zoom'
  | 'rotate'
  | 'none';
```

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

## Middleware Interface

Base interface for all middleware.

```tsx
interface Middleware<TStage extends string, TData = unknown> {
  /** Unique middleware name */
  name: string;
  
  /** Middleware execution function */
  execute: (
    context: TransitionContext<TStage, TData>,
    next: () => Promise<void>
  ) => Promise<void>;
}
```

## Context Interfaces

### StageContext

Context provided to stage lifecycle hooks.

```tsx
interface StageContext<TStage extends string, TData = unknown> {
  /** Current stage */
  current: TStage;
  
  /** Stage-specific data */
  data?: TData;
  
  /** Timestamp when context was created */
  timestamp: number;
  
  /** Method to send events */
  send: (event: string, data?: TData) => Promise<void>;
  
  /** Method to navigate directly to a stage */
  goTo: (stage: TStage, data?: TData) => Promise<void>;
}
```

### TransitionContext

Context provided to middleware and transition hooks.

```tsx
interface TransitionContext<TStage extends string, TData = unknown> {
  /** Source stage */
  from: TStage;
  
  /** Target stage */
  to: TStage;
  
  /** Optional event that triggered the transition */
  event?: string;
  
  /** Optional data associated with the transition */
  data?: TData;
  
  /** Timestamp when transition started */
  timestamp: number;
  
  /** Method to cancel the transition */
  cancel: () => void;
  
  /** Method to modify the transition */
  modify: (changes: Partial<{ to: TStage; data: TData }>) => void;
}
```

## PersistenceConfig

Configuration for state persistence.

```tsx
interface PersistenceConfig<TStage extends string, TData = unknown> {
  /** Whether persistence is enabled */
  enabled: boolean;
  
  /** Storage type to use */
  storage: 'localStorage' | 'sessionStorage' | 'custom';
  
  /** Storage key */
  key: string;
  
  /** Optional custom serializer */
  serializer?: {
    serialize: (state: { stage: TStage; data?: TData }) => string;
    deserialize: (serialized: string) => { stage: TStage; data?: TData };
  };
  
  /** Optional time-to-live in milliseconds */
  ttl?: number;
}
```

## Type Definitions

### StageHook

Type for stage lifecycle hooks (currently not supported in core API).

```tsx
type StageHook<TStage extends string, TData = unknown> = (
  context: StageContext<TStage, TData>
) => void | Promise<void>;
```

### CustomEffectDefinition

Interface for custom effect definitions.

```tsx
interface CustomEffectDefinition {
  /** Unique name for the effect */
  name: string;
  
  /** Effect configuration factory */
  create: (options?: Record<string, unknown>) => EffectConfig;
  
  /** Optional description */
  description?: string;
  
  /** Optional default options */
  defaultOptions?: Record<string, unknown>;
}
```

### EffectRegistry

Interface for the effect registry.

```tsx
interface EffectRegistry {
  /** Register a custom effect */
  register(effect: CustomEffectDefinition): void;
  
  /** Unregister a custom effect */
  unregister(name: string): void;
  
  /** Get a registered effect */
  get(name: string): CustomEffectDefinition | undefined;
  
  /** Get all registered effect names */
  getRegistered(): string[];
  
  /** Check if an effect is registered */
  has(name: string): boolean;
  
  /** Create an effect configuration */
  create(name: string, options?: Record<string, unknown>): EffectConfig | undefined;
}
```

## Error Types

### StageFlowError

Base error class for Stage Flow.

```tsx
class StageFlowError extends Error {
  constructor(message: string, code?: string);
  code?: string;
}
```

### ValidationError

Error thrown when validation fails.

```tsx
class ValidationError extends StageFlowError {
  constructor(message: string, field?: string);
  field?: string;
}
```

### TransitionError

Error thrown when a transition fails.

```tsx
class TransitionError extends StageFlowError {
  constructor(message: string, from?: string, to?: string);
  from?: string;
  to?: string;
}
```

### ConfigurationError

Error thrown when configuration is invalid.

```tsx
class ConfigurationError extends StageFlowError {
  constructor(message: string, config?: unknown);
  config?: unknown;
}
```

### PluginError

Error thrown when plugin operations fail.

```tsx
class PluginError extends StageFlowError {
  constructor(message: string, pluginName?: string);
  pluginName?: string;
}
```

### MiddlewareError

Error thrown when middleware operations fail.

```tsx
class MiddlewareError extends StageFlowError {
  constructor(message: string, middlewareName?: string);
  middlewareName?: string;
}
```

## Usage Examples

### Basic Engine Setup

```tsx
import { StageFlowEngine } from '@stage-flow/core';

type AppStages = 'idle' | 'loading' | 'success' | 'error';
interface AppData {
  username?: string;
  error?: string;
}

const config: StageFlowConfig<AppStages, AppData> = {
  initial: 'idle',
  stages: [
    {
      name: 'idle',
      transitions: [
        { target: 'loading', event: 'start' },
        { target: 'error', event: 'error' }
      ]
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
};

const engine = new StageFlowEngine(config);
await engine.start();
```

### Event Handling

```tsx
// Subscribe to stage changes
const unsubscribe = engine.subscribe((stage, data) => {
  console.log('Stage changed:', stage, data);
});

// Send events
await engine.send('start', { username: 'john' });
await engine.send('complete');
await engine.send('reset');

// Direct navigation
await engine.goTo('error', { error: 'Something went wrong' });
await engine.goTo('success', { username: 'john' });

// Update data without stage transition
engine.setStageData({ 
  ...engine.getCurrentData(), 
  name: 'John Doe',
  email: 'john@example.com' 
});

// Clean up subscription
unsubscribe();
```

### Plugin Integration

```tsx
import { LoggingPlugin } from '@stage-flow/plugins';

const engine = new StageFlowEngine(config, {
  plugins: [
    new LoggingPlugin({ level: 'info' })
  ]
});

await engine.start();
```

### Middleware Usage

```tsx
const engine = new StageFlowEngine(config, {
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
});
```

### Timer Control

```tsx
// Configure stages with automatic transitions
const config: StageFlowConfig<AppStages, AppData> = {
  initial: 'idle',
  stages: [
    {
      name: 'idle',
      transitions: [
        { target: 'loading', event: 'start' },
        { target: 'error', event: 'error' }
      ]
    },
    {
      name: 'loading',
      transitions: [
        { target: 'success', event: 'complete' },
        { target: 'error', event: 'error' },
        { target: 'success', after: 5000 } // Auto-advance after 5 seconds
      ]
    },
    {
      name: 'success',
      transitions: [
        { target: 'idle', event: 'reset' },
        { target: 'idle', after: 3000 } // Auto-reset after 3 seconds
      ]
    },
    {
      name: 'error',
      transitions: [{ target: 'idle', event: 'retry' }]
    }
  ]
};

const engine = new StageFlowEngine(config);
await engine.start();

// Timer control methods
engine.pauseTimers(); // Pause all timers for current stage
engine.resumeTimers(); // Resume paused timers for current stage
engine.resetTimers(); // Reset timers to original duration

// Timer state queries
const remainingTime = engine.getTimerRemainingTime(); // Get remaining time in milliseconds
const isPaused = engine.areTimersPaused(); // Check if timers are paused

// Real-time timer monitoring
setInterval(() => {
  const remaining = engine.getTimerRemainingTime();
  const paused = engine.areTimersPaused();
  console.log(`Timer: ${remaining}ms remaining, Paused: ${paused}`);
}, 100);
```

## Method Details

### send(event, data?)

Sends an event to trigger a stage transition.

**Parameters:**
- `event` (string): The event name to send
- `data?` (TData): Optional data to associate with the transition

**Returns:** void

**Throws:** TransitionError when the engine is not started or a transition is in progress

**Example:**
```tsx
await engine.send('submit', { formData: { name: 'John' } });
```

### goTo(stage, data?)

Directly navigates to a specific stage.

**Parameters:**
- `stage` (TStage): The target stage to navigate to
- `data?` (TData): Optional data to associate with the transition

**Returns:** Promise&lt;void&gt;

**Throws:** TransitionError when the engine is not started, a transition is in progress, or no valid transition path exists

**Example:**
```tsx
await engine.goTo('error', { message: 'Something went wrong' });
```

### setStageData(data)

Updates the current stage data without triggering a stage transition.

This method allows you to update the data associated with the current stage without changing stages or triggering any transition logic. It's useful for updating form data, user input, or other state that doesn't require a stage change.

**Parameters:**
- `data` (TData): The new data to set for the current stage

**Returns:** void

**Throws:** TransitionError when the engine is not started or a transition is in progress

**Example:**
```tsx
// Update form data without changing stages
engine.setStageData({ 
  ...engine.getCurrentData(), 
  name: 'John Doe',
  email: 'john@example.com' 
});

// Update validation errors
engine.setStageData({ 
  ...engine.getCurrentData(), 
  errors: { email: 'Invalid email format' } 
});
```

**Key Benefits:**
- **Performance**: No unnecessary stage transitions for data updates
- **Reactive UI**: Changes are immediately reflected in components
- **Validation integration**: Error states can be updated instantly
- **Type safety**: Ensures data consistency with current stage