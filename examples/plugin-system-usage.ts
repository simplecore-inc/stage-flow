/**
 * Example demonstrating the plugin system with built-in and custom plugins
 */

import {
  StageFlowEngine,
  StageFlowConfig,
  Plugin,
  TransitionContext,
  StageContext
} from '@stage-flow/core';
import {
  LoggingPlugin,
  PersistencePlugin,
  AnalyticsPlugin,
  LogLevel
} from '@stage-flow/plugins';

// Define stage types for our example
type CheckoutStage = 'cart' | 'shipping' | 'payment' | 'confirmation' | 'error';

interface CheckoutData {
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  shippingAddress?: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  paymentMethod?: {
    type: 'credit' | 'debit' | 'paypal';
    last4?: string;
  };
  orderTotal?: number;
  orderId?: string;
  errorMessage?: string;
}

// Example 1: Using built-in plugins
const basicPluginConfig: StageFlowConfig<CheckoutStage, CheckoutData> = {
  initial: 'cart',
  stages: [
    {
      name: 'cart',
      transitions: [
        { target: 'shipping', event: 'proceed' },
        { target: 'error', event: 'error' }
      ]
    },
    {
      name: 'shipping',
      transitions: [
        { target: 'payment', event: 'continue' },
        { target: 'cart', event: 'back' },
        { target: 'error', event: 'error' }
      ]
    },
    {
      name: 'payment',
      transitions: [
        { target: 'confirmation', event: 'submit' },
        { target: 'shipping', event: 'back' },
        { target: 'error', event: 'error' }
      ]
    },
    {
      name: 'confirmation',
      transitions: [
        { target: 'cart', event: 'newOrder' }
      ]
    },
    {
      name: 'error',
      transitions: [
        { target: 'cart', event: 'restart' },
        { target: 'shipping', event: 'retry' }
      ]
    }
  ],
  plugins: [
    // Built-in logging plugin with custom configuration
    new LoggingPlugin({
      level: LogLevel.INFO,
      includeContext: true,
      includeTimestamp: true,
      logger: {
        debug: (message: string, ...args: unknown[]) => {
          console.log(`[DEBUG] ${message}`, ...args);
        },
        info: (message: string, ...args: unknown[]) => {
          console.log(`[INFO] ${message}`, ...args);
        },
        warn: (message: string, ...args: unknown[]) => {
          console.log(`[WARN] ${message}`, ...args);
        },
        error: (message: string, ...args: unknown[]) => {
          console.log(`[ERROR] ${message}`, ...args);
        }
      }
    }),
    
    // Built-in persistence plugin
    new PersistencePlugin({
      storage: 'localStorage',
      key: 'checkout-progress',
      ttl: 30 * 60 * 1000, // 30 minutes
      serializer: {
        serialize: (state) => JSON.stringify(state),
        deserialize: (data) => JSON.parse(data)
      }
    }),
    
    // Built-in analytics plugin
    new AnalyticsPlugin({
      trackTransitions: true,
      trackStageDurations: true,
      eventHandlers: [
        (event) => {
          // Send to your analytics service
          console.log('Analytics:', event);
        }
      ]
    })
  ]
};

// Example 2: Creating custom plugins
class ValidationPlugin<TStage extends string, TData = any> implements Plugin<TStage, TData> {
  name = 'validation';
  version = '1.0.0';
  
  private validators: Map<TStage, (data?: TData) => boolean> = new Map();

  constructor(validators: Record<string, (data?: TData) => boolean> = {}) {
    Object.entries(validators).forEach(([stage, validator]) => {
      this.validators.set(stage as TStage, validator);
    });
  }

  async install(engine: any): Promise<void> {
    console.log(`Installing ${this.name} plugin v${this.version}`);
  }

  async uninstall(engine: any): Promise<void> {
    console.log(`Uninstalling ${this.name} plugin`);
  }

  hooks = {
    beforeTransition: async (context: TransitionContext<TStage, TData>) => {
      const validator = this.validators.get(context.to);
      if (validator && !validator(context.data)) {
        console.warn(`Validation failed for stage: ${context.to}`);
        context.cancel();
      }
    }
  };
}

