---
id: api-testing
title: Testing API
sidebar_label: Testing API
---

# Testing API

Testing utilities and helpers for Stage Flow applications.

## Test Engine

```tsx
import { StageFlowTestEngine } from '@stage-flow/testing';

interface TestEngineOptions {
  /** Whether to enable strict validation during tests */
  strictValidation?: boolean;
  /** Custom validation options */
  validationOptions?: ValidationOptions;
  /** Whether to enable development warnings */
  developmentWarnings?: boolean;
  /** Custom error handler for tests */
  onError?: (error: Error) => void;
}

class StageFlowTestEngine<TStage extends string, TData = unknown> extends StageFlowEngine<TStage, TData> {
  constructor(config: StageFlowConfig<TStage, TData>, options?: TestEngineOptions);
  
  /** Get test-specific utilities */
  test: {
    /** Wait for a specific stage */
    waitForStage: (stage: TStage, timeout?: number) => Promise<void>;
    /** Wait for a specific event to be sent */
    waitForEvent: (event: string, timeout?: number) => Promise<void>;
    /** Get all stage transitions that occurred */
    getTransitions: () => Array<{ from: TStage; to: TStage; event?: string; timestamp: number }>;
    /** Clear transition history */
    clearTransitions: () => void;
    /** Mock a plugin */
    mockPlugin: (name: string, mock: Partial<Plugin<TStage, TData>>) => void;
    /** Restore original plugin */
    restorePlugin: (name: string) => void;
  };
}
```

## Mock Utilities

```tsx
import { 
  createMockPlugin,
  createMockMiddleware,
  createSpyPlugin,
  createSpyMiddleware,
  createAsyncPlugin,
  createAsyncMiddleware,
  createErrorPlugin,
  createErrorMiddleware,
  waitForCalls,
  resetPluginMocks,
  resetMiddlewareMocks
} from '@stage-flow/testing';

interface MockPluginConfig {
  /** Plugin name */
  name: string;
  /** Whether to track calls */
  trackCalls?: boolean;
  /** Custom install behavior */
  install?: (engine: StageFlowEngine<any, any>) => void | Promise<void>;
  /** Custom uninstall behavior */
  uninstall?: (engine: StageFlowEngine<any, any>) => void | Promise<void>;
  /** Custom hooks */
  hooks?: Partial<Plugin<any, any>['hooks']>;
  /** Custom state */
  state?: Record<string, unknown>;
}

interface MockMiddlewareConfig {
  /** Middleware name */
  name: string;
  /** Whether to track calls */
  trackCalls?: boolean;
  /** Custom execute behavior */
  execute?: (context: TransitionContext<any, any>, next: () => Promise<void>) => Promise<void>;
}

/** Create a mock plugin */
function createMockPlugin(config: MockPluginConfig): Plugin<any, any>;

/** Create a mock middleware */
function createMockMiddleware(config: MockMiddlewareConfig): Middleware<any, any>;

/** Create a spy plugin that tracks all calls */
function createSpyPlugin(name: string): Plugin<any, any> & {
  calls: Array<{ method: string; args: unknown[]; timestamp: number }>;
  reset: () => void;
};

/** Create a spy middleware that tracks all calls */
function createSpyMiddleware(name: string): Middleware<any, any> & {
  calls: Array<{ context: TransitionContext<any, any>; timestamp: number }>;
  reset: () => void;
};

/** Create an async plugin with delays */
function createAsyncPlugin(name: string, delay?: number): Plugin<any, any>;

/** Create an async middleware with delays */
function createAsyncMiddleware(name: string, delay?: number): Middleware<any, any>;

/** Create a plugin that throws errors */
function createErrorPlugin(name: string, error?: Error): Plugin<any, any>;

/** Create a middleware that throws errors */
function createErrorMiddleware(name: string, error?: Error): Middleware<any, any>;

/** Wait for a specific number of calls to a mock */
function waitForCalls(mock: any, count: number, timeout?: number): Promise<void>;

/** Reset all plugin mocks */
function resetPluginMocks(): void;

/** Reset all middleware mocks */
function resetMiddlewareMocks(): void;
```

## React Testing Utilities

