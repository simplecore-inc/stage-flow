# Basic Usage

Learn how to use Stage Flow for common scenarios and patterns.

## Simple Form Flow

Create a basic form with loading, success, and error states:

```tsx
import { StageFlowEngine } from '@stage-flow/core';
import { StageFlowProvider, StageRenderer } from '@stage-flow/react';

// Define types
type FormStage = 'idle' | 'loading' | 'success' | 'error';
type FormData = { email?: string; password?: string; error?: string };

// Create configuration
const formConfig = {
  initial: 'idle' as const,
  stages: [
    {
      name: 'idle',
      transitions: [{ target: 'loading', event: 'submit' }]
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
      transitions: [{ target: 'idle', event: 'retry' }]
    }
  ]
};

// Create engine
const engine = new StageFlowEngine<FormStage, FormData>(formConfig);

// Stage components
function IdleComponent({ data, send }) {
  const handleSubmit = async (email: string, password: string) => {
    send('submit', { email, password });
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        send('success');
      } else {
        send('fail', { error: 'Login failed' });
      }
    } catch (error) {
      send('fail', { error: 'Network error' });
    }
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
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  );
}

function LoadingComponent({ data, send }) {
  return <div>Logging in...</div>;
}

function SuccessComponent({ data, send }) {
  return (
    <div>
      <h2>Success!</h2>
      <p>Welcome back!</p>
      <button onClick={() => send('reset')}>Logout</button>
    </div>
  );
}

function ErrorComponent({ data, send }) {
  return (
    <div>
      <h2>Error</h2>
      <p>{data.error}</p>
      <button onClick={() => send('retry')}>Try Again</button>
    </div>
  );
}

// React app
function FormApp() {
  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        stageComponents={{
          idle: IdleComponent,
          loading: LoadingComponent,
          success: SuccessComponent,
          error: ErrorComponent
        }}
      />
    </StageFlowProvider>
  );
}
```

## Multi-Step Wizard

Create a multi-step wizard with navigation:

```tsx
type WizardStage = 'step1' | 'step2' | 'step3' | 'complete';
type WizardData = {
  name?: string;
  email?: string;
  preferences?: string[];
  summary?: string;
};

const wizardConfig = {
  initial: 'step1' as const,
  stages: [
    {
      name: 'step1',
      transitions: [
        { target: 'step2', event: 'next' },
        { target: 'step1', event: 'back' }
      ]
    },
    {
      name: 'step2',
      transitions: [
        { target: 'step3', event: 'next' },
        { target: 'step1', event: 'back' }
      ]
    },
    {
      name: 'step3',
      transitions: [
        { target: 'complete', event: 'next' },
        { target: 'step2', event: 'back' }
      ]
    },
    {
      name: 'complete',
      transitions: [
        { target: 'step1', event: 'restart' }
      ]
    }
  ]
};

function Step1Component({ data, send }) {
  const [name, setName] = React.useState(data.name || '');
  
  return (
    <div>
      <h2>Step 1: Personal Information</h2>
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={() => send('next', { name })} disabled={!name}>
        Next
      </button>
    </div>
  );
}

function Step2Component({ data, send }) {
  const [email, setEmail] = React.useState(data.email || '');
  
  return (
    <div>
      <h2>Step 2: Contact Information</h2>
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={() => send('back')}>Back</button>
      <button onClick={() => send('next', { email })} disabled={!email}>
        Next
      </button>
    </div>
  );
}

function Step3Component({ data, send }) {
  const [preferences, setPreferences] = React.useState<string[]>(data.preferences || []);
  
  const togglePreference = (pref: string) => {
    setPreferences(prev => 
      prev.includes(pref) 
        ? prev.filter(p => p !== pref)
        : [...prev, pref]
    );
  };
  
  return (
    <div>
      <h2>Step 3: Preferences</h2>
      <label>
        <input
          type="checkbox"
          checked={preferences.includes('newsletter')}
          onChange={() => togglePreference('newsletter')}
        />
        Newsletter
      </label>
      <label>
        <input
          type="checkbox"
          checked={preferences.includes('notifications')}
          onChange={() => togglePreference('notifications')}
        />
        Notifications
      </label>
      <button onClick={() => send('back')}>Back</button>
      <button onClick={() => send('next', { preferences })}>
        Complete
      </button>
    </div>
  );
}

function CompleteComponent({ data, send }) {
  return (
    <div>
      <h2>Complete!</h2>
      <p>Name: {data.name}</p>
      <p>Email: {data.email}</p>
      <p>Preferences: {data.preferences?.join(', ')}</p>
      <button onClick={() => send('restart')}>Start Over</button>
    </div>
  );
}

function WizardApp() {
  const engine = new StageFlowEngine<WizardStage, WizardData>(wizardConfig);
  
  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        stageComponents={{
          step1: Step1Component,
          step2: Step2Component,
          step3: Step3Component,
          complete: CompleteComponent
        }}
      />
    </StageFlowProvider>
  );
}
```

