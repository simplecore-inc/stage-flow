# Middleware

Learn how to use middleware to add processing layers to your Stage Flow applications.

## Overview

Middleware in Stage Flow allows you to process data and events before they reach the stage machine. Middleware functions are executed in sequence and can modify data, validate inputs, or add side effects.

## Built-in Middleware

### Logging Middleware

```tsx
import { createLoggingMiddleware } from '@stage-flow/core';

const loggingMiddleware = createLoggingMiddleware({
  logLevel: 'info',
  includeData: true
});

const engine = new StageFlowEngine(config, {
  middleware: [loggingMiddleware]
});
```

### Validation Middleware

```tsx
import { createValidationMiddleware } from '@stage-flow/core';

const validationMiddleware = createValidationMiddleware({
  validate: (data) => {
    if (!data.email) {
      throw new Error('Email is required');
    }
    if (!data.password) {
      throw new Error('Password is required');
    }
    return data;
  }
});

const engine = new StageFlowEngine(config, {
  middleware: [validationMiddleware]
});
```

## Creating Custom Middleware

### Basic Middleware Structure

```tsx
import { Middleware } from '@stage-flow/core';

interface MyMiddlewareConfig {
  enabled?: boolean;
  customOption?: string;
}

function createMyMiddleware(config: MyMiddlewareConfig = {}): Middleware {
  return {
    name: 'my-middleware',
    process: (data, context) => {
      if (!config.enabled) return data;
      
      // Process data
      const processedData = {
        ...data,
        processed: true,
        timestamp: Date.now()
      };
      
      console.log(`[MyMiddleware] Processed data:`, processedData);
      
      return processedData;
    }
  };
}

// Usage
const engine = new StageFlowEngine(config, {
  middleware: [createMyMiddleware({ enabled: true, customOption: 'value' })]
});
```

### Type-Safe Middleware

```tsx
import { Middleware } from '@stage-flow/core';

interface ValidationRule<TData> {
  field: keyof TData;
  validate: (value: any) => boolean | string;
}

function createValidationMiddleware<TData>(
  rules: ValidationRule<TData>[]
): Middleware {
  return {
    name: 'validation-middleware',
    process: (data: TData, context) => {
      const errors: string[] = [];
      
      for (const rule of rules) {
        const value = data[rule.field];
        const result = rule.validate(value);
        
        if (result === false) {
          errors.push(`Validation failed for field: ${String(rule.field)}`);
        } else if (typeof result === 'string') {
          errors.push(result);
        }
      }
      
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }
      
      return data;
    }
  };
}

// Usage
const validationMiddleware = createValidationMiddleware<AppData>([
  {
    field: 'email',
    validate: (value) => {
      if (!value) return 'Email is required';
      if (!value.includes('@')) return 'Invalid email format';
      return true;
    }
  },
  {
    field: 'password',
    validate: (value) => {
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
      return true;
    }
  }
]);
```

### Async Middleware

```tsx
function createAsyncMiddleware<TData>(
  asyncProcessor: (data: TData) => Promise<TData>
): Middleware {
  return {
    name: 'async-middleware',
    async process(data: TData, context) {
      try {
        const processedData = await asyncProcessor(data);
        return processedData;
      } catch (error) {
        console.error('Async middleware error:', error);
        throw error;
      }
    }
  };
}

// Usage
const apiMiddleware = createAsyncMiddleware(async (data) => {
  // Make API call
  const response = await fetch('/api/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('API validation failed');
  }
  
  const result = await response.json();
  return { ...data, validated: true, ...result };
});
```

## Middleware Composition

### Chaining Middleware

