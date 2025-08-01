# Performance Optimization

Stage Flow provides several techniques for optimizing the performance of your React applications.

## Memoization

Use React.memo and useMemo for performance optimization. Stage Flow components can benefit from React's optimization techniques to prevent unnecessary re-renders.

**Why optimize:**
- **Prevent Re-renders**: Avoid re-rendering components when stage hasn't changed
- **Better Performance**: Faster transitions and smoother user experience
- **Memory Efficiency**: Reduce memory usage in complex applications

**Optimization techniques:**
- Memoize stage components with `React.memo`
- Use `useCallback` for event handlers
- Use `useMemo` for expensive calculations
- Lazy load stage components

```tsx
// Memoized stage components
const IdleView = React.memo(function IdleView({ stage, data, send, goTo, isTransitioning }) {
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
});

const LoadingView = React.memo(function LoadingView({ stage, data, send, goTo, isTransitioning }) {
  return (
    <div>
      <h1>Loading...</h1>
      <div className="spinner" />
    </div>
  );
});

const SuccessView = React.memo(function SuccessView({ stage, data, send, goTo, isTransitioning }) {
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
});

// Memoized stage renderer with configuration
const memoConfig = {
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
};

const memoEngine = new StageFlowEngine(memoConfig);

const StageComponents = useMemo(() => ({
  idle: <IdleView />,
  loading: <LoadingView />,
  success: <SuccessView />,
  error: <ErrorView />
}), []);

function App() {
  return (
    <StageFlowProvider engine={memoEngine}>
      <StageRenderer 
        engine={memoEngine}
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
```

## Lazy Loading

Lazy load stage components for better performance. This technique loads components only when they're needed, reducing initial bundle size.

**Benefits:**
- **Smaller Bundle**: Reduce initial JavaScript bundle size
- **Faster Loading**: Load components only when needed
- **Better UX**: Show loading states while components load
- **Code Splitting**: Automatically split your code by stage components

**When to use:**
- Large applications with many stage components
- Components that are rarely used
- Complex stage components with heavy dependencies

```tsx
// Lazy load stage components
const IdleView = lazy(() => import('./views/IdleView'));
const LoadingView = lazy(() => import('./views/LoadingView'));
const SuccessView = lazy(() => import('./views/SuccessView'));
const ErrorView = lazy(() => import('./views/ErrorView'));

// Lazy loading configuration
const lazyConfig = {
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
};

const lazyEngine = new StageFlowEngine(lazyConfig);

function App() {
  return (
    <StageFlowProvider engine={lazyEngine}>
      <Suspense fallback={<div>Loading...</div>}>
        <StageRenderer
          engine={lazyEngine}
          stageComponents={{
            idle: IdleView,
            loading: LoadingView,
            success: SuccessView,
            error: ErrorView
          }}
          disableAnimations={false}
          style={{ minHeight: "400px" }}
        />
      </Suspense>
    </StageFlowProvider>
  );
}
```

## Engine Optimization

Optimize your stage flow engine for better performance:

```tsx
// Optimized engine with memoization
function useOptimizedEngine() {
  return useMemo(() => {
    const config = {
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
    };
    
    return new StageFlowEngine(config);
  }, []);
}

// Usage
function OptimizedApp() {
  const engine = useOptimizedEngine();
  
  return (
    <StageFlowProvider engine={engine}>
      <YourApp />
    </StageFlowProvider>
  );
}
```

## Event Handler Optimization

Optimize event handlers to prevent unnecessary re-renders:

```tsx
// Optimized event handlers
function OptimizedComponent() {
  const { send, isTransitioning } = useStageFlow<AppStage, AppData>();
  
  // Event handlers
  const handleStart = () => {
    send('start');
  };
  
  const handleComplete = (data: AppData) => {
    send('complete', data);
  };
  
  const handleReset = () => {
    send('reset');
  };
  
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return processData(data);
  }, [data]);
  
  return (
    <div>
      <button onClick={handleStart} disabled={isTransitioning}>
        Start
      </button>
      <button onClick={handleComplete} disabled={isTransitioning}>
        Complete
      </button>
      <button onClick={handleReset} disabled={isTransitioning}>
        Reset
      </button>
      <div>{processedData}</div>
    </div>
  );
}
```

## Animation Performance

Optimize animations for better performance:

