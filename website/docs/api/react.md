---
id: api-react
title: React API
sidebar_label: React API
---

# React API

React components and hooks for Stage Flow integration.

## StageFlowProvider

Provider component for React applications.

```tsx
import { StageFlowProvider } from '@stage-flow/react';

interface StageFlowProviderProps<TStage extends string, TData = unknown> {
  /** The StageFlowEngine instance to provide */
  engine: StageFlowEngine<TStage, TData>;
  /** Child components */
  children: React.ReactNode;
}

function StageFlowProvider<TStage extends string, TData = unknown>(
  props: StageFlowProviderProps<TStage, TData>
): JSX.Element;
```

## useStageFlow

Main hook for accessing stage flow functionality.

```tsx
import { useStageFlow } from '@stage-flow/react';

interface UseStageFlowReturn<TStage extends string, TData = unknown> {
  /** Current stage */
  currentStage: TStage;
  /** Current stage data */
  data?: TData;
  /** Send an event to trigger transitions */
  send: (event: string, data?: TData) => Promise<void>;
  /** Navigate directly to a stage */
  goTo: (stage: TStage, data?: TData) => Promise<void>;
  /** Whether a transition is currently in progress */
  isTransitioning: boolean;
  /** Pause all timers for the current stage */
  pauseTimers: () => void;
  /** Resume all paused timers for the current stage */
  resumeTimers: () => void;
  /** Reset all timers for the current stage to their original duration */
  resetTimers: () => void;
  /** Get the remaining time for timers in the current stage */
  getTimerRemainingTime: () => number;
  /** Check if timers are paused for the current stage */
  areTimersPaused: () => boolean;
}

function useStageFlow<TStage extends string, TData = unknown>(
  engine: StageFlowEngine<TStage, TData>
): UseStageFlowReturn<TStage, TData>;
```

## useStageData

Hook for accessing stage-specific data.

```tsx
import { useStageData } from '@stage-flow/react';

type UseStageDataReturn<TData = unknown> = TData | undefined;

function useStageData<TStage extends string, TData = unknown>(
  engine: StageFlowEngine<TStage, TData>
): UseStageDataReturn<TData>;
```

## useStageEffect

Hook for accessing stage effect configuration.

```tsx
import { useStageEffect } from '@stage-flow/react';

interface UseStageEffectReturn {
  /** Current stage effect configuration */
  effect: EffectConfig | undefined;
  /** Whether the effect is loading/resolving */
  isLoading: boolean;
}

function useStageEffect<TStage extends string, TData = unknown>(
  engine: StageFlowEngine<TStage, TData>,
  defaultEffect?: EffectConfig
): UseStageEffectReturn;
```

## StageRenderer

Component for rendering different content based on current stage.

```tsx
import { StageRenderer } from '@stage-flow/react';

interface StageProps<TStage extends string, TData = unknown> {
  /** Current stage name */
  stage: TStage;
  /** Stage-specific data */
  data?: TData;
  /** Function to send events */
  send: (event: string, data?: TData) => Promise<void>;
  /** Function to navigate to a stage */
  goTo: (stage: TStage, data?: TData) => Promise<void>;
  /** Whether a transition is in progress */
  isTransitioning: boolean;
}

interface StageRendererProps<TStage extends string, TData = unknown> {
  /** The StageFlowEngine instance */
  engine: StageFlowEngine<TStage, TData>;
  /** Optional effect configurations - overrides stage-specific effects */
  effects?: Record<string, EffectConfig>;
  /** Optional stage component overrides */
  stageComponents?: Partial<Record<TStage, ComponentType<StageProps<TStage, TData>>>>;
  /** Optional fallback component for stages without specific components */
  fallbackComponent?: ComponentType<StageProps<TStage, TData>>;
  /** Whether to disable animations globally */
  disableAnimations?: boolean;
  /** Default effect to use when no stage-specific effect is defined */
  defaultEffect?: EffectConfig;
  /** Custom className for the container */
  className?: string;
  /** Custom style for the container */
  style?: React.CSSProperties;
}

function StageRenderer<TStage extends string, TData = unknown>(
  props: StageRendererProps<TStage, TData>
): JSX.Element;
```

## StageAnimation

Component for smooth transitions between stages.

