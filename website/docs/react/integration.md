# Library Integration

Stage Flow can be integrated with other popular React libraries to create powerful, feature-rich applications.

## React Router Integration

Integrate Stage Flow with React Router for navigation-based state management:

```tsx
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

function StageRouter() {
  const { currentStage, send } = useStageFlow<AppStage, AppData>();
  const navigate = useNavigate();
  
  // Navigate based on stage changes
  useEffect(() => {
    switch (currentStage) {
      case 'idle':
        navigate('/');
        break;
      case 'loading':
        navigate('/loading');
        break;
      case 'success':
        navigate('/dashboard');
        break;
      case 'error':
        navigate('/error');
        break;
    }
  }, [currentStage, navigate]);
  
  return (
    <Routes>
      <Route path="/" element={<IdleView />} />
      <Route path="/loading" element={<LoadingView />} />
      <Route path="/dashboard" element={<SuccessView />} />
      <Route path="/error" element={<ErrorView />} />
    </Routes>
  );
}

// Router configuration
const routerConfig = {
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

const routerEngine = new StageFlowEngine(routerConfig);

function App() {
  return (
    <BrowserRouter>
      <StageFlowProvider engine={routerEngine}>
        <StageRouter />
      </StageFlowProvider>
    </BrowserRouter>
  );
}
```


## Zustand Integration

Integrate Stage Flow with Zustand for lightweight state management:

```tsx
import { create } from 'zustand';

// Zustand store for stage machine
interface StageStore {
  currentStage: AppStage;
  data: AppData;
  setStage: (stage: AppStage, data: AppData) => void;
}

const useStageStore = create<StageStore>((set) => ({
  currentStage: 'idle',
  data: {},
  setStage: (stage, data) => set({ currentStage: stage, data })
}));

// Custom hook to sync Zustand with Stage Flow
function useStageZustandSync() {
  const setStage = useStageStore((state) => state.setStage);
  const { currentStage, data } = useStageFlow<AppStage, AppData>();
  
  useEffect(() => {
    setStage(currentStage, data);
  }, [currentStage, data, setStage]);
  
  return { currentStage, data };
}

// Zustand configuration
const zustandConfig = {
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

const zustandEngine = new StageFlowEngine(zustandConfig);

function App() {
  return (
    <StageFlowProvider engine={zustandEngine}>
      <YourApp />
    </StageFlowProvider>
  );
}
```

## React Query Integration

Integrate Stage Flow with React Query for data fetching:

```tsx
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Custom hook for data fetching with Stage Flow
function useDataFetching() {
  const { currentStage, send, data } = useStageFlow<AppStage, AppData>();
  
  const query = useQuery({
    queryKey: ['user', data.userId],
    queryFn: () => fetchUser(data.userId),
    enabled: currentStage === 'loading' && !!data.userId
  });
  
  const mutation = useMutation({
    mutationFn: (userData: UserData) => updateUser(userData),
    onSuccess: (result) => {
      send('complete', { user: result });
    },
    onError: (error) => {
      send('fail', { error: error.message });
    }
  });
  
  useEffect(() => {
    if (query.isSuccess) {
      send('complete', { user: query.data });
    } else if (query.isError) {
      send('fail', { error: query.error.message });
    }
  }, [query.isSuccess, query.isError, query.data, query.error, send]);
  
  return {
    currentStage,
    data,
    send,
    mutation
  };
}

// React Query configuration
const queryConfig = {
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

const queryEngine = new StageFlowEngine(queryConfig);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StageFlowProvider engine={queryEngine}>
        <YourApp />
      </StageFlowProvider>
    </QueryClientProvider>
  );
}
```

## Form Libraries Integration

Integrate Stage Flow with form libraries like React Hook Form:

```tsx
import { useForm, Controller } from 'react-hook-form';

// Custom hook for form handling with Stage Flow
function useFormStage() {
  const { currentStage, send, data } = useStageFlow<AppStage, AppData>();
  
  const form = useForm({
    defaultValues: {
      email: data.email || '',
      password: data.password || ''
    }
  });
  
  const onSubmit = (formData: FormData) => {
    send('start', formData);
  };
  
  const reset = () => {
    form.reset();
    send('reset');
  };
  
  return {
    currentStage,
    form,
    onSubmit,
    reset
  };
}

// Form configuration
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

const formEngine = new StageFlowEngine(formConfig);

function FormComponent() {
  const { currentStage, form, onSubmit, reset } = useFormStage();
  
  return (
    <StageFlowProvider engine={formEngine}>
      {currentStage === 'idle' && (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Controller
            name="email"
            control={form.control}
            render={({ field }) => (
              <input {...field} type="email" placeholder="Email" />
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field }) => (
              <input {...field} type="password" placeholder="Password" />
            )}
          />
          <button type="submit">Submit</button>
        </form>
      )}
      
      {currentStage === 'loading' && (
        <div>Loading...</div>
      )}
      
      {currentStage === 'success' && (
        <div>
          <h2>Success!</h2>
          <button onClick={reset}>Reset</button>
        </div>
      )}
      
      {currentStage === 'error' && (
        <div>
          <h2>Error</h2>
          <button onClick={reset}>Try Again</button>
        </div>
      )}
    </StageFlowProvider>
  );
}
```

## UI Library Integration

Integrate Stage Flow with UI libraries like Material-UI or Ant Design:

```tsx
import { Button, TextField, CircularProgress, Alert } from '@mui/material';

// Material-UI integration
function MaterialUIForm() {
  const { currentStage, send, data, isTransitioning } = useStageFlow<AppStage, AppData>();
  
  const handleSubmit = (formData: FormData) => {
    send('start', formData);
  };
  
  return (
    <div>
      {currentStage === 'idle' && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmit(formData);
        }}>
          <TextField
            name="email"
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            required
          />
          <TextField
            name="password"
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            required
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isTransitioning}
            fullWidth
          >
            {isTransitioning ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      )}
      
      {currentStage === 'loading' && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <CircularProgress />
          <p>Loading...</p>
        </div>
      )}
      
      {currentStage === 'success' && (
        <Alert severity="success">
          Success! Welcome, {data.user?.name}!
        </Alert>
      )}
      
      {currentStage === 'error' && (
        <Alert severity="error">
          Error: {data.error}
        </Alert>
      )}
    </div>
  );
}
```

## Testing Library Integration

Integrate Stage Flow with testing libraries:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StageFlowProvider } from '@stage-flow/react';

// Test configuration
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

const testEngine = new StageFlowEngine(testConfig);

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <StageFlowProvider engine={testEngine}>
      {children}
    </StageFlowProvider>
  );
}

// Test component
function TestComponent() {
  const { currentStage, send } = useStageFlow<AppStage, AppData>();
  
  return (
    <div>
      <div data-testid="stage">{currentStage}</div>
      <button onClick={() => send('start')}>Start</button>
      <button onClick={() => send('complete')}>Complete</button>
      <button onClick={() => send('fail')}>Fail</button>
      <button onClick={() => send('reset')}>Reset</button>
    </div>
  );
}

// Test
test('stage transitions work correctly', async () => {
  render(
    <TestWrapper>
      <TestComponent />
    </TestWrapper>
  );
  
  // Initial state
  expect(screen.getByTestId('stage')).toHaveTextContent('idle');
  
  // Start transition
  fireEvent.click(screen.getByText('Start'));
  expect(screen.getByTestId('stage')).toHaveTextContent('loading');
  
  // Complete transition
  fireEvent.click(screen.getByText('Complete'));
  expect(screen.getByTestId('stage')).toHaveTextContent('success');
  
  // Reset transition
  fireEvent.click(screen.getByText('Reset'));
  expect(screen.getByTestId('stage')).toHaveTextContent('idle');
});
```

## Next Steps

- **[Best Practices](./best-practices.md)** - Follow best practices

## Related Guides

- **[Getting Started](/docs/guide/getting-started)** - Set up your first Stage Flow project
- **[Core Concepts](/docs/guide/core-concepts)** - Learn the fundamental concepts
- **[Basic Usage](/docs/guide/basic-usage)** - See basic usage patterns
- **[TypeScript Usage](/docs/guide/typescript-usage)** - Advanced TypeScript features 