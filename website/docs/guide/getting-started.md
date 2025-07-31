# Getting Started

Learn how to set up and use Stage Flow in your React applications.

## Installation

Install the core packages:

```bash
npm install @stage-flow/core @stage-flow/react
```

For additional features, install optional packages:

```bash
# For plugins (logging, persistence, analytics)
npm install @stage-flow/plugins

# For testing utilities
npm install --save-dev @stage-flow/testing
```

## Basic Setup

### 1. Create Your First Stage Machine

```tsx
import { StageFlowEngine } from '@stage-flow/core';
import { StageFlowProvider, useStageFlow } from '@stage-flow/react';

// Define your stage and data types
type AppStage = 'loading' | 'form' | 'success' | 'error';
type AppData = { email?: string; error?: string };

// Create the stage configuration
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

// Create the engine
const engine = new StageFlowEngine<AppStage, AppData>(config);
```

### 2. Wrap Your App with Provider

```tsx
function App() {
  return (
    <StageFlowProvider engine={engine}>
      <FormComponent />
    </StageFlowProvider>
  );
}
```

### 3. Use the Hook in Components

```tsx
function FormComponent() {
  const { currentStage, send, data } = useStageFlow<AppStage, AppData>();
  
  const handleSubmit = (email: string) => {
    send('submit', { email });
  };
  
  const handleError = (error: string) => {
    send('fail', { error });
  };
  
  return (
    <div>
      {currentStage === 'loading' && (
        <div>Loading...</div>
      )}
      
      {currentStage === 'form' && (
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSubmit('user@example.com');
        }}>
          <input type="email" placeholder="Email" />
          <button type="submit">Submit</button>
        </form>
      )}
      
      {currentStage === 'success' && (
        <div>
          <h2>Success!</h2>
          <p>Email: {data?.email}</p>
          <button onClick={() => send('reset')}>Reset</button>
        </div>
      )}
      
      {currentStage === 'error' && (
        <div>
          <h2>Error</h2>
          <p>{data?.error}</p>
          <button onClick={() => send('retry')}>Retry</button>
        </div>
      )}
    </div>
  );
}
```

## TypeScript Setup

### 1. Define Your Types

```tsx
// Define stage names as a union type
type LoginStage = 'idle' | 'loading' | 'success' | 'error';

// Define your data structure
interface LoginData {
  email?: string;
  password?: string;
  error?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// Define events that can be sent
type LoginEvent = 'login' | 'success' | 'fail' | 'reset';
```

### 2. Create Type-Safe Configuration

```tsx
const loginConfig: StageFlowConfig<LoginStage, LoginData> = {
  initial: 'idle',
  stages: [
    {
      name: 'idle',
      transitions: [{ target: 'loading', event: 'login' }]
    },
    {
      name: 'loading',
      transitions: [
        { target: 'success', event: 'success' },
        { target: 'error', event: 'fail' }
      ]
    },
    {
      name: 'success',
      transitions: [{ target: 'idle', event: 'reset' }]
    },
    {
      name: 'error',
      transitions: [{ target: 'idle', event: 'reset' }]
    }
  ]
};
```

### 3. Use with Full Type Safety

```tsx
function LoginForm() {
  const { currentStage, send, data } = useStageFlow<LoginStage, LoginData>();
  
  // TypeScript will ensure type safety
  const handleLogin = (email: string, password: string) => {
    send('login', { email, password });
  };
  
  const handleSuccess = (user: LoginData['user']) => {
    send('success', { user });
  };
  
  const handleError = (error: string) => {
    send('fail', { error });
  };
  
  return (
    <div>
      {currentStage === 'idle' && (
        <form onSubmit={(e) => {
          e.preventDefault();
          handleLogin('user@example.com', 'password');
        }}>
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button type="submit">Login</button>
        </form>
      )}
      
      {currentStage === 'loading' && (
        <div>Logging in...</div>
      )}
      
      {currentStage === 'success' && data?.user && (
        <div>
          <h2>Welcome, {data.user.name}!</h2>
          <button onClick={() => send('reset')}>Logout</button>
        </div>
      )}
      
      {currentStage === 'error' && (
        <div>
          <p>Error: {data?.error}</p>
          <button onClick={() => send('reset')}>Try Again</button>
        </div>
      )}
    </div>
  );
}
```