```tsx
import { StageAnimation } from '@stage-flow/react';

interface StageAnimationProps {
  /** Child components to animate */
  children: React.ReactNode;
  /** Effect configuration for the animation */
  effect?: EffectConfig;
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
  /** Callback when animation starts */
  onAnimationStart?: () => void;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

function StageAnimation(props: StageAnimationProps): JSX.Element;
```

## StageErrorBoundary

Error boundary component for handling stage machine errors.

```tsx
import { StageErrorBoundary } from '@stage-flow/react';

interface StageErrorFallbackProps {
  /** The error that occurred */
  error: Error;
  /** Error information from React */
  errorInfo: ErrorInfo;
  /** Function to reset the error boundary */
  resetError: () => void;
  /** Function to retry the failed operation */
  retry?: () => void;
  /** Whether retry is available */
  canRetry?: boolean;
  /** Current stage when error occurred */
  currentStage?: string;
  /** Fallback stage if configured */
  fallbackStage?: string;
  /** Number of retry attempts made */
  retryAttempts?: number;
  /** Maximum retry attempts allowed */
  maxRetries?: number;
}

interface StageErrorBoundaryProps {
  /** Child components to wrap */
  children: React.ReactNode;
  /** Optional fallback component to render on error */
  fallback?: ComponentType<StageErrorFallbackProps>;
  /** Optional error handler callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional flag to reset error state when children change */
  resetOnPropsChange?: boolean;
  /** Optional reset keys to watch for changes */
  resetKeys?: Array<string | number>;
  /** Optional stage flow engine for error recovery integration */
  engine?: StageFlowEngine<any, any>;
  /** Optional error recovery configuration */
  errorRecoveryConfig?: Partial<ExtendedErrorRecoveryConfig>;
  /** Optional flag to enable automatic retry on error */
  enableRetry?: boolean;
  /** Optional maximum number of automatic retries */
  maxRetries?: number;
}

class StageErrorBoundary extends Component<StageErrorBoundaryProps, StageErrorBoundaryState> {
  // ... implementation
}
```

## useStageFlowContext

Hook for accessing the StageFlowEngine from context.

```tsx
import { useStageFlowContext } from '@stage-flow/react';

function useStageFlowContext<TStage extends string, TData = unknown>(): StageFlowEngine<TStage, TData>;
```

## withStageErrorBoundary

Higher-order component that wraps a component with error boundary.

```tsx
import { withStageErrorBoundary } from '@stage-flow/react';

interface UseErrorBoundaryOptions {
  /** Optional error handler callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional fallback component */
  fallback?: ComponentType<StageErrorFallbackProps>;
  /** Optional stage flow engine for error recovery */
  engine?: StageFlowEngine<any, any>;
  /** Optional error recovery configuration */
  errorRecoveryConfig?: Partial<ExtendedErrorRecoveryConfig>;
  /** Optional flag to enable automatic retry */
  enableRetry?: boolean;
  /** Optional maximum number of retries */
  maxRetries?: number;
}

function withStageErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: UseErrorBoundaryOptions = {}
): ComponentType<P>;
```

## Usage Examples

### Basic Provider Setup

```tsx
import React from 'react';
import { StageFlowEngine } from '@stage-flow/core';
import { StageFlowProvider } from '@stage-flow/react';

const engine = new StageFlowEngine(config);

function App() {
  return (
    <StageFlowProvider engine={engine}>
      <YourApp />
    </StageFlowProvider>
  );
}
```

### Using Hooks

```tsx
import React from 'react';
import { useStageFlow, useStageData, useStageEffect } from '@stage-flow/react';

function MyComponent() {
  const { currentStage, send, goTo, isTransitioning } = useStageFlow<AppStage, AppData>(engine);
  const data = useStageData<AppStage, AppData>(engine);
  const { effect, isLoading } = useStageEffect<AppStage, AppData>(engine);

  const handleStart = () => {
    send('start');
  };

  const handleGoToSuccess = () => {
    goTo('success', { result: 'completed' });
  };

  return (
    <div>
      <p>Current stage: {currentStage}</p>
      <p>Data: {JSON.stringify(data)}</p>
      <p>Effect: {effect?.type}</p>
      <button 
        onClick={handleStart}
        disabled={isTransitioning}
      >
        Start
      </button>
      <button onClick={handleGoToSuccess}>
        Go to Success
      </button>
    </div>
  );
}
```

### Stage Rendering

