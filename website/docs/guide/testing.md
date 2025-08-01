# Testing

Learn how to effectively test your Stage Flow applications with comprehensive testing utilities and best practices.

## Overview

Stage Flow provides comprehensive testing utilities that make it easy to test your stage machines, components, and integrations. The testing system is designed to be type-safe, performant, and easy to use.

## Testing Utilities

### Test Engine

```tsx
import { createTestEngine } from '@stage-flow/testing';

describe('Login Flow', () => {
  let engine: StageFlowEngine<LoginStage, LoginData>;
  
  beforeEach(() => {
    engine = createTestEngine(loginConfig);
  });
  
  it('should transition from idle to loading', async () => {
    await engine.start();
    expect(engine.getCurrentStage()).toBe('idle');
    
    await engine.send('login', { email: 'user@example.com', password: 'secret' });
    expect(engine.getCurrentStage()).toBe('loading');
  });
  
  it('should handle successful login', async () => {
    await engine.start();
    await engine.send('login', { email: 'user@example.com', password: 'secret' });
    await engine.send('success', { user: { id: '123', name: 'John' } });
    
    expect(engine.getCurrentStage()).toBe('success');
    expect(engine.getData()).toEqual({ user: { id: '123', name: 'John' } });
  });
});
```

### Mock Engine

```tsx
import { createMockEngine } from '@stage-flow/testing';

describe('API Integration', () => {
  let engine: StageFlowEngine<AppStage, AppData>;
  let mockAPI: jest.Mocked<API>;
  
  beforeEach(() => {
    mockAPI = {
      login: jest.fn(),
      logout: jest.fn(),
      getUser: jest.fn()
    };
    
    engine = createMockEngine(config, { api: mockAPI });
  });
  
  it('should call API on login', async () => {
    mockAPI.login.mockResolvedValue({ user: { id: '123', name: 'John' } });
    
    await engine.start();
    await engine.send('login', { email: 'user@example.com', password: 'secret' });
    
    expect(mockAPI.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret'
    });
  });
});
```

## Testing React Components

### Component Testing

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StageFlowProvider } from '@stage-flow/react';

function TestWrapper({ children }: { children: React.ReactNode }) {
  const engine = new StageFlowEngine(testConfig);
  return (
    <StageFlowProvider engine={engine}>
      {children}
    </StageFlowProvider>
  );
}

describe('LoginForm', () => {
  it('should submit form and transition to success', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );
    
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByText('Login');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });
  });
  
  it('should show validation errors', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );
    
    const submitButton = screen.getByText('Login');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });
});
```

### Hook Testing

```tsx
import { renderHook, act } from '@testing-library/react';