## Advanced Setup

### 1. Using Plugins

```tsx
import { LoggingPlugin, PersistencePlugin } from '@stage-flow/plugins';

const engine = new StageFlowEngine(config, {
  plugins: [
    new LoggingPlugin({
      level: 'info',
      includeContext: true
    }),
    new PersistencePlugin({
      key: 'app-state',
      storage: localStorage
    })
  ]
});
```

### 2. Using Middleware

```tsx
import { createValidationMiddleware, createLoggingMiddleware } from '@stage-flow/core';

const engine = new StageFlowEngine(config, {
  middleware: [
    createValidationMiddleware({
      validate: (data) => {
        if (!data.email) {
          throw new Error('Email is required');
        }
        return data;
      }
    }),
    createLoggingMiddleware({
      logLevel: 'info'
    })
  ]
});
```

### 3. Using Effects

Effects are defined in the configuration, not in the engine constructor:

```tsx
const config = {
  initial: 'idle',
  stages: [
    {
      name: 'idle',
      transitions: [
        {
          target: 'loading',
          event: 'login',
          condition: async (context) => {
            const response = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(context.data)
            });
            
            if (!response.ok) {
              throw new Error('Login failed');
            }
            
            const user = await response.json();
            context.data = { ...context.data, user };
            return true;
          }
        }
      ]
    }
  ]
};
```

## Project Structure

Here's a recommended project structure for Stage Flow applications:

```
src/
├── stages/
│   ├── auth/
│   │   ├── auth.config.ts
│   │   ├── auth.types.ts
│   │   └── auth.effects.ts
│   ├── checkout/
│   │   ├── checkout.config.ts
│   │   ├── checkout.types.ts
│   │   └── checkout.effects.ts
│   └── index.ts
├── components/
│   ├── AuthForm.tsx
│   ├── CheckoutForm.tsx
│   └── StageRenderer.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useCheckout.ts
│   └── index.ts
├── utils/
│   ├── engine.ts
│   ├── plugins.ts
│   └── middleware.ts
└── App.tsx
```

### Example File Structure

**`src/stages/auth/auth.types.ts`**
```tsx
export type AuthStage = 'idle' | 'loading' | 'success' | 'error';
export type AuthEvent = 'login' | 'success' | 'fail' | 'reset';

export interface AuthData {
  email?: string;
  password?: string;
  error?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}
```

**`src/stages/auth/auth.config.ts`**
```tsx
import { StageFlowConfig } from '@stage-flow/core';
import { AuthStage, AuthData } from './auth.types';

export const authConfig: StageFlowConfig<AuthStage, AuthData> = {
  initial: 'idle',
  stages: [
    {
      name: 'idle',
      transitions: [{ target: 'loading', event: 'login' }]
    },
    {
      name: 'loading',
      transitions: [
        { target: 'success', event: 'success' },
        { target: 'error', event: 'fail' }
      ]
    },
    {
      name: 'success',
      transitions: [{ target: 'idle', event: 'reset' }]
    },
    {
      name: 'error',
      transitions: [{ target: 'idle', event: 'reset' }]
    }
  ]
};
```

**`src/hooks/useAuth.ts`**
```tsx
import { useStageFlow } from '@stage-flow/react';
import { AuthStage, AuthData } from '../stages/auth/auth.types';

export function useAuth() {
  return useStageFlow<AuthStage, AuthData>();
}
```

## Next Steps

- [Core Concepts](/guide/core-concepts) - Learn the fundamental concepts
- [Basic Usage](/guide/basic-usage) - See basic usage patterns
- [TypeScript Usage](/guide/typescript-usage) - Advanced TypeScript features
- [React Integration](/react/index) - React-specific features
- [Plugin System](/guide/plugin-system) - Extend functionality with plugins
- [Middleware](/guide/middleware) - Add processing layers
- [Effects System](/guide/effects-system) - Handle side effects
- [Testing](/guide/testing) - Test your stage machines 