```tsx
function composeMiddleware(middleware: Middleware[]): Middleware {
  return {
    name: 'composed-middleware',
    async process(data, context) {
      let processedData = data;
      
      for (const mw of middleware) {
        processedData = await mw.process(processedData, context);
      }
      
      return processedData;
    }
  };
}

// Usage
const composedMiddleware = composeMiddleware([
  createLoggingMiddleware({ logLevel: 'info' }),
  createValidationMiddleware({
    validate: (data) => {
      if (!data.email) throw new Error('Email required');
      return data;
    }
  }),
  createAsyncMiddleware(async (data) => {
    // API call
    return data;
  })
]);

const engine = new StageFlowEngine(config, {
  middleware: [composedMiddleware]
});
```

### Conditional Middleware

```tsx
function createConditionalMiddleware<TData>(
  condition: (data: TData, context: any) => boolean,
  middleware: Middleware
): Middleware {
  return {
    name: `conditional-${middleware.name}`,
    async process(data: TData, context) {
      if (condition(data, context)) {
        return middleware.process(data, context);
      }
      return data;
    }
  };
}

// Usage
const conditionalValidation = createConditionalMiddleware(
  (data) => data.email && data.password, // Only validate if both fields exist
  createValidationMiddleware({
    validate: (data) => {
      if (!data.email.includes('@')) throw new Error('Invalid email');
      if (data.password.length < 6) throw new Error('Password too short');
      return data;
    }
  })
);
```

## Advanced Middleware Patterns

### Middleware with State

```tsx
function createStatefulMiddleware<TData>(): Middleware {
  let state = new Map<string, any>();
  
  return {
    name: 'stateful-middleware',
    process(data: TData, context) {
      // Update state
      state.set('lastProcessed', Date.now());
      state.set('processedCount', (state.get('processedCount') || 0) + 1);
      
      // Add state to data
      return {
        ...data,
        middlewareState: {
          lastProcessed: state.get('lastProcessed'),
          processedCount: state.get('processedCount')
        }
      };
    }
  };
}
```

### Middleware with Error Handling

```tsx
function createErrorHandlingMiddleware<TData>(
  middleware: Middleware,
  errorHandler: (error: Error, data: TData) => TData
): Middleware {
  return {
    name: `error-handling-${middleware.name}`,
    async process(data: TData, context) {
      try {
        return await middleware.process(data, context);
      } catch (error) {
        console.error(`Middleware error in ${middleware.name}:`, error);
        return errorHandler(error, data);
      }
    }
  };
}

// Usage
const safeValidation = createErrorHandlingMiddleware(
  createValidationMiddleware({
    validate: (data) => {
      if (!data.email) throw new Error('Email required');
      return data;
    }
  }),
  (error, data) => {
    // Return data with error flag instead of throwing
    return { ...data, validationError: error.message };
  }
);
```

### Middleware with Performance Monitoring

```tsx
function createPerformanceMiddleware<TData>(
  middleware: Middleware
): Middleware {
  return {
    name: `performance-${middleware.name}`,
    async process(data: TData, context) {
      const startTime = performance.now();
      
      try {
        const result = await middleware.process(data, context);
        const endTime = performance.now();
        
        console.log(`Middleware ${middleware.name} took ${endTime - startTime}ms`);
        
        return result;
      } catch (error) {
        const endTime = performance.now();
        console.error(`Middleware ${middleware.name} failed after ${endTime - startTime}ms:`, error);
        throw error;
      }
    }
  };
}
```

## Middleware Context

### Context Object

```tsx
interface MiddlewareContext {
  currentStage: string;
  targetStage: string;
  event: string;
  engine: StageFlowEngine<any, any>;
  metadata: Record<string, any>;
}

function createContextAwareMiddleware(): Middleware {
  return {
    name: 'context-aware-middleware',
    process(data, context: MiddlewareContext) {
      console.log(`Processing transition from ${context.currentStage} to ${context.targetStage}`);
      console.log(`Event: ${context.event}`);
      console.log(`Data:`, data);
      
      // Add context information to data
      return {
        ...data,
        context: {
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

### Context-Specific Middleware

```tsx
function createStageSpecificMiddleware<TData>(
  stage: string,
  middleware: Middleware
): Middleware {
  return {
    name: `stage-specific-${middleware.name}`,
    async process(data: TData, context: MiddlewareContext) {
      if (context.currentStage === stage || context.targetStage === stage) {
        return middleware.process(data, context);
      }
      return data;
    }
  };
}

