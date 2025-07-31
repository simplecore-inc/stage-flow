# React Hooks

Stage Flow provides several React hooks that make it easy to interact with stage machines from your React components.

## useStageFlow

The main hook for accessing stage machine functionality. This is your primary way to interact with the stage flow from React components.

**What it provides:**
- `currentStage`: The current stage name (e.g., 'loading', 'success')
- `data`: Data associated with the current stage
- `send`: Function to trigger transitions by sending events
- `goTo`: Function for direct navigation to any stage
- `isTransitioning`: Boolean indicating if a transition is in progress

**Think of it as:**
- A hook that gives you access to your app's current state
- A way to trigger state changes by sending events
- A way to navigate directly to specific states

```tsx
import { useStageFlow } from '@stage-flow/react';

function LoginForm() {
  const { 
    currentStage, 
    data, 
    send, 
    goTo,
    isTransitioning 
  } = useStageFlow<AppStage, AppData>();
  
  const handleSubmit = async (email: string, password: string) => {
    send('start', { email, password });
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const user = await response.json();
        send('complete', { user });
      } else {
        send('fail', { error: 'Login failed' });
      }
    } catch (error) {
      send('fail', { error: 'Network error' });
    }
  };
  
  return (
    <div>
      {currentStage === 'idle' && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmit(
            formData.get('email') as string,
            formData.get('password') as string
          );
        }}>
          <input name="email" type="email" required />
          <input name="password" type="password" required />
          <button type="submit" disabled={isTransitioning}>
            {isTransitioning ? 'Logging in...' : 'Login'}
          </button>
        </form>
      )}
      
      {currentStage === 'loading' && (
        <div>Logging in...</div>
      )}
      
      {currentStage === 'success' && (
        <div>
          <h2>Welcome, {data.user?.name}!</h2>
          <button onClick={() => send('reset')}>Logout</button>
        </div>
      )}
      
      {currentStage === 'error' && (
        <div>
          <p>Error: {data.error}</p>
          <button onClick={() => send('retry')}>Try Again</button>
        </div>
      )}
    </div>
  );
}

// Alternative: Using StageRenderer for automatic stage rendering
function LoginFormWithRenderer() {
  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        engine={engine}
        stageComponents={{
          idle: IdleView,
          loading: LoadingView,
          success: SuccessView,
          error: ErrorView
        }}
      />
    </StageFlowProvider>
  );
}

// Stage components receive props from StageRenderer
function IdleView({ stage, data, send, goTo, isTransitioning }) {
  const handleSubmit = (email: string, password: string) => {
    send('start', { email, password });
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
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={isTransitioning}>
        {isTransitioning ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## useStageData

Hook for accessing stage data. This hook provides read-only access to the data associated with the current stage.

**What it provides:**
- `data`: The data associated with the current stage (or undefined if no data is set)
- Read-only access (for updates, use `send()` or `goTo()`)

**When to use it:**
- When you need to display data from the current stage
- When you want to read stage data without triggering transitions
- For form inputs that need to display current data

```tsx
import { useStageData } from '@stage-flow/react';