## Data Persistence

Save and restore application state:

```tsx
import { PersistencePlugin } from '@stage-flow/plugins';

type AppStage = 'form' | 'success' | 'error';
type AppData = { email?: string; user?: User };

const config = {
  initial: 'form' as const,
  stages: [
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

// Create engine with persistence
const engine = new StageFlowEngine<AppStage, AppData>(config, {
  plugins: [
    new PersistencePlugin({
      key: 'app-state',
      storage: localStorage,
      serialize: (data) => JSON.stringify(data),
      deserialize: (str) => JSON.parse(str)
    })
  ]
});

function FormComponent({ data, send }) {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      send('submit', { email: formData.get('email') as string });
    }}>
      <input name="email" type="email" defaultValue={data?.email} />
      <button type="submit">Submit</button>
    </form>
  );
}

function SuccessComponent({ data, send }) {
  return (
    <div>
      <h2>Success!</h2>
      <p>Email: {data?.email}</p>
      <button onClick={() => send('reset')}>Reset</button>
    </div>
  );
}

function ErrorComponent({ data, send }) {
  return (
    <div>
      <h2>Error</h2>
      <p>{data?.error}</p>
      <button onClick={() => send('retry')}>Retry</button>
    </div>
  );
}

function App() {
  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        stageComponents={{
          form: FormComponent,
          success: SuccessComponent,
          error: ErrorComponent
        }}
      />
    </StageFlowProvider>
  );
}
```

## Conditional Rendering

Render different components based on the current stage:

```tsx
function ConditionalApp() {
  const engine = new StageFlowEngine<AppStage, AppData>(config);
  
  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        stageComponents={{
          form: FormView,
          success: SuccessView,
          error: ErrorView
        }}
        fallbackComponent={({ currentStage }) => (
          <div>Unknown stage: {currentStage}</div>
        )}
      />
    </StageFlowProvider>
  );
}

function FormView({ data, send }) {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      send('submit', { email: formData.get('email') as string });
    }}>
      <input name="email" type="email" />
      <button type="submit">Submit</button>
    </form>
  );
}

function SuccessView({ data, send }) {
  return (
    <div>
      <h2>Success!</h2>
      <p>Email: {data?.email}</p>
      <button onClick={() => send('reset')}>Reset</button>
    </div>
  );
}

function ErrorView({ data, send }) {
  return (
    <div>
      <h2>Error</h2>
      <p>{data?.error}</p>
      <button onClick={() => send('retry')}>Retry</button>
    </div>
  );
}
```

## Event Handling

Handle different types of events:

```tsx
function EventHandlingExample() {
  const engine = new StageFlowEngine<AppStage, AppData>(config);
  
  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        stageComponents={{
          form: FormWithEvents,
          success: SuccessWithEvents,
          error: ErrorWithEvents
        }}
      />
    </StageFlowProvider>
  );
}

function FormWithEvents({ data, send }) {
  const handleClick = (event: string, data?: any) => {
    send(event, data);
  };
  
  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      send('submit');
    } else if (event.key === 'Escape') {
      send('cancel');
    }
  };
  
  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    send('submit', {
      email: formData.get('email'),
      password: formData.get('password')
    });
  };
  
  return (
    <div onKeyDown={handleKeyPress}>
      <button onClick={() => handleClick('submit')}>Submit</button>
      <button onClick={() => handleClick('cancel')}>Cancel</button>
      <button onClick={() => handleClick('reset')}>Reset</button>
      
      <form onSubmit={handleFormSubmit}>
        <input name="email" type="email" />
        <input name="password" type="password" />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

function SuccessWithEvents({ data, send }) {
  return (
    <div>
      <h2>Success!</h2>
      <button onClick={() => send('reset')}>Reset</button>
    </div>
  );
}

function ErrorWithEvents({ data, send }) {
  return (
    <div>
      <h2>Error</h2>
      <button onClick={() => send('retry')}>Retry</button>
    </div>
  );
}
```

