# TypeScript Usage

Learn how to leverage TypeScript's advanced features with Stage Flow for maximum type safety and developer experience.

## Advanced Type Patterns

### Generic Type Parameters

Use generic type parameters to create reusable stage configurations:

```tsx
// Generic stage configuration
interface StageConfig<TStage extends string, TData = any> {
  initial: TStage;
  stages: Array<{
    name: TStage;
    transitions: Array<{
      target: TStage;
      event: string;
      guard?: (data: TData) => boolean;
      transform?: (data: TData) => TData;
    }>;
  }>;
}

// Type-safe stage machine factory
function createStageMachine<TStage extends string, TData>(
  config: StageConfig<TStage, TData>
): StageFlowEngine<TStage, TData> {
  return new StageFlowEngine<TStage, TData>(config);
}

// Usage with specific types
type LoginStage = 'idle' | 'loading' | 'success' | 'error';
type LoginData = { email?: string; password?: string; user?: User; error?: string };

const loginConfig: StageConfig<LoginStage, LoginData> = {
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
      transitions: [{ target: 'idle', event: 'retry' }]
    }
  ]
};

const loginEngine = createStageMachine(loginConfig);
```

### Conditional Types

Use conditional types to create dynamic type definitions:

```tsx
// Conditional type for stage-specific data
type StageData<TStage extends string, TData> = TStage extends 'loading' 
  ? TData & { isLoading: true }
  : TStage extends 'error'
  ? TData & { error: string }
  : TData;

// Conditional type for valid events
type ValidEvents<TStage extends string, TConfig> = TConfig extends {
  stages: Array<{ name: TStage; transitions: Array<{ event: infer E }> }
} ? E : never;

// Usage
type LoginStage = 'idle' | 'loading' | 'success' | 'error';
type LoginData = { email?: string; user?: User };

type LoadingData = StageData<'loading', LoginData>; // { email?: string; user?: User; isLoading: true }
type ErrorData = StageData<'error', LoginData>; // { email?: string; user?: User; error: string }
```

### Mapped Types

Create mapped types for stage-specific configurations:

```tsx
// Mapped type for stage-specific configurations
type StageConfigs<TStage extends string> = {
  [K in TStage]: {
    name: K;
    transitions: Array<{
      target: TStage;
      event: string;
      guard?: (data: any) => boolean;
      transform?: (data: any) => any;
    }>;
  };
};

// Mapped type for stage-specific data
type StageDataMap<TStage extends string, TData> = {
  [K in TStage]: TData & {
    currentStage: K;
  };
};

// Usage
type AppStage = 'form' | 'success' | 'error';

const stageConfigs: StageConfigs<AppStage> = {
  form: {
    name: 'form',
    transitions: [
      { target: 'success', event: 'submit' },
      { target: 'error', event: 'fail' }
    ]
  },
  success: {
    name: 'success',
    transitions: [{ target: 'form', event: 'reset' }]
  },
  error: {
    name: 'error',
    transitions: [{ target: 'form', event: 'retry' }]
  }
};
```

### Template Literal Types

Use template literal types for dynamic event names:

```tsx
// Template literal types for events
type EventPattern = `${string}_${string}`;
type ValidEvent<T extends EventPattern> = T;

// Stage-specific events
type FormEvents = ValidEvent<'form_submit' | 'form_reset' | 'form_validate'>;
type AuthEvents = ValidEvent<'auth_login' | 'auth_logout' | 'auth_register'>;

// Combined events
type AppEvents = FormEvents | AuthEvents;

// Usage
const config = {
  initial: 'form' as const,
  stages: [
    {
      name: 'form',
      transitions: [
        { target: 'success', event: 'form_submit' },
        { target: 'error', event: 'form_validate' }
      ]
    }
  ]
};
```

## Type-Safe Event Handling

### Event Type Guards

Create type guards for event validation:

```tsx
// Type guard for form events
function isFormEvent(event: string): event is FormEvents {
  return event.startsWith('form_');
}

// Type guard for auth events
function isAuthEvent(event: string): event is AuthEvents {
  return event.startsWith('auth_');
}

// Type-safe event handler
function handleEvent(event: AppEvents, data?: any) {
  if (isFormEvent(event)) {
    // TypeScript knows this is a form event
    handleFormEvent(event, data);
  } else if (isAuthEvent(event)) {
    // TypeScript knows this is an auth event
    handleAuthEvent(event, data);
  }
}

function handleFormEvent(event: FormEvents, data?: any) {
  switch (event) {
    case 'form_submit':
      // Handle form submission
      break;
    case 'form_reset':
      // Handle form reset
      break;
    case 'form_validate':
      // Handle form validation
      break;
  }
}
```