describe('useStageFlow', () => {
  it('should provide stage flow functionality', () => {
    const engine = new StageFlowEngine(testConfig);
    
    const { result } = renderHook(() => useStageFlow<AppStage, AppData>(), {
      wrapper: ({ children }) => (
        <StageFlowProvider engine={engine}>
          {children}
        </StageFlowProvider>
      )
    });
    
    expect(result.current.currentStage).toBe('idle');
    expect(typeof result.current.send).toBe('function');
  });
  
  it('should update stage on transition', async () => {
    const engine = new StageFlowEngine(testConfig);
    
    const { result } = renderHook(() => useStageFlow<AppStage, AppData>(), {
      wrapper: ({ children }) => (
        <StageFlowProvider engine={engine}>
          {children}
        </StageFlowProvider>
      )
    });
    
    act(() => {
      result.current.send('login', { email: 'user@example.com', password: 'secret' });
    });
    
    expect(result.current.currentStage).toBe('loading');
  });
});
```

## Integration Testing

### Complete Flow Testing

```tsx
describe('User Onboarding Flow', () => {
  let engine: StageFlowEngine<OnboardingStage, OnboardingData>;
  
  beforeEach(() => {
    engine = createTestEngine(onboardingConfig);
  });
  
  it('should complete full onboarding flow', async () => {
    await engine.start();
    expect(engine.getCurrentStage()).toBe('welcome');
    
    // Welcome to Profile
    await engine.send('next');
    expect(engine.getCurrentStage()).toBe('profile');
    
    // Profile to Preferences
    await engine.send('next', { name: 'John Doe', email: 'john@example.com' });
    expect(engine.getCurrentStage()).toBe('preferences');
    
    // Preferences to Confirmation
    await engine.send('next', { 
      name: 'John Doe', 
      email: 'john@example.com',
      preferences: ['notifications', 'newsletter']
    });
    expect(engine.getCurrentStage()).toBe('confirmation');
    
    // Confirmation to Complete
    await engine.send('confirm');
    expect(engine.getCurrentStage()).toBe('complete');
  });
  
  it('should handle back navigation', async () => {
    await engine.start();
    await engine.send('next'); // welcome -> profile
    await engine.send('next'); // profile -> preferences
    
    await engine.send('back'); // preferences -> profile
    expect(engine.getCurrentStage()).toBe('profile');
    
    await engine.send('back'); // profile -> welcome
    expect(engine.getCurrentStage()).toBe('welcome');
  });
});
```

## Performance Testing

### Performance Tests

```tsx
describe('Performance Tests', () => {
  it('should handle rapid transitions', async () => {
    const engine = createTestEngine(complexConfig);
    await engine.start();
    
    const startTime = performance.now();
    
    // Perform many rapid transitions
    for (let i = 0; i < 100; i++) {
      await engine.send('next');
      await engine.send('back');
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });
  
  it('should handle large data payloads', async () => {
    const engine = createTestEngine(config);
    await engine.start();
    
    const largeData = {
      items: Array.from({ length: 10000 }, (_, i) => ({ id: i, value: `item-${i}` })),
      metadata: { timestamp: Date.now(), version: '1.0.0' }
    };
    
    await engine.send('load', largeData);
    expect(engine.getData()).toEqual(largeData);
  });
});
```

## Testing Utilities

### Test Helpers

```tsx
import { 
  createTestEngine, 
  createMockEngine, 
  waitForTransition,
  simulateUserInteraction 
} from '@stage-flow/testing';

describe('Test Utilities', () => {
  it('should wait for transitions', async () => {
    const engine = createTestEngine(config);
    await engine.start();
    
    const transitionPromise = waitForTransition(engine, 'success');
    await engine.send('submit');
    
    await transitionPromise; // Waits for transition to complete
    expect(engine.getCurrentStage()).toBe('success');
  });
  
  it('should simulate user interactions', async () => {
    const engine = createTestEngine(config);
    await engine.start();
    
    await simulateUserInteraction(engine, [
      { event: 'ready' },
      { event: 'input', data: { email: 'test@example.com' } },
      { event: 'submit' }
    ]);
    
    expect(engine.getCurrentStage()).toBe('success');
  });
});
```

## Testing Best Practices

### Test Organization

```tsx
// ✅ Good: Group related tests
describe('Login Flow', () => {
  describe('Valid Inputs', () => {
    it('should handle successful login');
    it('should handle remember me option');
  });
  
  describe('Invalid Inputs', () => {
    it('should show email validation error');
    it('should show password validation error');
  });
  
  describe('API Errors', () => {
    it('should handle network errors');
    it('should handle server errors');
  });
});

// ❌ Avoid: Unorganized tests
describe('Login', () => {
  it('should work');
  it('should handle errors');
  it('should validate');
  it('should call API');
});
```

### Test Data

```tsx
// ✅ Good: Use test data factories
const createTestUser = (overrides = {}) => ({
  id: 'test-123',
  name: 'Test User',
  email: 'test@example.com',
  ...overrides
});

const createTestFormData = (overrides = {}) => ({
  email: 'user@example.com',
  password: 'secret123',
  rememberMe: false,
  ...overrides
});

// Usage
it('should handle successful login', async () => {
  const user = createTestUser({ name: 'John Doe' });
  const formData = createTestFormData({ email: 'john@example.com' });
  
  // Test logic
});

// ❌ Avoid: Hard-coded test data
it('should handle successful login', async () => {
  // Hard-coded data scattered throughout tests
  const user = { id: '123', name: 'John', email: 'john@example.com' };
  const formData = { email: 'john@example.com', password: 'secret' };
});
```

### Test Isolation

```tsx
// ✅ Good: Isolated tests
describe('Login Flow', () => {
  let engine: StageFlowEngine<AppStage, AppData>;
  
  beforeEach(() => {
    engine = createTestEngine(config);
  });
  
  afterEach(() => {
    // Clean up if needed
  });
  
  it('should start in idle state', async () => {
    await engine.start();
    expect(engine.getCurrentStage()).toBe('idle');
  });
  
  it('should transition to loading', async () => {
    await engine.start();
    await engine.send('login', { email: 'test@example.com', password: 'secret' });
    expect(engine.getCurrentStage()).toBe('loading');
  });
});

// ❌ Avoid: Tests that depend on each other
describe('Login Flow', () => {
  let engine: StageFlowEngine<AppStage, AppData>;
  
  beforeAll(() => {
    engine = createTestEngine(config);
  });
  
  it('should start in idle state', async () => {
    await engine.start();
    expect(engine.getCurrentStage()).toBe('idle');
  });
  
  it('should transition to loading', async () => {
    // This test depends on the previous test's state!
    await engine.send('login', { email: 'test@example.com', password: 'secret' });
    expect(engine.getCurrentStage()).toBe('loading');
  });
});
```

### Error Testing

```tsx
// ✅ Good: Test error conditions
describe('Error Handling', () => {
  it('should handle validation errors', async () => {
    const engine = createTestEngine(config);
    await engine.start();
    
    try {
      await engine.send('submit', { email: 'invalid' });
      fail('Should have thrown validation error');
    } catch (error) {
      expect(error.message).toContain('Invalid email');
    }
  });
  
  it('should handle API errors', async () => {
    const mockAPI = { login: jest.fn().mockRejectedValue(new Error('Network error')) };
    const engine = createMockEngine(config, { api: mockAPI });
    
    await engine.start();
    
    try {
      await engine.send('login', { email: 'user@example.com', password: 'secret' });
      fail('Should have thrown API error');
    } catch (error) {
      expect(error.message).toContain('Network error');
    }
  });
});

// ❌ Avoid: Only testing happy path
describe('Login Flow', () => {
  it('should handle successful login', async () => {
    // Only tests the happy path
    // No error testing
  });
});
```

## Testing Coverage

### Coverage Goals

```tsx
// Aim for high coverage
describe('Complete Coverage', () => {
  it('should test all stages', async () => {
    const engine = createTestEngine(config);
    await engine.start();
    
    // Test all stages
    expect(engine.getCurrentStage()).toBe('idle');
    
    await engine.send('login');
    expect(engine.getCurrentStage()).toBe('loading');
    
    await engine.send('success');
    expect(engine.getCurrentStage()).toBe('success');
    
    await engine.send('logout');
    expect(engine.getCurrentStage()).toBe('idle');
  });
  
  it('should test all transitions', async () => {
    const engine = createTestEngine(config);
    await engine.start();
    
    // Test all possible transitions
    const transitions = [
      { from: 'idle', event: 'login', to: 'loading' },
      { from: 'loading', event: 'success', to: 'success' },
      { from: 'loading', event: 'fail', to: 'error' },
      { from: 'success', event: 'logout', to: 'idle' },
      { from: 'error', event: 'retry', to: 'idle' }
    ];
    
    for (const transition of transitions) {
      await engine.send(transition.event);
      expect(engine.getCurrentStage()).toBe(transition.to);
    }
  });
});
```

## Next Steps

- [API Reference](/docs/api/) - Complete API documentation
- [Examples](/docs/examples/basic/simple-counter) - See testing examples in action 