/**
 * Mock utilities for plugins and middleware testing
 */

import { vi } from 'vitest';
import {
  Plugin,
  Middleware,
  StageContext,
  TransitionContext,
  StageFlowEngine
} from '@stage-flow/core';

/**
 * Mock plugin configuration
 */
export interface MockPluginConfig<TStage extends string, TData = unknown> {
  name: string;
  version?: string;
  dependencies?: string[];
  hooks?: {
    beforeTransition?: any | ((context: TransitionContext<TStage, TData>) => void | Promise<void>);
    afterTransition?: any | ((context: TransitionContext<TStage, TData>) => void | Promise<void>);
    onStageEnter?: any | ((context: StageContext<TStage, TData>) => void | Promise<void>);
    onStageExit?: any | ((context: StageContext<TStage, TData>) => void | Promise<void>);
  };
  install?: any | ((engine: StageFlowEngine<TStage, TData>) => void | Promise<void>);
  uninstall?: any | ((engine: StageFlowEngine<TStage, TData>) => void | Promise<void>);
  state?: Record<string, unknown>;
}

/**
 * Mock middleware configuration
 */
export interface MockMiddlewareConfig<TStage extends string, TData = unknown> {
  name: string;
  execute?: any | ((context: TransitionContext<TStage, TData>, next: () => Promise<void>) => Promise<void>);
  shouldCancel?: boolean;
  shouldModify?: Partial<{ to: TStage; data: TData }>;
  delay?: number;
  throwError?: Error;
}

/**
 * Creates a mock plugin for testing
 */
export function createMockPlugin<TStage extends string, TData = unknown>(
  config: MockPluginConfig<TStage, TData>
): Plugin<TStage, TData> {
  // Create mock functions if not provided
  const mockInstall = config.install || vi.fn();
  const mockUninstall = config.uninstall || vi.fn();
  
  // Always create hooks, using provided ones or defaults
  const mockHooks = {
    beforeTransition: config.hooks?.beforeTransition || vi.fn(),
    afterTransition: config.hooks?.afterTransition || vi.fn(),
    onStageEnter: config.hooks?.onStageEnter || vi.fn(),
    onStageExit: config.hooks?.onStageExit || vi.fn()
  };

  return {
    name: config.name,
    version: config.version,
    dependencies: config.dependencies,
    install: mockInstall,
    uninstall: mockUninstall,
    hooks: mockHooks,
    state: config.state || {}
  };
}

/**
 * Creates a mock middleware for testing
 */
export function createMockMiddleware<TStage extends string, TData = unknown>(
  config: MockMiddlewareConfig<TStage, TData>
): Middleware<TStage, TData> {
  const mockExecute = config.execute || vi.fn(async (context, next) => {
    // Add delay if specified
    if (config.delay) {
      await new Promise(resolve => setTimeout(resolve, config.delay));
    }

    // Throw error if specified
    if (config.throwError) {
      throw config.throwError;
    }

    // Cancel transition if specified
    if (config.shouldCancel) {
      context.cancel();
      return;
    }

    // Modify transition if specified
    if (config.shouldModify) {
      context.modify(config.shouldModify);
    }

    // Continue to next middleware
    await next();
  });

  return {
    name: config.name,
    execute: mockExecute
  };
}

/**
 * Creates a spy plugin that tracks all hook calls
 */