### Event-Specific Data Types

Define specific data types for each event:

```tsx
// Event-specific data types
interface FormSubmitData {
  email: string;
  password: string;
}

interface FormResetData {
  clearAll: boolean;
}

interface AuthLoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Union type for all event data
type EventData = 
  | { event: 'form_submit'; data: FormSubmitData }
  | { event: 'form_reset'; data: FormResetData }
  | { event: 'auth_login'; data: AuthLoginData }
  | { event: 'auth_logout'; data: undefined };

// Type-safe event sender
function sendEvent<T extends EventData['event']>(
  event: T,
  data: Extract<EventData, { event: T }>['data']
) {
  // TypeScript ensures data matches the event
  engine.send(event, data);
}

// Usage
sendEvent('form_submit', { email: 'user@example.com', password: 'secret' });
sendEvent('form_reset', { clearAll: true });
sendEvent('auth_login', { email: 'user@example.com', password: 'secret', rememberMe: true });
```

## Advanced Type Utilities

### Type-Safe Stage Transitions

Create utilities for type-safe stage transitions:

```tsx
// Type utility for valid transitions
type ValidTransitions<TStage extends string, TConfig> = TConfig extends {
  stages: Array<{ name: TStage; transitions: Array<{ target: infer T }> }
} ? T : never;

// Type utility for stage-specific events
type StageEvents<TStage extends string, TConfig> = TConfig extends {
  stages: Array<{ name: TStage; transitions: Array<{ event: infer E }> }
} ? E : never;

// Type-safe transition function
function createTransition<TStage extends string, TData>(
  engine: StageFlowEngine<TStage, TData>
) {
  return function transition<T extends TStage>(
    from: T,
    to: ValidTransitions<T, typeof engine.config>,
    event: StageEvents<T, typeof engine.config>
  ) {
    // Type-safe transition logic
    return engine.send(event);
  };
}
```

### Conditional Stage Data

Create conditional types for stage-specific data:

```tsx
// Conditional type for stage-specific data
type StageSpecificData<TStage extends string, TData> = 
  TStage extends 'loading' ? TData & { isLoading: true }
  : TStage extends 'error' ? TData & { error: string }
  : TStage extends 'success' ? TData & { user: User }
  : TData;

// Type-safe stage data accessor
function getStageData<TStage extends string, TData>(
  stage: TStage,
  data: TData
): StageSpecificData<TStage, TData> {
  return data as StageSpecificData<TStage, TData>;
}

// Usage
type AppStage = 'loading' | 'success' | 'error';
type AppData = { email?: string };

const data: AppData = { email: 'user@example.com' };

const loadingData = getStageData('loading', data); // { email?: string; isLoading: true }
const successData = getStageData('success', data); // { email?: string; user: User }
const errorData = getStageData('error', data); // { email?: string; error: string }
```

## Type-Safe Configuration

### Configuration Validation

Create type-safe configuration validators:

```tsx
// Configuration validator
interface ConfigValidator<TStage extends string, TData> {
  validateStage(stage: TStage): boolean;
  validateTransition(from: TStage, to: TStage): boolean;
  validateData(data: TData): boolean;
}

// Type-safe configuration builder
class StageConfigBuilder<TStage extends string, TData> {
  private stages: Map<TStage, any> = new Map();
  private transitions: Map<string, any> = new Map();

  addStage(stage: TStage, config: any): this {
    this.stages.set(stage, config);
    return this;
  }

  addTransition(from: TStage, to: TStage, event: string): this {
    const key = `${from}_${event}`;
    this.transitions.set(key, { from, to, event });
    return this;
  }

  build(): StageFlowConfig<TStage, TData> {
    const stages = Array.from(this.stages.entries()).map(([name, config]) => ({
      name,
      ...config
    }));

    return {
      initial: stages[0]?.name as TStage,
      stages
    };
  }
}

// Usage
const config = new StageConfigBuilder<'idle' | 'loading' | 'success', { email?: string }>()
  .addStage('idle', {
    transitions: [{ target: 'loading', event: 'start' }]
  })
  .addStage('loading', {
    transitions: [
      { target: 'success', event: 'complete' },
      { target: 'idle', event: 'cancel' }
    ]
  })
  .addStage('success', {
    transitions: [{ target: 'idle', event: 'reset' }]
  })
  .build();
```