class NotificationPlugin<TStage extends string, TData = any> implements Plugin<TStage, TData> {
  name = 'notification';
  version = '1.0.0';
  
  private notifications: Map<TStage, string> = new Map();

  constructor(notifications: Record<string, string> = {}) {
    Object.entries(notifications).forEach(([stage, message]) => {
      this.notifications.set(stage as TStage, message);
    });
  }

  async install(engine: any): Promise<void> {
    console.log(`Installing ${this.name} plugin v${this.version}`);
  }

  hooks = {
    onStageEnter: async (context: StageContext<TStage, TData>) => {
      const message = this.notifications.get(context.current);
      if (message) {
        this.showNotification(message, context.data);
      }
    }
  };

  private showNotification(message: string, data?: TData): void {
    // In a real app, this would show a toast notification
    console.log(`🔔 Notification: ${message}`, data);
  }
}

class MetricsPlugin<TStage extends string, TData = any> implements Plugin<TStage, TData> {
  name = 'metrics';
  version = '1.0.0';
  
  private metrics: Map<string, number> = new Map();
  private stageStartTimes: Map<TStage, number> = new Map();

  async install(engine: any): Promise<void> {
    console.log(`Installing ${this.name} plugin v${this.version}`);
  }

  hooks = {
    onStageEnter: async (context: StageContext<TStage, TData>) => {
      this.stageStartTimes.set(context.current, Date.now());
      this.incrementMetric(`stage_${context.current}_entries`);
    },

    onStageExit: async (context: StageContext<TStage, TData>) => {
      const startTime = this.stageStartTimes.get(context.current);
      if (startTime) {
        const duration = Date.now() - startTime;
        this.recordMetric(`stage_${context.current}_duration`, duration);
        this.stageStartTimes.delete(context.current);
      }
    },

    afterTransition: async (context: TransitionContext<TStage, TData>) => {
      this.incrementMetric(`transition_${context.from}_to_${context.to}`);
    }
  };

  private incrementMetric(key: string): void {
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
  }

  private recordMetric(key: string, value: number): void {
    const existing = this.metrics.get(key) || 0;
    this.metrics.set(key, (existing + value) / 2); // Simple average
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}

// Example 3: Advanced plugin configuration with custom plugins
const advancedPluginConfig: StageFlowConfig<CheckoutStage, CheckoutData> = {
  initial: 'cart',
  stages: [
    {
      name: 'cart',
      transitions: [{ target: 'shipping', event: 'proceed' }]
    },
    {
      name: 'shipping',
      transitions: [
        { target: 'payment', event: 'continue' },
        { target: 'cart', event: 'back' }
      ]
    },
    {
      name: 'payment',
      transitions: [
        { target: 'confirmation', event: 'submit' },
        { target: 'shipping', event: 'back' }
      ]
    },
    {
      name: 'confirmation',
      transitions: [{ target: 'cart', event: 'newOrder' }]
    }
  ],
  plugins: [
    // Custom validation plugin
    new ValidationPlugin<CheckoutStage, CheckoutData>({
      shipping: (data) => {
        return !!(data?.shippingAddress?.street && 
                 data?.shippingAddress?.city && 
                 data?.shippingAddress?.zipCode);
      },
      payment: (data) => {
        return !!(data?.paymentMethod?.type && data?.orderTotal && data.orderTotal > 0);
      }
    }),
    
    // Custom notification plugin
    new NotificationPlugin<CheckoutStage, CheckoutData>({
      cart: 'Welcome to checkout! Review your items.',
      shipping: 'Please enter your shipping information.',
      payment: 'Secure payment processing.',
      confirmation: 'Order confirmed! Thank you for your purchase.'
    }),
    
    // Custom metrics plugin
    new MetricsPlugin<CheckoutStage, CheckoutData>(),
    
    // Built-in plugins with advanced configuration
    new LoggingPlugin({
      level: LogLevel.DEBUG,
      includeContext: true,
      logTransitions: true,
      logStageEvents: false
    })
  ]
};

// Example 4: Plugin management and lifecycle
async function demonstratePluginManagement() {
  const engine = new StageFlowEngine(basicPluginConfig);
  
  // Install additional plugins at runtime
  const metricsPlugin = new MetricsPlugin<CheckoutStage, CheckoutData>();
  await engine.installPlugin(metricsPlugin);
  
  // Start the engine
  await engine.start();
  
  // Simulate some transitions
  await engine.send('proceed', {
    items: [
      { id: '1', name: 'Product A', price: 29.99, quantity: 2 }
    ]
  });
  
  await engine.send('continue', {
    items: [
      { id: '1', name: 'Product A', price: 29.99, quantity: 2 }
    ],
    shippingAddress: {
      street: '123 Main St',
      city: 'Anytown',
      zipCode: '12345',
      country: 'US'
    }
  });
  
  await engine.send('submit', {
    items: [
      { id: '1', name: 'Product A', price: 29.99, quantity: 2 }
    ],
    paymentMethod: { type: 'credit', last4: '1234' },
    orderTotal: 59.98,
    orderId: 'ORD-12345'
  });
  
  // Get metrics from the plugin
  console.log('Metrics:', metricsPlugin.getMetrics());
  
  // Uninstall a plugin
  await engine.uninstallPlugin('metrics');
  
  // Stop the engine
  await engine.stop();
}

// Example 5: Plugin error handling
class ErrorPronePlugin<TStage extends string, TData = any> implements Plugin<TStage, TData> {
  name = 'error-prone';
  version = '1.0.0';

