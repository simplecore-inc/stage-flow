/**
 * Example demonstrating middleware system usage
 */

import {
  StageFlowEngine,
  StageFlowConfig,
  Middleware,
  TransitionContext,
  createLoggingMiddleware,
  createValidationMiddleware
} from '@stage-flow/core';

// Define stage types for our example
type FormStage = 'input' | 'validation' | 'submission' | 'success' | 'error';

interface FormData {
  email?: string;
  password?: string;
  confirmPassword?: string;
  validationErrors?: string[];
  submissionAttempts?: number;
  isSubmitting?: boolean;
}

// Example 1: Using built-in middleware
const basicMiddlewareConfig: StageFlowConfig<FormStage, FormData> = {
  initial: 'input',
  stages: [
    {
      name: 'input',
      transitions: [
        { target: 'validation', event: 'validate' }
      ]
    },
    {
      name: 'validation',
      transitions: [
        { target: 'submission', event: 'submit' },
        { target: 'input', event: 'invalid' }
      ]
    },
    {
      name: 'submission',
      transitions: [
        { target: 'success', event: 'complete' },
        { target: 'error', event: 'failed' }
      ]
    },
    {
      name: 'success',
      transitions: [
        { target: 'input', event: 'reset' }
      ]
    },
    {
      name: 'error',
      transitions: [
        { target: 'input', event: 'retry' },
        { target: 'submission', event: 'resubmit' }
      ]
    }
  ],
  middleware: [
    // Built-in logging middleware
    createLoggingMiddleware({
      logLevel: 'info',
      includeData: true
    }),
    
    // Built-in validation middleware
    createValidationMiddleware(
      (context) => {
        const data = context.data;
        if (!data?.email) {
          return false;
        }
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
      },
      { errorMessage: 'Invalid email format' }
    )
  ]
};

// Example 2: Creating custom middleware
const authenticationMiddleware: Middleware<FormStage, FormData> = {
  name: 'authentication',
  async execute(context, next) {
    console.log(`🔐 Authentication middleware: ${context.from} → ${context.to}`);
    
    // Check if user is authenticated for certain transitions
    if (context.to === 'submission') {
      const isAuthenticated = await checkUserAuthentication();
      if (!isAuthenticated) {
        console.log('❌ User not authenticated, cancelling transition');
        context.cancel();
        return;
      }
    }
    
    await next();
  }
};

const rateLimitingMiddleware: Middleware<FormStage, FormData> = {
  name: 'rate-limiting',
  async execute(context, next) {
    console.log(`⏱️ Rate limiting middleware: ${context.from} → ${context.to}`);
    
    // Implement rate limiting for submission attempts
    if (context.to === 'submission') {
      const attempts = context.data?.submissionAttempts || 0;
      const lastAttempt = localStorage.getItem('lastSubmissionAttempt');
      const now = Date.now();
      
      if (lastAttempt && now - parseInt(lastAttempt) < 5000) { // 5 second cooldown
        console.log('❌ Rate limit exceeded, please wait');
        context.cancel();
        return;
      }
      
      if (attempts >= 5) {
        console.log('❌ Too many attempts, blocking submission');
        context.cancel();
        return;
      }
      
      localStorage.setItem('lastSubmissionAttempt', now.toString());
      context.modify({ 
        data: { 
          ...context.data, 
          submissionAttempts: attempts + 1 
        } 
      });
    }
    
    await next();
  }
};

const dataTransformationMiddleware: Middleware<FormStage, FormData> = {
  name: 'data-transformation',
  async execute(context, next) {
    console.log(`🔄 Data transformation middleware: ${context.from} → ${context.to}`);
    
    // Transform data before validation
    if (context.to === 'validation' && context.data) {
      const transformedData = {
        ...context.data,
        email: context.data.email?.toLowerCase().trim(),
        // Remove confirm password from data after validation
        confirmPassword: undefined
      };
      
      context.modify({ data: transformedData });
    }
    
    await next();
  }
};