## Type-Safe Hooks

### Custom Hook Types

Create type-safe custom hooks:

```tsx
// Type-safe hook for specific stages
function useStage<TStage extends string, TData>(
  targetStage: TStage
): TData | null {
  const { currentStage, data } = useStageFlow<TStage, TData>();
  
  return currentStage === targetStage ? data : null;
}

// Type-safe hook for stage transitions
function useStageTransition<TStage extends string, TData>(
  from: TStage,
  to: TStage
): [boolean, (data?: TData) => void] {
  const { currentStage, send } = useStageFlow<TStage, TData>();
  
  const canTransition = currentStage === from;
  const transition = (data?: TData) => {
    if (canTransition) {
      send('transition' as any, data);
    }
  };
  
  return [canTransition, transition];
}

// Type-safe hook for stage-specific actions
function useStageActions<TStage extends string, TData>(
  stage: TStage
): {
  isActive: boolean;
  actions: Record<string, (data?: TData) => void>;
} {
  const { currentStage, send } = useStageFlow<TStage, TData>();
  
  const isActive = currentStage === stage;
  const actions = {
    next: (data?: TData) => send('next' as any, data),
    back: (data?: TData) => send('back' as any, data),
    reset: (data?: TData) => send('reset' as any, data)
  };
  
  return { isActive, actions };
}
```

### Hook Composition

Compose multiple hooks for complex scenarios:

```tsx
// Composed hook for form handling
function useFormStage<TData extends { email?: string; password?: string }>() {
  const { currentStage, send, data } = useStageFlow<'idle' | 'loading' | 'success' | 'error', TData>();
  
  const isFormStage = currentStage === 'idle';
  const isLoading = currentStage === 'loading';
  const isSuccess = currentStage === 'success';
  const isError = currentStage === 'error';
  
  const submit = (formData: TData) => {
    send('submit', formData);
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
    submit,
    reset,
    retry
  };
}

// Usage
function LoginForm() {
  const { isFormStage, isLoading, isSuccess, isError, submit, reset, retry, data } = useFormStage<{
    email: string;
    password: string;
    user?: User;
    error?: string;
  }>();
  
  if (isFormStage) {
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        submit({
          email: formData.get('email') as string,
          password: formData.get('password') as string
        });
      }}>
        <input name="email" type="email" required />
        <input name="password" type="password" required />
        <button type="submit">Login</button>
      </form>
    );
  }
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (isSuccess) {
    return (
      <div>
        <h2>Welcome, {data.user?.name}!</h2>
        <button onClick={reset}>Logout</button>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div>
        <p>Error: {data.error}</p>
        <button onClick={retry}>Try Again</button>
      </div>
    );
  }
  
  return null;
}
```

## Type-Safe Plugins

### Plugin Type Definitions

Create type-safe plugin interfaces:

```tsx
// Plugin interface with generic types
interface Plugin<TStage extends string, TData> {
  name: string;
  install(engine: StageFlowEngine<TStage, TData>): void;
  uninstall?(engine: StageFlowEngine<TStage, TData>): void;
}

// Type-safe plugin configuration
interface PluginConfig<TStage extends string, TData> {
  plugins: Plugin<TStage, TData>[];
  options?: Record<string, any>;
}

// Type-safe plugin manager
class PluginManager<TStage extends string, TData> {
  private plugins: Map<string, Plugin<TStage, TData>> = new Map();
  
  register(plugin: Plugin<TStage, TData>): this {
    this.plugins.set(plugin.name, plugin);
    return this;
  }
  
  install(engine: StageFlowEngine<TStage, TData>): void {
    this.plugins.forEach(plugin => plugin.install(engine));
  }
  
  uninstall(engine: StageFlowEngine<TStage, TData>): void {
    this.plugins.forEach(plugin => plugin.uninstall?.(engine));
  }
}

// Usage
const pluginManager = new PluginManager<'idle' | 'loading' | 'success', { email?: string }>();

pluginManager
  .register(new LoggingPlugin())
  .register(new PersistencePlugin())
  .register(new AnalyticsPlugin());

const engine = new StageFlowEngine(config);
pluginManager.install(engine);
```