```tsx
import { 
  renderStageFlow,
  createMockStageComponent,
  createTestProvider,
  createStageFlowTestSetup,
  createStageFlowInteractions,
  waitForReactUpdate,
  StageFlowTestInteractions,
  stageFlowMatchers
} from '@stage-flow/testing';

interface StageFlowRenderResult<TStage extends string, TData = unknown> {
  /** The test engine instance */
  engine: StageFlowTestEngine<TStage, TData>;
  /** The rendered component */
  component: RenderResult;
  /** Test utilities */
  utils: {
    /** Wait for stage change */
    waitForStage: (stage: TStage) => Promise<void>;
    /** Wait for event to be sent */
    waitForEvent: (event: string) => Promise<void>;
    /** Get current stage */
    getCurrentStage: () => TStage;
    /** Get current data */
    getCurrentData: () => TData | undefined;
    /** Send event */
    send: (event: string, data?: TData) => Promise<void>;
    /** Navigate to stage */
    goTo: (stage: TStage, data?: TData) => Promise<void>;
  };
}

interface RenderStageFlowOptions<TStage extends string, TData = unknown> {
  /** Stage flow configuration */
  config: StageFlowConfig<TStage, TData>;
  /** Test engine options */
  engineOptions?: TestEngineOptions;
  /** React testing library options */
  renderOptions?: RenderOptions;
  /** Custom stage components */
  stageComponents?: Partial<Record<TStage, ComponentType<any>>>;
  /** Whether to wrap with error boundary */
  withErrorBoundary?: boolean;
  /** Custom error boundary props */
  errorBoundaryProps?: Partial<StageErrorBoundaryProps>;
}

interface StageFlowTestSetup<TStage extends string, TData = unknown> {
  /** Test engine */
  engine: StageFlowTestEngine<TStage, TData>;
  /** Test provider component */
  TestProvider: ComponentType<{ children: React.ReactNode }>;
  /** Test utilities */
  utils: {
    /** Wait for stage change */
    waitForStage: (stage: TStage) => Promise<void>;
    /** Wait for event to be sent */
    waitForEvent: (event: string) => Promise<void>;
    /** Get current stage */
    getCurrentStage: () => TStage;
    /** Get current data */
    getCurrentData: () => TData | undefined;
    /** Send event */
    send: (event: string, data?: TData) => Promise<void>;
    /** Navigate to stage */
    goTo: (stage: TStage, data?: TData) => Promise<void>;
  };
}

/** Render a component with stage flow context */
function renderStageFlow<TStage extends string, TData = unknown>(
  component: React.ReactElement,
  options: RenderStageFlowOptions<TStage, TData>
): StageFlowRenderResult<TStage, TData>;

/** Create a mock stage component */
function createMockStageComponent<TProps = any>(
  name: string,
  props?: Partial<TProps>
): ComponentType<TProps>;

/** Create a test provider component */
function createTestProvider<TStage extends string, TData = unknown>(
  config: StageFlowConfig<TStage, TData>,
  options?: TestEngineOptions
): ComponentType<{ children: React.ReactNode }>;

/** Create a complete test setup */
function createStageFlowTestSetup<TStage extends string, TData = unknown>(
  config: StageFlowConfig<TStage, TData>,
  options?: TestEngineOptions
): StageFlowTestSetup<TStage, TData>;

/** Create test interactions */
function createStageFlowInteractions<TStage extends string, TData = unknown>(
  engine: StageFlowTestEngine<TStage, TData>
): StageFlowTestInteractions<TStage, TData>;

/** Wait for React to update */
function waitForReactUpdate(): Promise<void>;

/** Test interactions interface */
interface StageFlowTestInteractions<TStage extends string, TData = unknown> {
  /** Wait for stage change */
  waitForStage: (stage: TStage) => Promise<void>;
  /** Wait for event to be sent */
  waitForEvent: (event: string) => Promise<void>;
  /** Get current stage */
  getCurrentStage: () => TStage;
  /** Get current data */
  getCurrentData: () => TData | undefined;
  /** Send event */
  send: (event: string, data?: TData) => Promise<void>;
  /** Navigate to stage */
  goTo: (stage: TStage, data?: TData) => Promise<void>;
  /** Get transition history */
  getTransitions: () => Array<{ from: TStage; to: TStage; event?: string; timestamp: number }>;
  /** Clear transition history */
  clearTransitions: () => void;
}

/** Jest matchers for stage flow testing */
const stageFlowMatchers: {
  toBeInStage: (stage: string) => CustomMatcherResult;
  toHaveTransitionedTo: (stage: string) => CustomMatcherResult;
  toHaveSentEvent: (event: string) => CustomMatcherResult;
  toHaveData: (data: unknown) => CustomMatcherResult;
};
```

## Usage Examples

### Basic Engine Testing

```tsx
import { StageFlowTestEngine } from '@stage-flow/testing';

describe('Stage Flow Engine', () => {
  it('should transition between stages', async () => {
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

    const engine = new StageFlowTestEngine(config);
    await engine.start();

    expect(engine.getCurrentStage()).toBe('idle');

    await engine.send('start');
    await engine.test.waitForStage('loading');
    expect(engine.getCurrentStage()).toBe('loading');

    await engine.send('complete');
    await engine.test.waitForStage('success');
    expect(engine.getCurrentStage()).toBe('success');
  });
});
```

### Mock Engine Testing

