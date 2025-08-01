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
import { createTestEngine, renderWithStageFlow } from '@stage-flow/testing';

// Create test engine
const testEngine = createTestEngine({
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
test('should transition from idle to loading', () => {
  expect(testEngine.getCurrentStage()).toBe('idle');
  
  testEngine.send('start');
  
  expect(testEngine.getCurrentStage()).toBe('loading');
});

// Test React components
test('should render correct component for current stage', () => {
  const { getByText } = renderWithStageFlow(testEngine, {
    idle: () => <div>Idle</div>,
    loading: () => <div>Loading</div>
  });
  
  expect(getByText('Idle')).toBeInTheDocument();
});
```

## API Reference

### createTestEngine

Creates a test engine with mock implementations.

```tsx
const testEngine = createTestEngine(config);
```

### renderWithStageFlow

React Testing Library wrapper for testing Stage Flow components.

```tsx
const { getByText, send } = renderWithStageFlow(engine, stageComponents);
```

### Test Utilities

#### Mock Plugins

```tsx
import { createMockPlugin } from '@stage-flow/testing';

const mockPlugin = createMockPlugin({
  onStageChange: jest.fn(),
  onEvent: jest.fn()
});
```

#### Async Flow Testing

```tsx
import { waitForStage } from '@stage-flow/testing';

test('should handle async flow', async () => {
  const engine = createTestEngine(config);
  
  engine.send('start');
  
  await waitForStage(engine, 'loading');
  expect(engine.getCurrentStage()).toBe('loading');
  
  engine.send('complete');
  
  await waitForStage(engine, 'success');
  expect(engine.getCurrentStage()).toBe('success');
});
```

#### Event Testing

```tsx
import { createEventSpy } from '@stage-flow/testing';

test('should track events', () => {
  const eventSpy = createEventSpy();
  const engine = createTestEngine(config, [eventSpy]);
  
  engine.send('start');
  
  expect(eventSpy.events).toContainEqual({
    type: 'start',
    from: 'idle',
    to: 'loading'
  });
});
```

## Testing Patterns

### Unit Testing Engine

```tsx
test('engine should handle transitions correctly', () => {
  const engine = createTestEngine({
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
  
  engine.send('start');
  expect(engine.getCurrentStage()).toBe('loading');
  
  engine.send('complete');
  expect(engine.getCurrentStage()).toBe('success');
});
```

### Integration Testing

```tsx
test('should work with React components', () => {
  const TestComponent = () => {
    const { currentStage, send } = useStageFlow();
    
    return (
      <div>
        <span data-testid="stage">{currentStage}</span>
        <button onClick={() => send('start')}>Start</button>
      </div>
    );
  };
  
  const { getByTestId, getByText } = renderWithStageFlow(testEngine, {
    idle: TestComponent,
    loading: TestComponent
  });
  
  expect(getByTestId('stage')).toHaveTextContent('idle');
  
  fireEvent.click(getByText('Start'));
  
  expect(getByTestId('stage')).toHaveTextContent('loading');
});
```

## Documentation

- [Testing Guide](https://simplecore-inc.github.io/stage-flow/docs/guide/testing)
- [Testing API](https://simplecore-inc.github.io/stage-flow/docs/api/testing)
- [Testing Examples](https://simplecore-inc.github.io/stage-flow/docs/examples/testing)

## License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2024 SimpleCORE Inc. 