// Usage
const formValidation = createStageSpecificMiddleware(
  'form',
  createValidationMiddleware({
    validate: (data) => {
      if (!data.email) throw new Error('Email required');
      return data;
    }
  })
);
```

## Testing Middleware

### Middleware Testing Utilities

```tsx
import { createTestEngine } from '@stage-flow/testing';

describe('MyMiddleware', () => {
  let engine: StageFlowEngine<AppStage, AppData>;
  let middleware: Middleware;
  
  beforeEach(() => {
    middleware = createMyMiddleware({ enabled: true });
    engine = createTestEngine(config, { middleware: [middleware] });
  });
  
  it('should process data correctly', async () => {
    const testData = { email: 'test@example.com', password: 'secret' };
    
    await engine.start();
    await engine.send('submit', testData);
    
    const processedData = engine.getData();
    expect(processedData.processed).toBe(true);
    expect(processedData.timestamp).toBeDefined();
  });
  
  it('should handle errors gracefully', async () => {
    const invalidData = { email: 'invalid' };
    
    await engine.start();
    
    try {
      await engine.send('submit', invalidData);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('validation');
    }
  });
});
```

## Best Practices

### 1. Keep Middleware Simple

```tsx
// ✅ Good: Simple, focused middleware
function createSimpleMiddleware(): Middleware {
  return {
    name: 'simple-middleware',
    process(data) {
      return { ...data, processed: true };
    }
  };
}

// ❌ Avoid: Complex middleware with many responsibilities
function createComplexMiddleware(): Middleware {
  return {
    name: 'complex-middleware',
    async process(data, context) {
      // Validation
      if (!data.email) throw new Error('Email required');
      
      // API call
      const response = await fetch('/api/validate', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      // Logging
      console.log('Data processed:', data);
      
      // Analytics
      analytics.track('data_processed', data);
      
      // State management
      // ... more logic
      
      return data;
    }
  };
}
```

### 2. Use Type Safety

```tsx
// ✅ Good: Type-safe middleware
function createTypedMiddleware<TData>(): Middleware {
  return {
    name: 'typed-middleware',
    process(data: TData): TData {
      // TypeScript ensures type safety
      return { ...data, processed: true };
    }
  };
}

// ❌ Avoid: Using any types
function createUntypedMiddleware(): Middleware {
  return {
    name: 'untyped-middleware',
    process(data: any): any {
      // No type safety
      return data;
    }
  };
}
```

### 3. Handle Errors Gracefully

```tsx
// ✅ Good: Proper error handling
function createSafeMiddleware(): Middleware {
  return {
    name: 'safe-middleware',
    async process(data, context) {
      try {
        // Middleware logic
        return { ...data, processed: true };
      } catch (error) {
        console.error('Middleware error:', error);
        // Return original data instead of throwing
        return data;
      }
    }
  };
}

// ❌ Avoid: No error handling
function createUnsafeMiddleware(): Middleware {
  return {
    name: 'unsafe-middleware',
    process(data) {
      // No error handling - could crash the engine
      throw new Error('Middleware error');
    }
  };
}
```

### 4. Use Composition

```tsx
// ✅ Good: Compose simple middleware
const composedMiddleware = composeMiddleware([
  createLoggingMiddleware(),
  createValidationMiddleware(),
  createAsyncMiddleware()
]);

// ❌ Avoid: One large middleware
function createMonolithicMiddleware(): Middleware {
  return {
    name: 'monolithic-middleware',
    async process(data, context) {
      // Too many responsibilities in one middleware
      // Logging, validation, API calls, etc.
    }
  };
}
```

## Next Steps

- [Effects System](/guide/effects-system) - Handle side effects
- [Testing](/guide/testing) - Test your stage machines 