const analyticsMiddleware: Middleware<FormStage, FormData> = {
  name: 'analytics',
  async execute(context, next) {
    const startTime = Date.now();
    
    // Track transition start
    trackEvent('stage_transition_start', {
      from: context.from,
      to: context.to,
      timestamp: startTime
    });
    
    try {
      await next();
      
      // Track successful transition
      trackEvent('stage_transition_success', {
        from: context.from,
        to: context.to,
        duration: Date.now() - startTime
      });
    } catch (error) {
      // Track failed transition
      trackEvent('stage_transition_error', {
        from: context.from,
        to: context.to,
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }
};

// Example 3: Conditional middleware
const conditionalValidationMiddleware: Middleware<FormStage, FormData> = {
  name: 'conditional-validation',
  async execute(context, next) {
    // Only run validation for specific transitions
    if (context.to === 'validation') {
      const errors: string[] = [];
      
      // Email validation
      if (!context.data?.email) {
        errors.push('Email is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(context.data.email)) {
        errors.push('Invalid email format');
      }
      
      // Password validation
      if (!context.data?.password) {
        errors.push('Password is required');
      } else if (context.data.password.length < 8) {
        errors.push('Password must be at least 8 characters');
      }
      
      // Confirm password validation
      if (context.data?.password !== context.data?.confirmPassword) {
        errors.push('Passwords do not match');
      }
      
      if (errors.length > 0) {
        context.modify({ 
          to: 'input',
          data: { 
            ...context.data, 
            validationErrors: errors 
          } 
        });
      }
    }
    
    await next();
  }
};

// Example 4: Async middleware with external API calls
const serverValidationMiddleware: Middleware<FormStage, FormData> = {
  name: 'server-validation',
  async execute(context, next) {
    if (context.to === 'submission' && context.data?.email) {
      console.log('🌐 Checking email availability...');
      
      try {
        const isAvailable = await checkEmailAvailability(context.data.email);
        if (!isAvailable) {
          context.modify({ 
            to: 'input',
            data: { 
              ...context.data, 
              validationErrors: ['Email is already taken'] 
            } 
          });
          return;
        }
      } catch (error) {
        console.error('Server validation failed:', error);
        // Continue with submission despite validation error
      }
    }
    
    await next();
  }
};

// Example 5: Advanced middleware configuration
const advancedMiddlewareConfig: StageFlowConfig<FormStage, FormData> = {
  initial: 'input',
  stages: [
    {
      name: 'input',
      transitions: [
        { 
          target: 'validation', 
          event: 'validate',
          // Stage-specific middleware
          middleware: [conditionalValidationMiddleware]
        }
      ]
    },
    {
      name: 'validation',
      transitions: [
        { 
          target: 'submission', 
          event: 'submit',
          middleware: [
            authenticationMiddleware,
            rateLimitingMiddleware,
            serverValidationMiddleware
          ]
        },
        { target: 'input', event: 'invalid' }
      ]
    },
    {
      name: 'submission',
      transitions: [
        { target: 'success', event: 'complete' },
        { target: 'error', event: 'failed' }
      ]
    },
    {
      name: 'success',
      transitions: [{ target: 'input', event: 'reset' }]
    },
    {
      name: 'error',
      transitions: [
        { target: 'input', event: 'retry' },
        { target: 'submission', event: 'resubmit' }
      ]
    }
  ],
  // Global middleware (runs for all transitions)
  middleware: [
    dataTransformationMiddleware,
    analyticsMiddleware,
    createLoggingMiddleware({ logLevel: 'debug' })
  ]
};

// Example 6: Middleware composition and chaining
class MiddlewareComposer<TStage extends string, TData = any> {
  private middleware: Middleware<TStage, TData>[] = [];

  add(middleware: Middleware<TStage, TData>): this {
    this.middleware.push(middleware);
    return this;
  }

  compose(): Middleware<TStage, TData> {
    return {
      name: 'composed-middleware',
      async execute(context, next) {
        let index = 0;
        
        const dispatch = async (): Promise<void> => {
          if (index >= this.middleware.length) {
            return next();
          }
          
          const middleware = this.middleware[index++];
          return middleware.execute(context, dispatch);
        };
        
        return dispatch();
      }
    };
  }
}

// Example usage of middleware composer
const composedMiddleware = new MiddlewareComposer<FormStage, FormData>()
  .add(authenticationMiddleware)
  .add(rateLimitingMiddleware)
  .add(dataTransformationMiddleware)
  .compose();

// Example 7: Middleware with state management
class StatefulMiddleware<TStage extends string, TData = any> implements Middleware<TStage, TData> {
  name = 'stateful-middleware';
  private state: Map<string, any> = new Map();

  async execute(context: TransitionContext<TStage, TData>, next: () => Promise<void>): Promise<void> {
    const key = `${context.from}-${context.to}`;
    const count = this.state.get(key) || 0;
    
    this.state.set(key, count + 1);
    
    console.log(`Transition ${key} has occurred ${count + 1} times`);
    
    await next();
  }

  getStats(): Record<string, number> {
    return Object.fromEntries(this.state);
  }
}

// Helper functions (would be implemented in a real application)
async function checkUserAuthentication(): Promise<boolean> {
  // Simulate authentication check
  return new Promise(resolve => {
    setTimeout(() => resolve(Math.random() > 0.3), 100);
  });
}

async function checkEmailAvailability(email: string): Promise<boolean> {
  // Simulate server API call
  return new Promise(resolve => {
    setTimeout(() => resolve(!email.includes('taken')), 500);
  });
}

function trackEvent(event: string, data: any): void {
  // Simulate analytics tracking
  console.log(`📊 Analytics: ${event}`, data);
}

// Example 8: Middleware management at runtime
async function demonstrateMiddlewareManagement() {
  const engine = new StageFlowEngine(basicMiddlewareConfig);
  
  // Add middleware at runtime
  engine.addMiddleware(authenticationMiddleware);
  engine.addMiddleware(rateLimitingMiddleware);
  
  await engine.start();
  
  // Simulate form submission flow
  await engine.send('validate', {
    email: 'user@example.com',
    password: 'password123',
    confirmPassword: 'password123'
  });
  
  try {
    await engine.send('submit', {
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
  } catch (error) {
    console.log('Expected authentication failure:', error.message);
  }
  
  // Remove middleware
  engine.removeMiddleware('rate-limiting');
  
  await engine.stop();
}

// Export examples for use in other files
export {
  basicMiddlewareConfig,
  advancedMiddlewareConfig,
  authenticationMiddleware,
  rateLimitingMiddleware,
  dataTransformationMiddleware,
  analyticsMiddleware,
  conditionalValidationMiddleware,
  serverValidationMiddleware,
  MiddlewareComposer,
  StatefulMiddleware,
  composedMiddleware,
  demonstrateMiddlewareManagement
};

// Run examples if this file is executed directly
const isDirectExecution = process.argv[1] && process.argv[1].includes('middleware-usage.ts');

if (isDirectExecution) {
  (async () => {
    console.log('🔧 Running middleware examples...\n');
    
    try {
      console.log('1. Basic middleware configuration');
      const basicEngine = new StageFlowEngine(basicMiddlewareConfig);
      await basicEngine.start();
      console.log(`✅ Basic engine with middleware started at stage: ${basicEngine.getCurrentStage()}`);
      await basicEngine.stop();
      
      console.log('\n2. Advanced middleware configuration');
      const advancedEngine = new StageFlowEngine(advancedMiddlewareConfig);
      await advancedEngine.start();
      console.log(`✅ Advanced engine with complex middleware started`);
      await advancedEngine.stop();
      
      console.log('\n3. Middleware management demonstration');
      await demonstrateMiddlewareManagement();
      
      console.log('\n🎉 All middleware examples completed successfully!');
    } catch (error) {
      console.error('❌ Error running middleware examples:', error);
    }
  })();
}

// Example usage in a React component:
/*
import { StageFlowEngine } from '@stage-flow/core';
import { useStageFlow } from '@stage-flow/react';
import { advancedMiddlewareConfig } from './middleware-usage';

function FormComponent() {
  const [engine] = useState(() => new StageFlowEngine(advancedMiddlewareConfig));
  const { currentStage, data, send } = useStageFlow(engine);
  
  const handleSubmit = async (formData: FormData) => {
    try {
      await send('validate', formData);
      await send('submit');
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {currentStage === 'input' && (
        <div>
          <input type="email" name="email" />
          <input type="password" name="password" />
          <button type="submit">Submit</button>
        </div>
      )}
      {data?.validationErrors && (
        <div>
          {data.validationErrors.map(error => (
            <div key={error} style={{ color: 'red' }}>{error}</div>
          ))}
        </div>
      )}
    </form>
  );
}
*/