function FormComponent() {
  const data = useStageData<AppStage, AppData>(engine);
  const { send } = useStageFlow<AppStage, AppData>(engine);
  
  const handleInputChange = (field: keyof AppData, value: any) => {
    // Note: useStageData only provides read access to data
    // To update data, use send() or goTo() with new data
    console.log('Data changed:', { [field]: value });
  };
  
  return (
    <div>
      <input
        type="email"
        value={data?.email || ''}
        onChange={(e) => handleInputChange('email', e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={data?.password || ''}
        onChange={(e) => handleInputChange('password', e.target.value)}
        placeholder="Password"
      />
      <button onClick={() => send('reset')}>Reset Form</button>
    </div>
  );
}
```

## useStageEffect

Hook for accessing stage effect configuration. This hook automatically resolves and provides the current stage's animation effect configuration, supporting both built-in effects and custom effects from the effect registry.

**What it provides:**
- `effect`: The resolved effect configuration for the current stage (or undefined if not resolved)
- `isLoading`: Boolean indicating if the effect is still being resolved

**What it does:**
- Automatically resolves stage-specific effects from the effect registry
- Falls back to built-in effects if custom effects aren't found
- Updates effect configuration when stage changes
- Provides loading state during effect resolution
- Handles error cases gracefully with default effects

**When to use it:**
- When you want to apply dynamic animations based on the current stage
- When working with custom effects registered in the effect registry
- For creating responsive animations that change with stage transitions
- When you need to handle effect loading states

```tsx
import { useStageEffect } from '@stage-flow/react';

// Basic usage with automatic effect resolution
function AnimatedComponent() {
  const { effect, isLoading } = useStageEffect<AppStage, AppData>(engine);
  
  if (isLoading) {
    return <div>Loading animation...</div>;
  }
  
  return (
    <StageAnimation effect={effect}>
      <div>Animated content</div>
    </StageAnimation>
  );
}

// Usage with custom default effect
function CustomDefaultAnimation() {
  const { effect, isLoading } = useStageEffect<AppStage, AppData>(engine, {
    type: 'slide',
    duration: 500,
    easing: 'easeInOut'
  });
  
  return (
    <StageAnimation effect={effect}>
      <div>Content with custom default animation</div>
    </StageAnimation>
  );
}

// Dynamic effect display
function EffectDisplay() {
  const { effect, isLoading } = useStageEffect<AppStage, AppData>(engine);
  
  if (isLoading) {
    return <div>Resolving effect...</div>;
  }
  
  return (
    <div>
      <h3>Current Animation Effect</h3>
      <p>Type: {effect?.type || 'Default'}</p>
      <p>Duration: {effect?.duration || 300}ms</p>
      <p>Easing: {effect?.easing || 'easeInOut'}</p>
      {effect?.delay && <p>Delay: {effect.delay}ms</p>}
    </div>
  );
}

// Conditional animation based on effect
function ConditionalAnimation() {
  const { effect, isLoading } = useStageEffect<AppStage, AppData>(engine);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // Apply different styles based on effect type
  const getAnimationStyle = () => {
    switch (effect?.type) {
      case 'fade':
        return { transition: 'opacity 0.3s ease-in-out' };
      case 'slide':
        return { transition: 'transform 0.5s ease-out' };
      case 'scale':
        return { transition: 'transform 0.4s ease-in-out' };
      default:
        return {};
    }
  };
  
  return (
    <div style={getAnimationStyle()}>
      <StageAnimation effect={effect}>
        <div>Conditionally styled content</div>
      </StageAnimation>
    </div>
  );
}

// Error handling with fallback effects
function RobustAnimation() {
  const { effect, isLoading } = useStageEffect<AppStage, AppData>(engine, {
    type: 'fade',
    duration: 200,
    easing: 'easeInOut'
  });
  
  if (isLoading) {
    return <div>Preparing animation...</div>;
  }
  
  return (
    <StageAnimation effect={effect}>
      <div>Robust animated content with fallback</div>
    </StageAnimation>
  );
}
```

## Hook Composition

You can combine multiple hooks to create powerful, reactive components:

```tsx
function ComplexComponent() {
  const { currentStage, send, data, isTransitioning } = useStageFlow<AppStage, AppData>(engine);
  const { effect, isLoading: effectLoading } = useStageEffect<AppStage, AppData>(engine);
  
  const handleAction = async () => {
    if (isTransitioning) return;
    
    send('start');
    
    try {
      // Perform async operation
      const result = await someAsyncOperation();
      send('complete', { result });
    } catch (error) {
      send('fail', { error: error.message });
    }
  };
  
  if (effectLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <StageAnimation effect={effect}>
      <div>
        <h2>Current Stage: {currentStage}</h2>
        <p>Data: {JSON.stringify(data)}</p>
        <button 
          onClick={handleAction}
          disabled={isTransitioning}
        >
          {isTransitioning ? 'Processing...' : 'Action'}
        </button>
      </div>
    </StageAnimation>
  );
}
```

## Hook Best Practices

### 1. Use TypeScript for Better Type Safety

```tsx
// ✅ Good: Explicit typing
function TypedComponent() {
  const { currentStage, send, data } = useStageFlow<AppStage, AppData>();
  
  // TypeScript will provide autocomplete and type checking
  if (currentStage === 'success') {
    return <div>Welcome, {data.user?.name}!</div>;
  }
}

// ❌ Avoid: No typing
function UntypedComponent() {
  const { currentStage, send, data } = useStageFlow();
  
  // No type safety or autocomplete
  return <div>{data.unknownProperty}</div>;
}
```

### 2. Handle Loading States

```tsx
// ✅ Good: Proper loading state handling
function LoadingAwareComponent() {
  const { currentStage, send, isTransitioning } = useStageFlow<AppStage, AppData>();
  
  return (
    <button 
      onClick={() => send('start')}
      disabled={isTransitioning}
    >
      {isTransitioning ? 'Processing...' : 'Start'}
    </button>
  );
}

// ❌ Avoid: No loading state handling
function IgnorantComponent() {
  const { send } = useStageFlow<AppStage, AppData>();
  
  return (
    <button onClick={() => send('start')}>
      Start
    </button>
  );
}
```

### 3. Use Effect Hooks for Side Effects

```tsx
// ✅ Good: Proper side effect handling
function EffectComponent() {
  const { currentStage, send } = useStageFlow<AppStage, AppData>();
  
  useEffect(() => {
    if (currentStage === 'loading') {
      // Perform side effect when entering loading stage
      const timer = setTimeout(() => {
        send('timeout');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [currentStage, send]);
  
  return <div>Current stage: {currentStage}</div>;
}
```

### 4. Memoize Expensive Operations

```tsx
// ✅ Good: Memoized expensive operations
function OptimizedComponent() {
  const { data } = useStageFlow<AppStage, AppData>();
  
  const processedData = useMemo(() => {
    // Expensive operation
    return processLargeData(data);
  }, [data]);
  
  return <div>{processedData}</div>;
}
```

## Next Steps

- **[Patterns](./patterns.md)** - Discover advanced patterns
- **[Performance](./performance.md)** - Optimize your applications
- **[Integration](./integration.md)** - Integrate with other libraries

## Related Guides

- **[Getting Started](/guide/getting-started)** - Set up your first Stage Flow project
- **[Core Concepts](/guide/core-concepts)** - Learn the fundamental concepts
- **[Basic Usage](/guide/basic-usage)** - See basic usage patterns
- **[TypeScript Usage](/guide/typescript-usage)** - Advanced TypeScript features 