```tsx
import React from 'react';
import { StageRenderer } from '@stage-flow/react';

function IdleView({ stage, data, send, goTo, isTransitioning }) {
  return (
    <div>
      <h2>Idle State</h2>
      <button onClick={() => send('start')} disabled={isTransitioning}>
        Start Process
      </button>
    </div>
  );
}

function LoadingView({ stage, data, send, goTo, isTransitioning }) {
  return (
    <div>
      <h2>Loading...</h2>
      <div>Processing data...</div>
    </div>
  );
}

function SuccessView({ stage, data, send, goTo, isTransitioning }) {
  return (
    <div>
      <h2>Success!</h2>
      <p>Result: {data?.result}</p>
      <button onClick={() => send('reset')}>
        Reset
      </button>
    </div>
  );
}

function App() {
  return (
    <StageRenderer
      engine={engine}
      stageComponents={{
        idle: IdleView,
        loading: LoadingView,
        success: SuccessView
      }}
      defaultEffect={{ type: 'fade', duration: 300 }}
    />
  );
}
```

### Animation Integration

```tsx
import React from 'react';
import { StageAnimation } from '@stage-flow/react';

function AnimatedComponent() {
  return (
    <StageAnimation
      effect={{ type: 'slide', duration: 400, easing: 'easeInOut' }}
      onAnimationStart={() => console.log('Animation started')}
      onAnimationComplete={() => console.log('Animation completed')}
    >
      <div>Animated content</div>
    </StageAnimation>
  );
}
```

### Error Handling

```tsx
import React from 'react';
import { StageErrorBoundary } from '@stage-flow/react';

function CustomErrorFallback({ error, resetError, retry, canRetry }) {
  return (
    <div style={{ padding: '20px', border: '1px solid red' }}>
      <h2>Something went wrong</h2>
      <p>Error: {error.message}</p>
      {canRetry && retry && (
        <button onClick={retry}>Retry</button>
      )}
      <button onClick={resetError}>Reset</button>
    </div>
  );
}

function App() {
  return (
    <StageErrorBoundary
      fallback={CustomErrorFallback}
      enableRetry={true}
      maxRetries={3}
      onError={(error, errorInfo) => {
        console.error('Stage Flow Error:', error, errorInfo);
      }}
    >
      <YourApp />
    </StageErrorBoundary>
  );
}
```

### Context Usage

```tsx
import React from 'react';
import { useStageFlowContext } from '@stage-flow/react';

function DeepComponent() {
  const engine = useStageFlowContext();
  const { currentStage, send } = useStageFlow(engine);

  return (
    <div>
      <p>Current stage: {currentStage}</p>
      <button onClick={() => send('next')}>
        Next Stage
      </button>
    </div>
  );
}
```

### Error Boundary HOC

```tsx
import React from 'react';
import { withStageErrorBoundary } from '@stage-flow/react';

function MyComponent() {
  // Component implementation
}

const MyComponentWithErrorBoundary = withStageErrorBoundary(MyComponent, {
  onError: (error, errorInfo) => {
    console.error('Component error:', error);
  },
  enableRetry: true,
  maxRetries: 2
});
```

### Timer Control

```tsx
import React from 'react';
import { useStageFlow } from '@stage-flow/react';

function TimerControlComponent() {
  const { 
    currentStage, 
    pauseTimers, 
    resumeTimers, 
    resetTimers,
    getTimerRemainingTime,
    areTimersPaused 
  } = useStageFlow();

  const [remainingTime, setRemainingTime] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  // Real-time timer display update
  React.useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimerRemainingTime();
      const paused = areTimersPaused();
      setRemainingTime(remaining);
      setIsPaused(paused);
    }, 100);

    return () => clearInterval(interval);
  }, [getTimerRemainingTime, areTimersPaused, currentStage]);

  const handleMouseEnter = React.useCallback(() => {
    pauseTimers();
  }, [pauseTimers]);

  const handleMouseLeave = React.useCallback(() => {
    resumeTimers();
  }, [resumeTimers]);

  const handleReset = React.useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ padding: '20px', border: '1px solid #ccc' }}
    >
      <h3>Stage: {currentStage}</h3>
      <p>Timer: {remainingTime}ms {isPaused ? '(Paused)' : ''}</p>
      <button onClick={handleReset}>Reset Timer</button>
      <p>Hover to pause/resume timer</p>
    </div>
  );
}
``` 