export function createSpyPlugin<TStage extends string, TData = unknown>(
  name: string
): Plugin<TStage, TData> & {
  calls: {
    install: Array<{ engine: any; timestamp: number }>;
    uninstall: Array<{ engine: any; timestamp: number }>;
    beforeTransition: Array<{ context: any; timestamp: number }>;
    afterTransition: Array<{ context: any; timestamp: number }>;
    onStageEnter: Array<{ context: any; timestamp: number }>;
    onStageExit: Array<{ context: any; timestamp: number }>;
  };
} {
  const calls = {
    install: [] as Array<{ engine: any; timestamp: number }>,
    uninstall: [] as Array<{ engine: any; timestamp: number }>,
    beforeTransition: [] as Array<{ context: any; timestamp: number }>,
    afterTransition: [] as Array<{ context: any; timestamp: number }>,
    onStageEnter: [] as Array<{ context: any; timestamp: number }>,
    onStageExit: [] as Array<{ context: any; timestamp: number }>
  };

  const plugin = {
    name,
    install: vi.fn(async (engine: any) => {
      calls.install.push({ engine, timestamp: Date.now() });
    }),
    uninstall: vi.fn(async (engine: any) => {
      calls.uninstall.push({ engine, timestamp: Date.now() });
    }),
    hooks: {
      beforeTransition: vi.fn(async (context: any) => {
        calls.beforeTransition.push({ context, timestamp: Date.now() });
      }),
      afterTransition: vi.fn(async (context: any) => {
        calls.afterTransition.push({ context, timestamp: Date.now() });
      }),
      onStageEnter: vi.fn(async (context: any) => {
        calls.onStageEnter.push({ context, timestamp: Date.now() });
      }),
      onStageExit: vi.fn(async (context: any) => {
        calls.onStageExit.push({ context, timestamp: Date.now() });
      })
    },
    state: {},
    calls
  };

  return plugin;
}

/**
 * Creates a spy middleware that tracks all execution calls
 */
export function createSpyMiddleware<TStage extends string, TData = unknown>(
  name: string
): Middleware<TStage, TData> & {
  calls: Array<{
    context: TransitionContext<TStage, TData>;
    timestamp: number;
    completed: boolean;
    error?: Error;
  }>;
} {
  const calls: Array<{
    context: TransitionContext<TStage, TData>;
    timestamp: number;
    completed: boolean;
    error?: Error;
  }> = [];

  const originalExecute = async (context: TransitionContext<TStage, TData>, next: () => Promise<void>) => {
    const callRecord = {
      context,
      timestamp: Date.now(),
      completed: false,
      error: undefined as Error | undefined
    };
    
    calls.push(callRecord);

    try {
      await next();
      callRecord.completed = true;
    } catch (error) {
      callRecord.error = error as Error;
      throw error;
    }
  };

  const mockExecute = vi.fn(originalExecute);

  // Override mockImplementation to preserve spy functionality
  const originalMockImplementation = mockExecute.mockImplementation.bind(mockExecute);
  mockExecute.mockImplementation = (impl: any) => {
    return originalMockImplementation(async (context: TransitionContext<TStage, TData>, next: () => Promise<void>) => {
      const callRecord = {
        context,
        timestamp: Date.now(),
        completed: false,
        error: undefined as Error | undefined
      };
      
      calls.push(callRecord);

      try {
        await impl(context, next);
        callRecord.completed = true;
      } catch (error) {
        callRecord.error = error as Error;
        throw error;
      }
    });
  };

  const middleware = {
    name,
    execute: mockExecute,
    calls
  };

  return middleware;
}

/**
 * Creates a plugin that simulates async operations
 */
export function createAsyncPlugin<TStage extends string, TData = unknown>(
  name: string,
  delays: {
    install?: number;
    uninstall?: number;
    beforeTransition?: number;
    afterTransition?: number;
    onStageEnter?: number;
    onStageExit?: number;
  } = {}
): Plugin<TStage, TData> {
  return {
    name,
    install: vi.fn(async (_engine) => {
      if (delays.install) {
        await new Promise(resolve => setTimeout(resolve, delays.install));
      }
    }),
    uninstall: vi.fn(async (_engine) => {
      if (delays.uninstall) {
        await new Promise(resolve => setTimeout(resolve, delays.uninstall));
      }
    }),
    hooks: {
      beforeTransition: vi.fn(async (_context) => {
        if (delays.beforeTransition) {
          await new Promise(resolve => setTimeout(resolve, delays.beforeTransition));
        }
      }),
      afterTransition: vi.fn(async (_context) => {
        if (delays.afterTransition) {
          await new Promise(resolve => setTimeout(resolve, delays.afterTransition));
        }
      }),
      onStageEnter: vi.fn(async (_context) => {
        if (delays.onStageEnter) {
          await new Promise(resolve => setTimeout(resolve, delays.onStageEnter));
        }
      }),
      onStageExit: vi.fn(async (_context) => {
        if (delays.onStageExit) {
          await new Promise(resolve => setTimeout(resolve, delays.onStageExit));
        }
      })
    },
    state: {}
  };
}