```tsx
import { createMockPlugin, createSpyMiddleware } from '@stage-flow/testing';

describe('Stage Flow with Mocks', () => {
  it('should handle async operations with mocks', async () => {
    const mockPlugin = createMockPlugin({
      name: 'test-plugin',
      trackCalls: true,
      install: async (engine) => {
        console.log('Mock plugin installed');
      }
    });

    const spyMiddleware = createSpyMiddleware('test-middleware');

    const config: StageFlowConfig<'idle' | 'loading' | 'success'> = {
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

    const engine = new StageFlowTestEngine(config, {
      plugins: [mockPlugin],
      middleware: [spyMiddleware]
    });

    await engine.start();
    await engine.send('start');
    await engine.test.waitForStage('loading');
    
    expect(spyMiddleware.calls).toHaveLength(1);
    expect(spyMiddleware.calls[0].context.from).toBe('idle');
    expect(spyMiddleware.calls[0].context.to).toBe('loading');
  });
});
```

### React Component Testing

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderStageFlow } from '@stage-flow/testing';
import { useStageFlow } from '@stage-flow/react';

function TestComponent() {
  const { currentStage, send, isTransitioning } = useStageFlow();

  return (
    <div>
      <p>Current stage: {currentStage}</p>
      <button 
        onClick={() => send('start')}
        disabled={isTransitioning}
      >
        Start
      </button>
      <button 
        onClick={() => send('complete')}
        disabled={isTransitioning}
      >
        Complete
      </button>
    </div>
  );
}

describe('TestComponent', () => {
  it('should render and handle stage transitions', async () => {
    const config: StageFlowConfig<'idle' | 'loading' | 'success'> = {
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

    const { engine, utils } = renderStageFlow(<TestComponent />, { config });

    expect(screen.getByText('Current stage: idle')).toBeInTheDocument();

    const startButton = screen.getByText('Start');
    expect(startButton).not.toBeDisabled();

    fireEvent.click(startButton);
    await utils.waitForStage('loading');
    
    expect(screen.getByText('Current stage: loading')).toBeInTheDocument();
    expect(startButton).toBeDisabled();

    const completeButton = screen.getByText('Complete');
    fireEvent.click(completeButton);
    await utils.waitForStage('success');
    
    expect(screen.getByText('Current stage: success')).toBeInTheDocument();
  });
});
```

### User Interaction Simulation

```tsx
import { createStageFlowInteractions } from '@stage-flow/testing';

describe('User Interaction Simulation', () => {
  it('should simulate complex user flows', async () => {
    const engine = new StageFlowTestEngine(config);
    await engine.start();

    const interactions = createStageFlowInteractions(engine);

    await interactions.send('start');
    await interactions.waitForStage('loading');
    
    await interactions.send('complete', { result: 'success' });
    await interactions.waitForStage('success');

    expect(interactions.getCurrentStage()).toBe('success');
    expect(interactions.getCurrentData()?.result).toBe('success');
  });
});
```

### Integration Testing

```tsx
import { renderStageFlow } from '@stage-flow/testing';

describe('Integration Tests', () => {
  it('should handle complete application flow', async () => {
    const config = createAppConfig();
    const { engine, utils } = renderStageFlow(<App />, { config });

    // Simulate user login
    await utils.send('login', { username: 'test', password: 'test' });
    await utils.waitForStage('authenticated');

    // Simulate data loading
    await utils.send('loadData');
    await utils.waitForStage('dataLoaded');

    // Verify final state
    expect(utils.getCurrentStage()).toBe('dataLoaded');
    expect(utils.getCurrentData()?.user).toBeDefined();
    expect(utils.getCurrentData()?.data).toBeDefined();
  });
});
```

### Test Configuration

```tsx
import { StageFlowTestEngine } from '@stage-flow/testing';

const testConfig = {
  strictValidation: true,
  developmentWarnings: false,
  onError: (error) => {
    console.error('Test error:', error);
  }
};

const engine = new StageFlowTestEngine(config, testConfig);
```

### Async Testing Patterns

```tsx
describe('Async Operations', () => {
  it('should handle async transitions', async () => {
    const engine = new StageFlowTestEngine(config);
    await engine.start();

    // Start async operation
    const transitionPromise = engine.send('startAsync');
    
    // Wait for intermediate state
    await engine.test.waitForStage('processing');
    
    // Complete async operation
    await engine.send('complete');
    await transitionPromise;
    
    expect(engine.getCurrentStage()).toBe('success');
  });

  it('should handle timeouts', async () => {
    const engine = new StageFlowTestEngine(config);
    await engine.start();

    await engine.send('startWithTimeout');
    
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    expect(engine.getCurrentStage()).toBe('timeout');
  });
});
```

### Jest Matchers

```tsx
import { stageFlowMatchers } from '@stage-flow/testing';

// Extend Jest expect
expect.extend(stageFlowMatchers);

describe('Stage Flow Matchers', () => {
  it('should use custom matchers', async () => {
    const engine = new StageFlowTestEngine(config);
    await engine.start();

    expect(engine).toBeInStage('idle');

    await engine.send('start');
    await engine.test.waitForStage('loading');

    expect(engine).toHaveTransitionedTo('loading');
    expect(engine).toHaveSentEvent('start');
    expect(engine).toHaveData({ loading: true });
  });
});
``` 