```tsx
// Optimized animations
function OptimizedAnimation() {
  const { effect, isLoading } = useStageEffect(engine);
  
  // Animation configuration
  const animationConfig = effect ? {
    type: effect.type,
    duration: effect.duration || 300,
    easing: effect.easing || 'easeInOut'
  } : null;
  
  if (isLoading || !animationConfig) {
    return <div>Loading...</div>;
  }
  
  return (
    <StageAnimation effect={animationConfig}>
      <div>Optimized animated content</div>
    </StageAnimation>
  );
}
```

## Bundle Size Optimization

Optimize bundle size for better loading performance:

```tsx
// Tree-shaking friendly imports
import { StageFlowProvider, StageRenderer } from '@stage-flow/react';
import { StageFlowEngine } from '@stage-flow/core';

// Instead of importing everything
// import * as StageFlow from '@stage-flow/react';

// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Use dynamic imports for conditional features
const loadFeature = async () => {
  const { default: Feature } = await import('./Feature');
  return Feature;
};
```

## Memory Management

Optimize memory usage in your applications:

```tsx
// Clean up event listeners
function MemoryOptimizedComponent() {
  const { send } = useStageFlow<AppStage, AppData>();
  
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        send('next');
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [send]);
  
  return <div>Memory optimized component</div>;
}

// Clean up timers and intervals
function TimerComponent() {
  const { send } = useStageFlow<AppStage, AppData>();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      send('timeout');
    }, 5000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [send]);
  
  return <div>Timer component</div>;
}
```

## Performance Monitoring

Monitor performance in your applications:

```tsx
// Performance monitoring hook
function usePerformanceMonitor() {
  const { currentStage, isTransitioning } = useStageFlow<AppStage, AppData>();
  
  useEffect(() => {
    // Monitor stage transitions
    console.log(`Stage transition to: ${currentStage}`);
    
    // Monitor transition performance
    if (isTransitioning) {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        console.log(`Transition took: ${endTime - startTime}ms`);
      };
    }
  }, [currentStage, isTransitioning]);
}

// Usage
function MonitoredApp() {
  usePerformanceMonitor();
  
  return (
    <StageFlowProvider engine={engine}>
      <YourApp />
    </StageFlowProvider>
  );
}
```

## Best Practices

### 1. Avoid Unnecessary Re-renders

```tsx
// ✅ Good: Memoized component
const OptimizedView = React.memo(function OptimizedView() {
  const { currentStage } = useStageFlow<AppStage, AppData>();
  
  return <div>Current stage: {currentStage}</div>;
});

// ❌ Avoid: Component that re-renders unnecessarily
function UnoptimizedView() {
  const { currentStage } = useStageFlow<AppStage, AppData>();
  
  return <div>Current stage: {currentStage}</div>;
}
```

### 2. Use Stable References

```tsx
// ✅ Good: Stable event handler
function StableComponent() {
  const { send } = useStageFlow<AppStage, AppData>();
  
  const handleClick = useCallback(() => {
    send('next');
  }, [send]);
  
  return <button onClick={handleClick}>Next</button>;
}

// ❌ Avoid: Unstable event handler
function UnstableComponent() {
  const { send } = useStageFlow<AppStage, AppData>();
  
  return <button onClick={() => send('next')}>Next</button>;
}
```

### 3. Optimize Heavy Computations

```tsx
// ✅ Good: Memoized computation
function ComputedComponent() {
  const { data } = useStageFlow<AppStage, AppData>();
  
  const processedData = useMemo(() => {
    return expensiveComputation(data);
  }, [data]);
  
  return <div>{processedData}</div>;
}

// ❌ Avoid: Recomputing on every render
function UncomputedComponent() {
  const { data } = useStageFlow<AppStage, AppData>();
  
  const processedData = expensiveComputation(data);
  
  return <div>{processedData}</div>;
}
```

## Next Steps

- **[Integration](./integration.md)** - Integrate with other libraries
- **[Best Practices](./best-practices.md)** - Follow best practices

## Related Guides

- **[Getting Started](/docs/guide/getting-started)** - Set up your first Stage Flow project
- **[Core Concepts](/docs/guide/core-concepts)** - Learn the fundamental concepts
- **[Basic Usage](/docs/guide/basic-usage)** - See basic usage patterns
- **[TypeScript Usage](/docs/guide/typescript-usage)** - Advanced TypeScript features 