---
id: react-patterns
title: React Patterns
sidebar_label: React Patterns
---

# React Patterns with Stage Flow

This guide covers common React patterns and best practices when using Stage Flow in your applications.

## Overview

Stage Flow integrates seamlessly with React, providing several patterns for managing application state and UI flow. This document covers the most common patterns you'll encounter when building React applications with Stage Flow.

## Table of Contents

- [Custom Hook Patterns](#custom-hook-patterns)
- [Component Patterns](#component-patterns)
- [Context Patterns](#context-patterns)
- [Render Props Patterns](#render-props-patterns)
- [Higher-Order Component Patterns](#higher-order-component-patterns)
- [Performance Patterns](#performance-patterns)

## Custom Hook Patterns

### Form Stage Hook

Create reusable hooks for form handling:

```tsx
// Custom hook for form handling
function useFormStage() {
  // Form stage configuration
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

  const engine = new StageFlowEngine(formConfig);
  const { currentStage, send, data, isTransitioning } = useStageFlow(engine);
  
  const isFormStage = currentStage === 'idle';
  const isLoading = currentStage === 'loading';
  const isSuccess = currentStage === 'success';
  const isError = currentStage === 'error';
  
  const submit = (formData) => {
    send('start', formData);
  };
  
  const reset = () => {
    send('reset');
  };
  
  const retry = () => {
    send('retry');
  };
  
  return {
    currentStage,
    data,
    isFormStage,
    isLoading,
    isSuccess,
    isError,
    isTransitioning,
    submit,
    reset,
    retry
  };
}

// Usage
function LoginForm() {
  const { isFormStage, isLoading, submit, data } = useFormStage();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    submit({
      email: formData.get('email'),
      password: formData.get('password')
    });
  };
  
  if (isLoading) {
    return <div>Submitting...</div>;
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Authentication Hook

```tsx
// Custom hook for authentication
function useAuth() {
  // Authentication stage configuration
  const authConfig = {
    initial: 'unauthenticated',
    stages: [
      {
        name: 'unauthenticated',
        transitions: [{ target: 'authenticating', event: 'login' }]
      },
      {
        name: 'authenticating',
        transitions: [
          { target: 'authenticated', event: 'success' },
          { target: 'error', event: 'fail' }
        ]
      },
      {
        name: 'authenticated',
        transitions: [{ target: 'unauthenticated', event: 'logout' }]
      },
      {
        name: 'error',
        transitions: [{ target: 'unauthenticated', event: 'retry' }]
      }
    ]
  };

  const engine = new StageFlowEngine(authConfig);
  const { currentStage, send, data } = useStageFlow(engine);
  
  const isAuthenticated = currentStage === 'authenticated';
  const isAuthenticating = currentStage === 'authenticating';
  const hasError = currentStage === 'error';
  
  const login = (email, password) => {
    send('login', { email, password });
  };
  
  const logout = () => {
    send('logout');
  };
  
  const retry = () => {
    send('retry');
  };
  
  return {
    currentStage,
    user: data.user,
    error: data.error,
    isAuthenticated,
    isAuthenticating,
    hasError,
    login,
    logout,
    retry
  };
}

// Usage with StageRenderer
function LoginForm() {
  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        engine={engine}
        stageComponents={{
          unauthenticated: UnauthenticatedView,
          authenticating: AuthenticatingView,
          authenticated: AuthenticatedView,
          error: ErrorView
        }}
      />
    </StageFlowProvider>
  );
}

function UnauthenticatedView({ stage, data, send, goTo, isTransitioning }) {
  const handleLogin = (email, password) => {
    send('login', { email, password });
  };
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleLogin(
        formData.get('email'),
        formData.get('password')
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

function AuthenticatingView({ stage, data, send, goTo, isTransitioning }) {
  return (
    <div>
      <h2>Authenticating...</h2>
      <div className="spinner" />
    </div>
  );
}

function AuthenticatedView({ stage, data, send, goTo, isTransitioning }) {
  const handleLogout = () => {
    send('logout');
  };
  
  return (
    <div>
      <h2>Welcome!</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

function ErrorView({ stage, data, send, goTo, isTransitioning }) {
  const handleRetry = () => {
    send('retry');
  };
  
  return (
    <div>
      <h2>Error</h2>
      <p>Error: {data.error}</p>
      <button onClick={handleRetry}>Try Again</button>
    </div>
  );
}
```

## Component Patterns

### Stage-Specific Components

Create components that are specific to each stage:

```tsx
// Stage-specific components
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

function LoadingView({ stage, data, send, goTo, isTransitioning }) {
  return (
    <div>
      <h1>Loading...</h1>
      <div className="spinner" />
    </div>
  );
}

function SuccessView({ stage, data, send, goTo, isTransitioning }) {
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
}

function ErrorView({ stage, data, send, goTo, isTransitioning }) {
  const handleRetry = () => {
    send('retry');
  };
  
  return (
    <div>
      <h1>Error</h1>
      <p>{data.error}</p>
      <button onClick={handleRetry}>Try Again</button>
    </div>
  );
}

// Main app component
function App() {
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

  const engine = new StageFlowEngine(config);

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
        disableAnimations={false}
        style={{ minHeight: "400px" }}
      />
    </StageFlowProvider>
  );
}
```

### Conditional Rendering Pattern

Use conditional rendering for simple cases:

```tsx
function ConditionalApp() {
  const { currentStage, send, data, isTransitioning } = useStageFlow();
  
  if (currentStage === 'idle') {
    return (
      <div>
        <h1>Welcome</h1>
        <button onClick={() => send('start')} disabled={isTransitioning}>
          {isTransitioning ? 'Starting...' : 'Start'}
        </button>
      </div>
    );
  }
  
  if (currentStage === 'loading') {
    return (
      <div>
        <h1>Loading...</h1>
        <div className="spinner" />
      </div>
    );
  }
  
  if (currentStage === 'success') {
    return (
      <div>
        <h1>Success!</h1>
        <p>Welcome, {data.user?.name}!</p>
        <button onClick={() => send('reset')}>Reset</button>
      </div>
    );
  }
  
  if (currentStage === 'error') {
    return (
      <div>
        <h1>Error</h1>
        <p>{data.error}</p>
        <button onClick={() => send('retry')}>Try Again</button>
      </div>
    );
  }
  
  return null;
}
```

## Context Patterns

### Stage Context Provider

Create a context for sharing stage state:

```tsx
// Create a context for your stage machine
const StageContext = createContext({
  engine: null,
  currentStage: '',
  data: {},
  send: () => Promise.resolve(),
  goTo: () => Promise.resolve(),
  isTransitioning: false
});

// Provider component
function StageProvider({ children, engine }) {
  const { currentStage, send, data, goTo, isTransitioning } = useStageFlow(engine);
  
  return (
    <StageContext.Provider value={{ 
      engine, 
      currentStage, 
      send, 
      data, 
      goTo, 
      isTransitioning 
    }}>
      {children}
    </StageContext.Provider>
  );
}

// Hook to use the context
function useStageContext() {
  const context = useContext(StageContext);
  if (!context) {
    throw new Error('useStageContext must be used within a StageProvider');
  }
  return context;
}

// Usage
function App() {
  const stageConfig = {
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

  const engine = new StageFlowEngine(stageConfig);
  
  return (
    <StageProvider engine={engine}>
      <YourApp />
    </StageProvider>
  );
}

function YourApp() {
  const { currentStage, send, data, isTransitioning } = useStageContext();
  
  return (
    <div>
      {currentStage === 'idle' && (
        <button onClick={() => send('start')} disabled={isTransitioning}>
          Start
        </button>
      )}
      
      {currentStage === 'loading' && (
        <div>Loading...</div>
      )}
      
      {currentStage === 'success' && (
        <div>
          <h1>Success!</h1>
          <button onClick={() => send('reset')}>Reset</button>
        </div>
      )}
      
      {currentStage === 'error' && (
        <div>
          <h1>Error</h1>
          <button onClick={() => send('retry')}>Try Again</button>
        </div>
      )}
    </div>
  );
}
```

## Render Props Patterns

### Stage Manager Component

Use render props for flexible stage management:

```tsx
// Render props component for stage management
function StageManager({ engine, children }) {
  const { currentStage, data, send, goTo, isTransitioning } = useStageFlow(engine);
  
  return children({
    currentStage,
    data,
    send,
    goTo,
    isTransitioning
  });
}

// Usage
function App() {
  const engine = new StageFlowEngine(config);
  
  return (
    <StageFlowProvider engine={engine}>
      <StageManager engine={engine}>
        {({ currentStage, send, data, isTransitioning }) => (
          <div>
            {currentStage === 'idle' && (
              <div>
                <h1>Welcome</h1>
                <button onClick={() => send('start')} disabled={isTransitioning}>
                  Start
                </button>
              </div>
            )}
            
            {currentStage === 'loading' && (
              <div>Loading...</div>
            )}
            
            {currentStage === 'success' && (
              <div>
                <h1>Success!</h1>
                <p>Welcome, {data.user?.name}!</p>
                <button onClick={() => send('reset')}>Reset</button>
              </div>
            )}
            
            {currentStage === 'error' && (
              <div>
                <h1>Error</h1>
                <p>{data.error}</p>
                <button onClick={() => send('retry')}>Try Again</button>
              </div>
            )}
          </div>
        )}
      </StageManager>
    </StageFlowProvider>
  );
}
```

## Higher-Order Component Patterns

### Stage Wrapper HOC

Create higher-order components for stage management:

```tsx
// Higher-order component for stage management
function withStage(targetStage, Component) {
  return function WrappedComponent(props) {
    const { currentStage, send, data } = useStageFlow();
    
    if (currentStage !== targetStage) {
      return null;
    }
    
    return <Component {...props} send={send} data={data} />;
  };
}

// Usage
const IdleView = withStage('idle', function IdleView({ send }) {
  return (
    <div>
      <h1>Welcome</h1>
      <button onClick={() => send('start')}>Start</button>
    </div>
  );
});

const LoadingView = withStage('loading', function LoadingView() {
  return (
    <div>
      <h1>Loading...</h1>
      <div className="spinner" />
    </div>
  );
});

const SuccessView = withStage('success', function SuccessView({ send, data }) {
  return (
    <div>
      <h1>Success!</h1>
      <p>Welcome, {data.user?.name}!</p>
      <button onClick={() => send('reset')}>Reset</button>
    </div>
  );
});

function App() {
  const engine = new StageFlowEngine(config);
  
  return (
    <StageFlowProvider engine={engine}>
      <IdleView />
      <LoadingView />
      <SuccessView />
    </StageFlowProvider>
  );
}
```

## Performance Patterns

### Memoized Components

Optimize performance with memoization:

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

const StageComponents = React.useMemo(() => ({
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

### Lazy Loading

Lazy load stage components for better performance:

```tsx
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

// Lazy load components
const LazyIdleView = React.lazy(() => import('./IdleView'));
const LazyLoadingView = React.lazy(() => import('./LoadingView'));
const LazySuccessView = React.lazy(() => import('./SuccessView'));
const LazyErrorView = React.lazy(() => import('./ErrorView'));

function App() {
  return (
    <StageFlowProvider engine={lazyEngine}>
      <Suspense fallback={<div>Loading...</div>}>
        <StageRenderer
          engine={lazyEngine}
          stageComponents={{
            idle: LazyIdleView,
            loading: LazyLoadingView,
            success: LazySuccessView,
            error: LazyErrorView
          }}
          disableAnimations={false}
          style={{ minHeight: "400px" }}
        />
      </Suspense>
    </StageFlowProvider>
  );
}
```

### Dynamic Configuration

Create dynamic stage configurations:

```tsx
// Dynamic configuration based on props or state
function useDynamicConfig(features) {
  return React.useMemo(() => {
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

function DynamicApp({ features }) {
  const engine = useDynamicConfig(features);
  
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

## Summary

These patterns provide a solid foundation for building React applications with Stage Flow. Choose the pattern that best fits your use case:

- **Custom Hooks**: For reusable logic and state management
- **Component Patterns**: For simple stage-specific UI
- **Context Patterns**: For sharing state across components
- **Render Props**: For flexible component composition
- **HOCs**: For wrapping components with stage logic
- **Performance Patterns**: For optimizing rendering and loading

Remember to keep components focused, handle loading states, use error boundaries, and maintain consistent naming conventions for the best developer experience.
