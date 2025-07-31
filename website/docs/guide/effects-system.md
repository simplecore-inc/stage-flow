# Effects System

Learn how to handle side effects in Stage Flow using the effects system.

## Overview

The effects system in Stage Flow allows you to handle side effects like API calls, file operations, and other asynchronous operations in a clean and testable way.

## Built-in Effects

### API Effects

```tsx
import { createEffect } from '@stage-flow/core';

const apiEffect = createEffect('api', async (data) => {
  const response = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('API request failed');
  }
  
  return response.json();
});
```

### Timer Effects

```tsx
const timerEffect = createEffect('timer', (duration: number) => {
  return new Promise(resolve => setTimeout(resolve, duration));
});
```

## Creating Custom Effects

### Basic Effect Structure

```tsx
import { Effect } from '@stage-flow/core';

interface MyEffectConfig {
  enabled?: boolean;
  timeout?: number;
}

function createMyEffect(config: MyEffectConfig = {}): Effect {
  return {
    name: 'my-effect',
    async execute(data, context) {
      if (!config.enabled) return data;
      
      // Effect logic
      const result = await someAsyncOperation(data);
      
      return { ...data, ...result };
    }
  };
}
```

### Type-Safe Effects

```tsx
function createTypedEffect<TData, TResult>(
  name: string,
  executor: (data: TData) => Promise<TResult>
): Effect {
  return {
    name,
    async execute(data: TData, context) {
      try {
        const result = await executor(data);
        return { ...data, result };
      } catch (error) {
        console.error(`Effect ${name} failed:`, error);
        throw error;
      }
    }
  };
}

// Usage
const loginEffect = createTypedEffect<{ email: string; password: string }, { user: User }>(
  'login',
  async (data) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    return response.json();
  }
);
```

## Effect Composition

### Chaining Effects

```tsx
function composeEffects(effects: Effect[]): Effect {
  return {
    name: 'composed-effects',
    async execute(data, context) {
      let result = data;
      
      for (const effect of effects) {
        result = await effect.execute(result, context);
      }
      
      return result;
    }
  };
}

// Usage
const composedEffects = composeEffects([
  createValidationEffect(),
  createAPIEffect(),
  createLoggingEffect()
]);
```

### Conditional Effects

```tsx
function createConditionalEffect<TData>(
  condition: (data: TData) => boolean,
  effect: Effect
): Effect {
  return {
    name: `conditional-${effect.name}`,
    async execute(data: TData, context) {
      if (condition(data)) {
        return effect.execute(data, context);
      }
      return data;
    }
  };
}

// Usage
const conditionalAPIEffect = createConditionalEffect(
  (data) => data.email && data.password,
  createAPIEffect()
);
```

## Advanced Effect Patterns

### Effect with Retry Logic

```tsx
function createRetryEffect<TData>(
  effect: Effect,
  maxRetries: number = 3,
  delay: number = 1000
): Effect {
  return {
    name: `retry-${effect.name}`,
    async execute(data: TData, context) {
      let lastError: Error;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await effect.execute(data, context);
        } catch (error) {
          lastError = error as Error;
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
          }
        }
      }
      
      throw lastError!;
    }
  };
}
```

### Effect with Caching

```tsx
function createCachedEffect<TData>(
  effect: Effect,
  cacheKey: (data: TData) => string
): Effect {
  const cache = new Map<string, any>();
  
  return {
    name: `cached-${effect.name}`,
    async execute(data: TData, context) {
      const key = cacheKey(data);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = await effect.execute(data, context);
      cache.set(key, result);
      
      return result;
    }
  };
}
```

### Effect with Timeout

```tsx
function createTimeoutEffect<TData>(
  effect: Effect,
  timeout: number
): Effect {
  return {
    name: `timeout-${effect.name}`,
    async execute(data: TData, context) {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Effect timeout')), timeout);
      });
      
      const effectPromise = effect.execute(data, context);
      
      return Promise.race([effectPromise, timeoutPromise]);
    }
  };
}
```