## Type-Safe Testing

### Test Type Definitions

Create type-safe testing utilities:

```tsx
// Type-safe test engine
interface TestEngine<TStage extends string, TData> {
  currentStage: TStage;
  data: TData;
  send(event: string, data?: TData): Promise<void>;
  transition(to: TStage, data?: TData): Promise<void>;
  assertStage(expected: TStage): void;
  assertData(expected: Partial<TData>): void;
}

// Type-safe test utilities
function createTestEngine<TStage extends string, TData>(
  config: StageFlowConfig<TStage, TData>
): TestEngine<TStage, TData> {
  const engine = new StageFlowEngine(config);
  
  return {
    get currentStage() { return engine.getCurrentStage() as TStage; },
    get data() { return engine.getData() as TData; },
    
    async send(event: string, data?: TData) {
      await engine.send(event, data);
    },
    
    async transition(to: TStage, data?: TData) {
      // Find transition to target stage
      const currentStage = engine.getCurrentStage();
      const stage = config.stages.find(s => s.name === currentStage);
      const transition = stage?.transitions.find(t => t.target === to);
      
      if (transition) {
        await engine.send(transition.event, data);
      }
    },
    
    assertStage(expected: TStage) {
      expect(engine.getCurrentStage()).toBe(expected);
    },
    
    assertData(expected: Partial<TData>) {
      const data = engine.getData();
      expect(data).toMatchObject(expected);
    }
  };
}

// Usage in tests
describe('Login Flow', () => {
  let testEngine: TestEngine<LoginStage, LoginData>;
  
  beforeEach(() => {
    testEngine = createTestEngine(loginConfig);
  });
  
  it('should transition from idle to loading', async () => {
    testEngine.assertStage('idle');
    
    await testEngine.send('login', { email: 'user@example.com', password: 'secret' });
    
    testEngine.assertStage('loading');
    testEngine.assertData({ email: 'user@example.com', password: 'secret' });
  });
  
  it('should handle successful login', async () => {
    await testEngine.transition('loading');
    
    await testEngine.send('success', { user: { id: '123', name: 'John' } });
    
    testEngine.assertStage('success');
    testEngine.assertData({ user: { id: '123', name: 'John' } });
  });
});
```

## Best Practices

### 1. Use Strict Type Definitions

```tsx
// ✅ Good: Strict type definitions
type AppStage = 'idle' | 'loading' | 'success' | 'error';
type AppData = { email?: string; user?: User; error?: string };

// ❌ Avoid: Loose type definitions
type AppStage = string;
type AppData = any;
```

### 2. Leverage Type Inference

```tsx
// ✅ Good: Let TypeScript infer types
const config = {
  initial: 'idle' as const,
  stages: [
    { name: 'idle', transitions: [{ target: 'loading', event: 'start' }] },
    { name: 'loading', transitions: [{ target: 'success', event: 'complete' }] },
    { name: 'success', transitions: [{ target: 'idle', event: 'reset' }] }
  ]
} satisfies StageFlowConfig<AppStage, AppData>;

// ❌ Avoid: Explicit type annotations everywhere
const config: StageFlowConfig<AppStage, AppData> = {
  // ...
};
```

### 3. Use Type Guards

```tsx
// ✅ Good: Type guards for runtime safety
function isFormStage(stage: AppStage): stage is 'idle' {
  return stage === 'idle';
}

function isSuccessStage(stage: AppStage): stage is 'success' {
  return stage === 'success';
}

// ❌ Avoid: Type assertions
const stage = currentStage as 'idle';
```

### 4. Create Type-Safe Utilities

```tsx
// ✅ Good: Type-safe utility functions
function createStageMachine<TStage extends string, TData>(
  config: StageFlowConfig<TStage, TData>
): StageFlowEngine<TStage, TData> {
  return new StageFlowEngine(config);
}

// ❌ Avoid: Generic any types
function createStageMachine(config: any): any {
  return new StageFlowEngine(config);
}
```

## Next Steps

- [React Integration](/docs/react/index) - React-specific features
- [Plugin System](/docs/guide/plugin-system) - Extend functionality with plugins
- [Middleware](/docs/guide/middleware) - Add processing layers

- [Testing](/docs/guide/testing) - Test your stage machines 