/**
 * Creates a middleware that simulates async operations
 */
export function createAsyncMiddleware<TStage extends string, TData = unknown>(
  name: string,
  delay: number = 100
): Middleware<TStage, TData> {
  return {
    name,
    execute: vi.fn(async (_context, _next) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      await _next();
    })
  };
}

/**
 * Creates a plugin that throws errors for testing error handling
 */
export function createErrorPlugin<TStage extends string, TData = unknown>(
  name: string,
  errorConfig: {
    install?: Error;
    uninstall?: Error;
    beforeTransition?: Error;
    afterTransition?: Error;
    onStageEnter?: Error;
    onStageExit?: Error;
  } = {}
): Plugin<TStage, TData> {
  return {
    name,
    install: vi.fn(async (_engine) => {
      if (errorConfig.install) {
        throw errorConfig.install;
      }
    }),
    uninstall: vi.fn(async (_engine) => {
      if (errorConfig.uninstall) {
        throw errorConfig.uninstall;
      }
    }),
    hooks: {
      beforeTransition: vi.fn(async (_context) => {
        if (errorConfig.beforeTransition) {
          throw errorConfig.beforeTransition;
        }
      }),
      afterTransition: vi.fn(async (_context) => {
        if (errorConfig.afterTransition) {
          throw errorConfig.afterTransition;
        }
      }),
      onStageEnter: vi.fn(async (_context) => {
        if (errorConfig.onStageEnter) {
          throw errorConfig.onStageEnter;
        }
      }),
      onStageExit: vi.fn(async (_context) => {
        if (errorConfig.onStageExit) {
          throw errorConfig.onStageExit;
        }
      })
    },
    state: {}
  };
}

/**
 * Creates a middleware that throws errors for testing error handling
 */
export function createErrorMiddleware<TStage extends string, TData = unknown>(
  name: string,
  error: Error
): Middleware<TStage, TData> {
  return {
    name,
    execute: vi.fn(async (_context, _next) => {
      throw error;
    })
  };
}

/**
 * Utility to wait for a specific number of calls on a mock function
 */
export async function waitForCalls(
  mockFn: { mock: { calls: any[] } },
  expectedCalls: number,
  timeout: number = 1000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkCalls = () => {
      if (mockFn.mock.calls.length >= expectedCalls) {
        resolve();
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for ${expectedCalls} calls. Got ${mockFn.mock.calls.length}`));
        return;
      }
      
      setTimeout(checkCalls, 10);
    };
    
    checkCalls();
  });
}

/**
 * Utility to reset all mocks in a plugin
 */
export function resetPluginMocks(plugin: Plugin<any, any>): void {
  if (vi.isMockFunction(plugin.install)) {
    plugin.install.mockReset();
  }
  if (vi.isMockFunction(plugin.uninstall)) {
    plugin.uninstall.mockReset();
  }
  if (plugin.hooks) {
    Object.values(plugin.hooks).forEach(hook => {
      if (hook && vi.isMockFunction(hook)) {
        hook.mockReset();
      }
    });
  }
}

/**
 * Utility to reset all mocks in a middleware
 */
export function resetMiddlewareMocks(middleware: Middleware<any, any>): void {
  if (vi.isMockFunction(middleware.execute)) {
    middleware.execute.mockReset();
  }
}