## Effect Context

### Context Object

```tsx
interface EffectContext {
  currentStage: string;
  targetStage: string;
  event: string;
  engine: StageFlowEngine<any, any>;
  metadata: Record<string, any>;
}

function createContextAwareEffect(): Effect {
  return {
    name: 'context-aware-effect',
    async execute(data, context: EffectContext) {
      console.log(`Executing effect for transition from ${context.currentStage} to ${context.targetStage}`);
      
      // Add context to data
      return {
        ...data,
        effectContext: {
          from: context.currentStage,
          to: context.targetStage,
          event: context.event,
          timestamp: Date.now()
        }
      };
    }
  };
}
```

## Testing Effects

### Effect Testing Utilities

```tsx
import { createTestEngine } from '@stage-flow/testing';

describe('MyEffect', () => {
  let engine: StageFlowEngine<AppStage, AppData>;
  let effect: Effect;
  
  beforeEach(() => {
    effect = createMyEffect({ enabled: true });
    engine = createTestEngine(config, { effects: [effect] });
  });
  
  it('should execute correctly', async () => {
    const testData = { email: 'test@example.com' };
    
    await engine.start();
    await engine.send('submit', testData);
    
    const resultData = engine.getData();
    expect(resultData.processed).toBe(true);
  });
  
  it('should handle errors gracefully', async () => {
    const invalidData = { email: 'invalid' };
    
    await engine.start();
    
    try {
      await engine.send('submit', invalidData);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('effect');
    }
  });
});
```

## Best Practices

### 1. Keep Effects Simple

```tsx
// ✅ Good: Simple, focused effect
function createSimpleEffect(): Effect {
  return {
    name: 'simple-effect',
    async execute(data) {
      return { ...data, processed: true };
    }
  };
}

// ❌ Avoid: Complex effect with many responsibilities
function createComplexEffect(): Effect {
  return {
    name: 'complex-effect',
    async execute(data, context) {
      // Validation
      if (!data.email) throw new Error('Email required');
      
      // API call
      const response = await fetch('/api/data', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      // Logging
      console.log('Effect executed:', data);
      
      // Analytics
      analytics.track('effect_executed', data);
      
      // State management
      // ... more logic
      
      return data;
    }
  };
}
```

### 2. Use Type Safety

```tsx
// ✅ Good: Type-safe effect
function createTypedEffect<TData>(): Effect {
  return {
    name: 'typed-effect',
    async execute(data: TData): Promise<TData> {
      // TypeScript ensures type safety
      return { ...data, processed: true };
    }
  };
}

// ❌ Avoid: Using any types
function createUntypedEffect(): Effect {
  return {
    name: 'untyped-effect',
    async execute(data: any): Promise<any> {
      // No type safety
      return data;
    }
  };
}
```

### 3. Handle Errors Gracefully

```tsx
// ✅ Good: Proper error handling
function createSafeEffect(): Effect {
  return {
    name: 'safe-effect',
    async execute(data, context) {
      try {
        // Effect logic
        return { ...data, processed: true };
      } catch (error) {
        console.error('Effect error:', error);
        // Return original data instead of throwing
        return data;
      }
    }
  };
}

// ❌ Avoid: No error handling
function createUnsafeEffect(): Effect {
  return {
    name: 'unsafe-effect',
    async execute(data) {
      // No error handling - could crash the engine
      throw new Error('Effect error');
    }
  };
}
```

### 4. Use Composition

```tsx
// ✅ Good: Compose simple effects
const composedEffects = composeEffects([
  createValidationEffect(),
  createAPIEffect(),
  createLoggingEffect()
]);

// ❌ Avoid: One large effect
function createMonolithicEffect(): Effect {
  return {
    name: 'monolithic-effect',
    async execute(data, context) {
      // Too many responsibilities in one effect
      // Validation, API calls, logging, etc.
    }
  };
}
```

## Next Steps

- [Testing](/guide/testing) - Test your stage machines 