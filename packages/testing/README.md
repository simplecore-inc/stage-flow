# @stage-flow/testing

Testing utilities and helpers for stage flow library.

[![npm version](https://img.shields.io/npm/v/@stage-flow/testing.svg)](https://www.npmjs.com/package/@stage-flow/testing)
[![npm downloads](https://img.shields.io/npm/dm/@stage-flow/testing.svg)](https://www.npmjs.com/package/@stage-flow/testing)
[![License](https://img.shields.io/npm/l/@stage-flow/testing.svg)](https://github.com/simplecore-inc/stage-flow/blob/main/LICENSE)

## Installation

```bash
npm install @stage-flow/testing @stage-flow/core --save-dev
```

## Quick Start

```tsx
import { StageFlowEngine } from '@stage-flow/core';
import { StageFlowTestEngine, renderStageFlow } from '@stage-flow/testing';

// Create test engine
const testEngine = StageFlowTestEngine.create({
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
  ]
});

// Test stage transitions
test('should transition from idle to loading', async () => {
  expect(testEngine.getCurrentStage()).toBe('idle');
  
  await testEngine.send('start');
  
  expect(testEngine.getCurrentStage()).toBe('loading');
});

// Test React components
test('should render correct component for current stage', () => {
  const { getByText, engine } = renderStageFlow(
    {
      initial: 'idle',
      stages: [
        {
          name: 'idle',
          transitions: [{ target: 'loading', event: 'start' }]
        },
        {
          name: 'loading',
          transitions: [{ target: 'success', event: 'complete' }]
        }
      ]
    },
    <div>Test Component</div>
  );
  
  expect(getByText('Test Component')).toBeInTheDocument();
  expect(engine.getCurrentStage()).toBe('idle');
});
```

## API Reference

### StageFlowTestEngine

Enhanced stage flow engine for testing with time control and state inspection.

```tsx
const testEngine = StageFlowTestEngine.create(config, options);
```

#### Creation

```tsx
// Create with default options
const engine = StageFlowTestEngine.create(config);

// Create with custom options
const engine = StageFlowTestEngine.create(config, {
  autoStart: true,
  initialTime: 0,
  debug: false
});
```

#### Time Control

```tsx
// Enable time control
engine.enableTimeControl();

// Advance time by milliseconds
engine.advanceTime(1000);

// Advance to next scheduled timer
engine.advanceToNextTimer();

// Get current mock time
const time = engine.getCurrentTime();

// Get pending timers
const timers = engine.getPendingTimers();
```

#### State Inspection

```tsx
// Get current stage
const stage = engine.getCurrentStage();

// Get current data
const data = engine.getCurrentData();

// Check if transitioning
const isTransitioning = engine.isTransitioning();

// Get full state
const state = engine.getState();

// Get transition history
const history = engine.getHistory();

// Get installed plugins
const plugins = engine.getInstalledPlugins();

// Get registered middleware
const middleware = engine.getRegisteredMiddleware();
```

#### Waiting Utilities

```tsx
// Wait for transition to complete
await engine.waitForTransition();

// Wait for specific stage
await engine.waitForStage('success', 5000);

// Reset engine to initial state
await engine.reset();
```

### renderStageFlow

React Testing Library wrapper for testing Stage Flow components.

```tsx
const { 
  getByText, 
  engine, 
  advanceTime, 
  waitForStage,
  getCurrentStage 
} = renderStageFlow(config, ui, options);
```

#### Options

```tsx
const options = {
  engineOptions: {
    autoStart: true,
    initialTime: 0,
    debug: false
  },
  enableTimeControl: true,
  wrapper: CustomWrapper
};
```

#### Extended Render Result

```tsx
interface StageFlowRenderResult {
  // Standard Testing Library methods
  getByText: (text: string) => HTMLElement;
  getByTestId: (testId: string) => HTMLElement;
  // ... other Testing Library methods
  
  // Stage Flow specific methods
  engine: StageFlowTestEngine;
  advanceTime: (ms: number) => void;
  advanceToNextTimer: () => boolean;
  waitForStage: (stage: string, timeout?: number) => Promise<void>;
  waitForTransition: () => Promise<void>;
  getCurrentStage: () => string;
  getCurrentData: () => unknown;
  isTransitioning: () => boolean;
  getState: () => any;
  reset: () => Promise<void>;
}
```

### Mock Utilities

#### createMockPlugin

Creates a mock plugin for testing.

```tsx
import { createMockPlugin } from '@stage-flow/testing';

const mockPlugin = createMockPlugin({
  name: 'test-plugin',
  version: '1.0.0',
  hooks: {
    beforeTransition: vi.fn(),
    afterTransition: vi.fn(),
    onStageEnter: vi.fn(),
    onStageExit: vi.fn()
  },
  install: vi.fn(),
  uninstall: vi.fn(),
  state: {}
});
```

#### createMockMiddleware

Creates a mock middleware for testing.

```tsx
import { createMockMiddleware } from '@stage-flow/testing';

const mockMiddleware = createMockMiddleware({
  name: 'test-middleware',
  execute: vi.fn(),
  shouldCancel: false,
  shouldModify: undefined,
  delay: 0,
  throwError: undefined
});
```

#### createSpyPlugin

Creates a spy plugin that tracks all calls.

```tsx
import { createSpyPlugin } from '@stage-flow/testing';

const spyPlugin = createSpyPlugin('spy-plugin');

// Access call history
console.log(spyPlugin.calls.install);
console.log(spyPlugin.calls.beforeTransition);
```

#### createSpyMiddleware

Creates a spy middleware that tracks all calls.

```tsx
import { createSpyMiddleware } from '@stage-flow/testing';

const spyMiddleware = createSpyMiddleware('spy-middleware');

// Access call history
console.log(spyMiddleware.calls);
```

#### createAsyncPlugin

Creates a plugin with configurable delays.

```tsx
import { createAsyncPlugin } from '@stage-flow/testing';

const asyncPlugin = createAsyncPlugin('async-plugin', {
  install: 100,
  beforeTransition: 50,
  afterTransition: 50
});
```

#### createAsyncMiddleware

Creates middleware with configurable delay.

```tsx
import { createAsyncMiddleware } from '@stage-flow/testing';

const asyncMiddleware = createAsyncMiddleware('async-middleware', 100);
```

#### createErrorPlugin

Creates a plugin that throws errors.

```tsx
import { createErrorPlugin } from '@stage-flow/testing';

const errorPlugin = createErrorPlugin('error-plugin', {
  install: new Error('Install failed'),
  beforeTransition: new Error('Transition failed')
});
```

#### createErrorMiddleware

Creates middleware that throws errors.

```tsx
import { createErrorMiddleware } from '@stage-flow/testing';

const errorMiddleware = createErrorMiddleware('error-middleware', new Error('Middleware failed'));
```

### Utility Functions

#### waitForCalls

Waits for a mock function to be called a specific number of times.

```tsx
import { waitForCalls } from '@stage-flow/testing';

await waitForCalls(mockFn, 3, 1000);
```

#### resetPluginMocks

Resets all mocks in a plugin.

```tsx
import { resetPluginMocks } from '@stage-flow/testing';

resetPluginMocks(mockPlugin);
```

#### resetMiddlewareMocks

Resets all mocks in middleware.

```tsx
import { resetMiddlewareMocks } from '@stage-flow/testing';

resetMiddlewareMocks(mockMiddleware);
```

### React Testing Utilities

#### createMockStageComponent

Creates a mock stage component for testing.

```tsx
import { createMockStageComponent } from '@stage-flow/testing';

const MockStage = createMockStageComponent('mock-stage');
```

#### createTestProvider

Creates a test provider component.

```tsx
import { createTestProvider } from '@stage-flow/testing';

const TestProvider = createTestProvider(engine);
```

#### createStageFlowTestSetup

Creates a complete test setup.

```tsx
import { createStageFlowTestSetup } from '@stage-flow/testing';

const testSetup = createStageFlowTestSetup(config, options);

const { render, engine, Provider, MockStageComponent } = testSetup;
```

#### waitForReactUpdate

Waits for React to update.

```tsx
import { waitForReactUpdate } from '@stage-flow/testing';

await waitForReactUpdate();
```

#### StageFlowTestInteractions

Provides fluent API for test interactions.

```tsx
import { createStageFlowInteractions } from '@stage-flow/testing';

const interactions = createStageFlowInteractions(engine);

await interactions
  .sendEvent('start')
  .passTime(1000)
  .waitForAutoTransition()
  .goToStage('success');
```

### Custom Matchers

```tsx
import { stageFlowMatchers } from '@stage-flow/testing';

expect.extend(stageFlowMatchers);

// Use custom matchers
expect(engine).toBeInStage('idle');
expect(engine).toHaveTransitioned('idle', 'loading');
expect(engine).toBeTransitioning();
```

## Testing Patterns

### Unit Testing Engine

```tsx
test('engine should handle transitions correctly', async () => {
  const engine = StageFlowTestEngine.create({
    initial: 'idle',
    stages: [
      {
        name: 'idle',
        transitions: [{ target: 'loading', event: 'start' }]
      },
      {
        name: 'loading',
        transitions: [{ target: 'success', event: 'complete' }]
      }
    ]
  });
  
  expect(engine.getCurrentStage()).toBe('idle');
  
  await engine.send('start');
  expect(engine.getCurrentStage()).toBe('loading');
  
  await engine.send('complete');
  expect(engine.getCurrentStage()).toBe('success');
});
```

### Integration Testing

```tsx
test('should work with React components', async () => {
  const TestComponent = () => {
    const { currentStage, send } = useStageFlow();
    
    return (
      <div>
        <span data-testid="stage">{currentStage}</span>
        <button onClick={() => send('start')}>Start</button>
      </div>
    );
  };
  
  const { getByTestId, getByText, engine } = renderStageFlow(
    config,
    <TestComponent />
  );
  
  expect(getByTestId('stage')).toHaveTextContent('idle');
  
  fireEvent.click(getByText('Start'));
  
  await engine.waitForStage('loading');
  expect(getByTestId('stage')).toHaveTextContent('loading');
});
```

### Time-Based Testing

```tsx
test('should handle time-based transitions', async () => {
  const engine = StageFlowTestEngine.create({
    initial: 'idle',
    stages: [
      {
        name: 'idle',
        transitions: [{ target: 'loading', after: 2000 }]
      }
    ]
  });
  
  expect(engine.getCurrentStage()).toBe('idle');
  
  // Advance time to trigger transition
  engine.advanceTime(2000);
  
  await engine.waitForStage('loading');
  expect(engine.getCurrentStage()).toBe('loading');
});
```

## Documentation

- [Testing Guide](https://simplecore-inc.github.io/stage-flow/docs/guide/testing)
- [Testing API](https://simplecore-inc.github.io/stage-flow/docs/api/testing)
- [Testing Examples](https://simplecore-inc.github.io/stage-flow/docs/examples/testing)

## License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2024 SimpleCORE Inc. 