## Data Transformation

Transform data during transitions:

```tsx
const config = {
  initial: 'form' as const,
  stages: [
    {
      name: 'form',
      transitions: [
        {
          target: 'success',
          event: 'submit',
          transform: (data) => ({
            user: {
              id: 'user-123',
              email: data.email,
              name: data.email?.split('@')[0] || 'User'
            }
          })
        }
      ]
    },
    {
      name: 'success',
      transitions: [
        {
          target: 'form',
          event: 'reset',
          transform: () => ({ email: '', password: '' })
        }
      ]
    }
  ]
};

function FormWithTransform({ data, send }) {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      send('submit', { email: formData.get('email') as string });
    }}>
      <input name="email" type="email" defaultValue={data?.email} />
      <button type="submit">Submit</button>
    </form>
  );
}

function SuccessWithTransform({ data, send }) {
  return (
    <div>
      <h2>Success!</h2>
      <p>Welcome, {data?.user?.name}!</p>
      <p>Email: {data?.user?.email}</p>
      <button onClick={() => send('reset')}>Reset</button>
    </div>
  );
}
```

## Validation

Add validation to your transitions:

```tsx
const config = {
  initial: 'form' as const,
  stages: [
    {
      name: 'form',
      transitions: [
        {
          target: 'success',
          event: 'submit',
          guard: (data) => {
            if (!data.email) {
              throw new Error('Email is required');
            }
            if (!data.password) {
              throw new Error('Password is required');
            }
            if (data.password.length < 6) {
              throw new Error('Password must be at least 6 characters');
            }
            return true;
          }
        },
        {
          target: 'error',
          event: 'fail'
        }
      ]
    }
  ]
};

function FormWithValidation({ data, send }) {
  const handleSubmit = async (formData: any) => {
    try {
      await send('submit', formData);
    } catch (error) {
      await send('fail', { error: error.message });
    }
  };
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleSubmit({
        email: formData.get('email'),
        password: formData.get('password')
      });
    }}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Submit</button>
    </form>
  );
}

function ErrorWithValidation({ data, send }) {
  return (
    <div>
      <p>Error: {data?.error}</p>
      <button onClick={() => send('retry')}>Try Again</button>
    </div>
  );
}
```

## Async Operations

Handle asynchronous operations with effects:

```tsx
const config = {
  initial: 'idle' as const,
  stages: [
    {
      name: 'idle',
      transitions: [{ target: 'loading', event: 'fetch' }]
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
      transitions: [{ target: 'idle', event: 'retry' }]
    }
  ]
};

function IdleComponent({ data, send }) {
  const fetchData = async () => {
    send('fetch');
    
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      send('success', result);
    } catch (error) {
      send('fail', { error: error.message });
    }
  };
  
  return (
    <button onClick={fetchData}>Fetch Data</button>
  );
}

function LoadingComponent({ data, send }) {
  return <div>Loading...</div>;
}

function SuccessComponent({ data, send }) {
  return (
    <div>
      <h2>Data loaded!</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button onClick={() => send('reset')}>Reset</button>
    </div>
  );
}

function ErrorComponent({ data, send }) {
  return (
    <div>
      <p>Error: {data?.error}</p>
      <button onClick={() => send('retry')}>Retry</button>
    </div>
  );
}
```

## Timer Control

Stage Flow provides comprehensive timer control for automatic transitions. You can pause, resume, and reset timers, as well as monitor their state in real-time.

### Automatic Transitions

Configure stages with automatic transitions using the `after` property:

```tsx
const config = {
  initial: 'idle' as const,
  stages: [
    {
      name: 'idle',
      transitions: [
        { target: 'loading', event: 'start' },
        { target: 'success', after: 5000 } // Auto-advance after 5 seconds
      ]
    },
    {
      name: 'loading',
      transitions: [
        { target: 'success', event: 'complete' },
        { target: 'error', event: 'fail' },
        { target: 'error', after: 10000 } // Auto-timeout after 10 seconds
      ]
    },
    {
      name: 'success',
      transitions: [
        { target: 'idle', event: 'reset' },
        { target: 'idle', after: 3000 } // Auto-reset after 3 seconds
      ]
    }
  ]
};
```

