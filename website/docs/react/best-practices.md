# Best Practices

Follow these best practices to create maintainable and performant Stage Flow applications.

## 1. Keep Components Simple

Break down complex components into smaller, focused pieces. Each component should have a single responsibility.

```tsx
// ✅ Good: Simple, focused components
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

// ❌ Avoid: Complex components with many responsibilities
function ComplexView({ stage, data, send, goTo, isTransitioning }) {
  // Too many responsibilities in one component
  return (
    <div>
      {/* Navigation logic */}
      {/* Form handling */}
      {/* API calls */}
      {/* Error handling */}
      {/* Animation logic */}
    </div>
  );
}
```
```

## 2. Use Custom Hooks

Extract reusable logic into custom hooks. This makes your components cleaner and your logic more testable.

```tsx
// ✅ Good: Custom hooks for specific functionality
function useLoginForm() {
  const { currentStage, send, data } = useStageFlow<AppStage, AppData>();
  
  const login = (email: string, password: string) => {
    send('login', { email, password });
  };
  
  const reset = () => {
    send('reset');
  };
  
  return { currentStage, data, login, reset };
}

// ✅ Good: Using StageRenderer with focused components
function LoginForm() {
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

function IdleView({ stage, data, send, goTo, isTransitioning }) {
  const handleLogin = (email: string, password: string) => {
    send('login', { email, password });
  };
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleLogin(
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

// ❌ Avoid: Inline logic in components
function LoginFormInline() {
  const { currentStage, send, data } = useStageFlow<AppStage, AppData>();
  
  // Inline logic makes component complex
  const handleLogin = (email: string, password: string) => {
    send('login', { email, password });
  };
  
  const handleReset = () => {
    send('reset');
  };
  
  // ... rest of component
}
```
```

## 3. Handle Loading States

Always provide feedback to users during transitions. Use the `isTransitioning` flag to show loading states.

```tsx
// ✅ Good: Proper loading state handling
function LoginForm() {
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

function IdleView({ stage, data, send, goTo, isTransitioning }) {
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={isTransitioning}>
        {isTransitioning ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

function LoadingView({ stage, data, send, goTo, isTransitioning }) {
  return (
    <div>
      <h2>Logging in...</h2>
      <div className="spinner" />
    </div>
  );
}

// ❌ Avoid: No loading state handling
function LoginFormNoLoading() {
  const { send } = useStageFlow<AppStage, AppData>();
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
    </form>
  );
}
```
```

## 4. Use Error Boundaries

Always wrap your Stage Flow components with error boundaries to catch and handle errors gracefully.

```tsx
// ✅ Good: Error boundary for stage machine errors
function App() {
  return (
    <StageErrorBoundary
      fallback={(error) => (
        <div>
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      )}
    >
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
    </StageErrorBoundary>
  );
}

// ❌ Avoid: No error handling
function AppNoErrorHandling() {
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
```
```

## 5. Type Safety

Use TypeScript for better type safety and developer experience.

```tsx
// ✅ Good: Explicit typing
type AppStage = 'idle' | 'loading' | 'success' | 'error';
type AppData = { email?: string; user?: User; error?: string };

function TypedComponent() {
  const { currentStage, send, data } = useStageFlow<AppStage, AppData>();
  
  // TypeScript will provide autocomplete and type checking
  if (currentStage === 'success') {
    return <div>Welcome, {data.user?.name}!</div>;
  }
}

// ✅ Good: Typed stage components
function TypedStageComponent({ stage, data, send, goTo, isTransitioning }: {
  stage: AppStage;
  data: AppData;
  send: (event: string, data?: AppData) => Promise<void>;
  goTo: (stage: AppStage, data?: AppData) => Promise<void>;
  isTransitioning: boolean;
}) {
  const handleAction = () => {
    send('next');
  };
  
  return (
    <div>
      <h1>Current Stage: {stage}</h1>
      <button onClick={handleAction} disabled={isTransitioning}>
        {isTransitioning ? 'Processing...' : 'Next'}
      </button>
    </div>
  );
}

// ❌ Avoid: No typing
function UntypedComponent() {
  const { currentStage, send, data } = useStageFlow();
  
  // No type safety or autocomplete
  return <div>{data.unknownProperty}</div>;
}
```

## 6. Consistent Naming

Use consistent naming conventions for stages, events, and data.

```tsx
// ✅ Good: Consistent naming
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

// ❌ Avoid: Inconsistent naming
const inconsistentConfig = {
  initial: 'IDLE',
  stages: [
    {
      name: 'IDLE',
      transitions: [{ target: 'LOADING', event: 'START_PROCESS' }]
    },
    {
      name: 'LOADING',
      transitions: [
        { target: 'SUCCESS', event: 'COMPLETE_PROCESS' },
        { target: 'ERROR', event: 'FAIL_PROCESS' }
      ]
    },
    {
      name: 'SUCCESS',
      transitions: [{ target: 'IDLE', event: 'RESET_PROCESS' }]
    },
    {
      name: 'ERROR',
      transitions: [{ target: 'IDLE', event: 'RETRY_PROCESS' }]
    }
  ]
};

const goodConfig = {
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

const formConfig = {
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

const testConfig = {
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
```

## 7. Separation of Concerns

Separate your stage logic from your UI logic.

```tsx
// ✅ Good: Separated concerns
// stage-config.ts
export const loginConfig = {
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

// LoginForm.tsx
function LoginForm() {
  const { currentStage, send, data } = useStageFlow<AppStage, AppData>();
  
  return (
    <div>
      {currentStage === 'idle' && <IdleView onStart={() => send('start')} />}
      {currentStage === 'loading' && <LoadingView />}
      {currentStage === 'success' && <SuccessView user={data.user} onReset={() => send('reset')} />}
      {currentStage === 'error' && <ErrorView error={data.error} onRetry={() => send('retry')} />}
    </div>
  );
}

// ❌ Avoid: Mixed concerns
function LoginForm() {
  const { currentStage, send, data } = useStageFlow<AppStage, AppData>();
  
  // Stage logic mixed with UI logic
  const config = {
    initial: 'idle',
    stages: [
      // ... stage configuration inline
    ]
  };
  
  return (
    <div>
      {/* UI logic mixed with stage logic */}
    </div>
  );
}
```

## 8. Performance Optimization

Use React optimization techniques to prevent unnecessary re-renders.

```tsx
// ✅ Good: Optimized components
const IdleView = React.memo(function IdleView({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <h1>Welcome</h1>
      <button onClick={onStart}>Start</button>
    </div>
  );
});

const LoadingView = React.memo(function LoadingView() {
  return (
    <div>
      <h1>Loading...</h1>
      <div className="spinner" />
    </div>
  );
});

// ❌ Avoid: Non-optimized components
function IdleView({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <h1>Welcome</h1>
      <button onClick={onStart}>Start</button>
    </div>
  );
}
```

## 9. Testing

Write comprehensive tests for your stage machines and components.

```tsx
// ✅ Good: Comprehensive testing
describe('Login Form', () => {
  it('should transition from idle to loading when start is triggered', () => {
    render(
      <StageFlowProvider engine={engine}>
        <LoginForm />
      </StageFlowProvider>
    );
    
    fireEvent.click(screen.getByText('Start'));
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  it('should transition to success when login succeeds', async () => {
    // Mock API call
    mockApi.post.mockResolvedValueOnce({ user: { name: 'John' } });
    
    render(
      <StageFlowProvider engine={engine}>
        <LoginForm />
      </StageFlowProvider>
    );
    
    fireEvent.click(screen.getByText('Start'));
    
    await waitFor(() => {
      expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    });
  });
});

// ❌ Avoid: No testing
// No tests written for stage machine behavior
```

## 10. Documentation

Document your stage machines and components for better maintainability.

```tsx
// ✅ Good: Well-documented code
/**
 * Login form stage machine configuration
 * 
 * Stages:
 * - idle: Initial state, shows login form
 * - loading: Processing login request
 * - success: Login successful, shows welcome message
 * - error: Login failed, shows error message
 * 
 * Events:
 * - start: Begin login process
 * - complete: Login successful
 * - fail: Login failed
 * - reset: Return to initial state
 * - retry: Retry login after failure
 */
const loginConfig = {
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

/**
 * Login form component
 * 
 * Handles user authentication with proper loading states and error handling.
 * Uses Stage Flow for state management and provides smooth transitions.
 */
function LoginForm() {
  const { currentStage, send, data, isTransitioning } = useStageFlow<AppStage, AppData>();
  
  // ... component implementation
}

// ❌ Avoid: Undocumented code
const config = {
  initial: 'idle',
  stages: [
    // No documentation explaining the purpose or behavior
  ]
};

function LoginForm() {
  // No documentation explaining the component's purpose
}
```

## 11. Error Handling

Implement proper error handling throughout your application.

```tsx
// ✅ Good: Comprehensive error handling
function RobustLoginForm() {
  const { currentStage, send, data, isTransitioning } = useStageFlow<AppStage, AppData>();
  
  const handleLogin = async (email: string, password: string) => {
    try {
      send('start', { email, password });
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const user = await response.json();
      send('complete', { user });
    } catch (error) {
      console.error('Login failed:', error);
      send('fail', { error: error.message });
    }
  };
  
  return (
    <div>
      {currentStage === 'idle' && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleLogin(
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
      
      {currentStage === 'error' && (
        <div>
          <p>Error: {data.error}</p>
          <button onClick={() => send('retry')}>Try Again</button>
        </div>
      )}
    </div>
  );
}

// ❌ Avoid: Poor error handling
function FragileLoginForm() {
  const { send } = useStageFlow<AppStage, AppData>();
  
  const handleLogin = async (email: string, password: string) => {
    send('start');
    
    // No error handling
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    const user = await response.json();
    send('complete', { user });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
    </form>
  );
}
```

## 12. Accessibility

Ensure your components are accessible to all users.

```tsx
// ✅ Good: Accessible components
function AccessibleLoginForm() {
  const { currentStage, send, data, isTransitioning } = useStageFlow<AppStage, AppData>();
  
  return (
    <div role="main" aria-live="polite" aria-label="Login form">
      {currentStage === 'idle' && (
        <form onSubmit={handleSubmit} aria-label="Login form">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            aria-describedby="email-help"
          />
          <div id="email-help">Enter your email address</div>
          
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            aria-describedby="password-help"
          />
          <div id="password-help">Enter your password</div>
          
          <button
            type="submit"
            disabled={isTransitioning}
            aria-busy={isTransitioning}
          >
            {isTransitioning ? 'Logging in...' : 'Login'}
          </button>
        </form>
      )}
      
      {currentStage === 'loading' && (
        <div role="status" aria-live="polite">
          <h1>Loading...</h1>
          <div className="spinner" aria-label="Loading spinner" />
        </div>
      )}
      
      {currentStage === 'error' && (
        <div role="alert" aria-live="assertive">
          <h1>Error</h1>
          <p>{data.error}</p>
          <button onClick={() => send('retry')}>Try Again</button>
        </div>
      )}
    </div>
  );
}

// ❌ Avoid: Inaccessible components
function InaccessibleLoginForm() {
  const { send } = useStageFlow<AppStage, AppData>();
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" required />
        <input name="password" type="password" required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
```

## Summary

Following these best practices will help you create:

- **Maintainable code** that's easy to understand and modify
- **Performant applications** that respond quickly to user interactions
- **Reliable applications** that handle errors gracefully
- **Accessible applications** that work for all users
- **Testable code** that's easy to verify and debug

## Next Steps

- **[Components](./components.md)** - Learn about React components
- **[Hooks](./hooks.md)** - Explore React hooks
- **[Patterns](./patterns.md)** - Discover advanced patterns
- **[Performance](./performance.md)** - Optimize your applications
- **[Integration](./integration.md)** - Integrate with other libraries

## Related Guides

- **[Getting Started](/guide/getting-started)** - Set up your first Stage Flow project
- **[Core Concepts](/guide/core-concepts)** - Learn the fundamental concepts
- **[Basic Usage](/guide/basic-usage)** - See basic usage patterns
- **[TypeScript Usage](/guide/typescript-usage)** - Advanced TypeScript features 