  async install(engine: any): Promise<void> {
    console.log('Installing error-prone plugin');
  }

  hooks = {
    beforeTransition: async (context: TransitionContext<TStage, TData>) => {
      // Simulate random errors
      if (Math.random() < 0.1) { // 10% chance of error
        throw new Error('Plugin error occurred!');
      }
    }
  };
}

async function demonstratePluginErrorHandling() {
  const config: StageFlowConfig<CheckoutStage, CheckoutData> = {
    initial: 'cart',
    stages: [
      {
        name: 'cart',
        transitions: [{ target: 'shipping', event: 'proceed' }]
      },
          {
      name: 'shipping',
      transitions: [{ target: 'payment', event: 'continue' }]
    },
    {
      name: 'payment',
      transitions: [{ target: 'confirmation', event: 'submit' }]
    },
    {
      name: 'confirmation',
      transitions: [{ target: 'cart', event: 'newOrder' }]
    }
    ],
    plugins: [
      new ErrorPronePlugin<CheckoutStage, CheckoutData>(),
      new LoggingPlugin({ level: LogLevel.ERROR })
    ]
  };

  const engine = new StageFlowEngine(config);
  await engine.start();

  // Try multiple transitions - some may fail due to plugin errors
  for (let i = 0; i < 5; i++) {
    try {
      await engine.send('proceed');
      await engine.send('continue');
      console.log(`Attempt ${i + 1}: Success`);
    } catch (error) {
      console.log(`Attempt ${i + 1}: Failed -`, error.message);
    }
  }

  await engine.stop();
}

// Export examples for use in other files
export {
  basicPluginConfig,
  advancedPluginConfig,
  ValidationPlugin,
  NotificationPlugin,
  MetricsPlugin,
  demonstratePluginManagement,
  demonstratePluginErrorHandling
};

// Run examples if this file is executed directly
const isDirectExecution = process.argv[1] && process.argv[1].includes('plugin-system-usage.ts');

if (isDirectExecution) {
  (async () => {
    console.log('🔌 Running plugin system examples...\n');
    
    try {
      console.log('1. Basic plugin configuration');
      const basicEngine = new StageFlowEngine(basicPluginConfig);
      await basicEngine.start();
      console.log(`✅ Basic engine with plugins started at stage: ${basicEngine.getCurrentStage()}`);
      await basicEngine.stop();
      
      console.log('\n2. Advanced plugin configuration');
      const advancedEngine = new StageFlowEngine(advancedPluginConfig);
      await advancedEngine.start();
      console.log(`✅ Advanced engine with custom plugins started`);
      await advancedEngine.stop();
      
      console.log('\n3. Plugin management demonstration');
      await demonstratePluginManagement();
      
      console.log('\n4. Plugin error handling demonstration');
      await demonstratePluginErrorHandling();
      
      console.log('\n🎉 All plugin system examples completed successfully!');
    } catch (error) {
      console.error('❌ Error running plugin system examples:', error);
    }
  })();
}