### Timer Control Methods

Access timer control functionality through stage component props:

```tsx
function TimerControlComponent({ 
  data, 
  send, 
  pauseTimers,
  resumeTimers,
  resetTimers,
  getTimerRemainingTime,
  areTimersPaused 
}) {
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
  }, [getTimerRemainingTime, areTimersPaused]);

  const handleMouseEnter = React.useCallback(() => {
    pauseTimers(); // Pause timers on hover
  }, [pauseTimers]);

  const handleMouseLeave = React.useCallback(() => {
    resumeTimers(); // Resume timers on mouse leave
  }, [resumeTimers]);

  const handleReset = React.useCallback(() => {
    resetTimers(); // Reset timers to original duration
  }, [resetTimers]);

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <h3>Timer: {remainingTime}ms {isPaused ? '(Paused)' : ''}</h3>
      <button onClick={handleReset}>Reset Timer</button>
    </div>
  );
}
```

### Timer State Monitoring

Monitor timer state for UI updates:

```tsx
function TimerDisplay({ getTimerRemainingTime, areTimersPaused }) {
  const [remainingTime, setRemainingTime] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime(getTimerRemainingTime());
      setIsPaused(areTimersPaused());
    }, 100);

    return () => clearInterval(interval);
  }, [getTimerRemainingTime, areTimersPaused]);

  return (
    <div>
      <p>Remaining: {remainingTime}ms</p>
      <p>Status: {isPaused ? 'Paused' : 'Running'}</p>
    </div>
  );
}
```

### Best Practices for Timer Control

1. **Use Real-time Updates**: Update timer display frequently (every 100ms) for smooth UX
2. **Handle Pause States**: Show visual feedback when timers are paused
3. **Reset Functionality**: Provide reset buttons for user control
4. **Mouse Interactions**: Use hover events for intuitive pause/resume
5. **Stage-specific Logic**: Only apply timer controls to relevant stages

## Best Practices

### 1. Keep Components Simple

```tsx
// ✅ Good: Simple, focused components
function FormComponent({ data, send }) {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      send('submit', { email: formData.get('email') as string });
    }}>
      <input name="email" type="email" defaultValue={data?.email} />
      <button type="submit">Submit</button>
    </form>
  );
}

// ❌ Avoid: Complex components with many responsibilities
function ComplexComponent({ data, send }) {
  // Too many responsibilities in one component
  return (
    <div>
      {/* Form logic */}
      {/* Validation logic */}
      {/* API calls */}
      {/* Error handling */}
      {/* Navigation */}
    </div>
  );
}
```

### 2. Use Type Safety

```tsx
// ✅ Good: Explicit types
type AppStage = 'form' | 'success' | 'error';
type AppData = { email?: string; error?: string };

function FormComponent({ data, send }: StageProps<AppStage, AppData>) {
  // TypeScript ensures type safety
  send('submit', { email: 'user@example.com' });
}

// ❌ Avoid: Using any
function FormComponent({ data, send }: any) {
  // No type safety
}
```

### 3. Handle Errors Gracefully

```tsx
// ✅ Good: Proper error handling
function FormComponent({ data, send }) {
  const handleSubmit = async (formData: any) => {
    try {
      await send('submit', formData);
    } catch (error) {
      await send('fail', { error: error.message });
    }
  };
}

// ❌ Avoid: Ignoring errors
function FormComponent({ data, send }) {
  const handleSubmit = async (formData: any) => {
    send('submit', formData); // No error handling
  };
}
```

### 4. Use Descriptive Stage Names

```tsx
// ✅ Good: Clear, descriptive names
type AppStage = 'userInput' | 'processing' | 'success' | 'error';

// ❌ Avoid: Unclear names
type AppStage = 's1' | 's2' | 's3' | 's4';
```

## Next Steps

- [TypeScript Usage](/docs/guide/typescript-usage) - Advanced TypeScript features
- [React Integration](/docs/react/index) - React-specific features
- [Plugin System](/docs/guide/plugin-system) - Extend functionality with plugins
- [Middleware](/docs/guide/middleware) - Add processing layers

- [Testing](/docs/guide/testing) - Test your stage machines 