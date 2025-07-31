/**
 * Built-in middleware for common use cases
 */

import { Middleware, TransitionContext } from "../types/core";
import { MiddlewareError } from "../types/errors";

/**
 * Logging middleware that logs all transitions
 */
export function createLoggingMiddleware<TStage extends string, TData = unknown>(
  options: {
    logLevel?: "debug" | "info" | "warn" | "error";
    prefix?: string;
    includeData?: boolean;
  } = {}
): Middleware<TStage, TData> {
  const {
    logLevel = "info",
    prefix = "[StageFlow]",
    includeData = false,
  } = options;

  return {
    name: "logging-middleware",
    execute: async (
      context: TransitionContext<TStage, TData>,
      next: () => Promise<void>
    ): Promise<void> => {
      const logMessage = includeData
        ? `${prefix} Transition: ${context.from} -> ${context.to} (event: ${
            context.event || "direct"
          }, data: ${JSON.stringify(context.data)})`
        : `${prefix} Transition: ${context.from} -> ${context.to} (event: ${
            context.event || "direct"
          })`;

      // Log based on level
      switch (logLevel) {
        case "debug":
          console.debug(logMessage);
          break;
        case "info":
          console.info(logMessage);
          break;
        case "warn":
          console.warn(logMessage);
          break;
        case "error":
          console.error(logMessage);
          break;
      }

      await next();
    },
  };
}

/**
 * Validation middleware that validates transition data
 */
export function createValidationMiddleware<
  TStage extends string,
  TData = unknown
>(
  validator: (
    context: TransitionContext<TStage, TData>
  ) => boolean | Promise<boolean>,
  options: {
    errorMessage?: string;
  } = {}
): Middleware<TStage, TData> {
  const { errorMessage = "Validation failed" } = options;

  return {
    name: "validation-middleware",
    execute: async (
      context: TransitionContext<TStage, TData>,
      next: () => Promise<void>
    ): Promise<void> => {
      const isValid = await validator(context);

      if (!isValid) {
        throw new Error(errorMessage);
      }

      await next();
    },
  };
}

/**
 * Timing middleware that measures transition duration
 */
export function createTimingMiddleware<TStage extends string, TData = unknown>(
  options: {
    onComplete?: (
      duration: number,
      context: TransitionContext<TStage, TData>
    ) => void;
    logTiming?: boolean;
    threshold?: number; // Log only if duration exceeds threshold (ms)
  } = {}
): Middleware<TStage, TData> {
  const { onComplete, logTiming = false, threshold = 0 } = options;

  return {
    name: "timing-middleware",
    execute: async (
      context: TransitionContext<TStage, TData>,
      next: () => Promise<void>
    ): Promise<void> => {
      const startTime = Date.now();

      await next();

      const duration = Date.now() - startTime;

      if (logTiming && duration >= threshold) {
        console.info(
          `[StageFlow] Transition ${context.from} -> ${context.to} took ${duration}ms`
        );
      }

      if (onComplete) {
        onComplete(duration, context);
      }
    },
  };
}

/**
 * Rate limiting middleware that prevents rapid transitions
 */
export function createRateLimitMiddleware<
  TStage extends string,
  TData = unknown
>(options: {
  windowMs: number; // Time window in milliseconds
  maxTransitions: number; // Maximum transitions allowed in window
  keyGenerator?: (context: TransitionContext<TStage, TData>) => string;
}): Middleware<TStage, TData> {
  const {
    windowMs,
    maxTransitions,
    keyGenerator = (ctx): string => `${ctx.from}-${ctx.to}`,
  } = options;
  const transitionCounts = new Map<
    string,
    { count: number; resetTime: number }
  >();

  return {
    name: "rate-limit-middleware",
    execute: async (
      context: TransitionContext<TStage, TData>,
      next: () => Promise<void>
    ): Promise<void> => {
      const key = keyGenerator(context);
      const now = Date.now();

      let record = transitionCounts.get(key);

      if (!record || now >= record.resetTime) {
        record = { count: 0, resetTime: now + windowMs };
        transitionCounts.set(key, record);
      }

      if (record.count >= maxTransitions) {
        throw new Error(
          `Rate limit exceeded for transition ${context.from} -> ${context.to}`
        );
      }

      record.count++;
      await next();
    },
  };
}

/**
 * Conditional middleware that only executes if condition is met
 */
export function createConditionalMiddleware<
  TStage extends string,
  TData = unknown
>(
  condition: (
    context: TransitionContext<TStage, TData>
  ) => boolean | Promise<boolean>,
  middleware: Middleware<TStage, TData>
): Middleware<TStage, TData> {
  return {
    name: `conditional-${middleware.name}`,
    execute: async (
      context: TransitionContext<TStage, TData>,
      next: () => Promise<void>
    ): Promise<void> => {
      const shouldExecute = await condition(context);

      if (shouldExecute) {
        await middleware.execute(context, next);
      } else {
        await next();
      }
    },
  };
}
/**
 *
 Middleware composition utilities
 */

/**
 * Composes multiple middleware into a single middleware
 */
export function composeMiddleware<TStage extends string, TData = unknown>(
  ...middlewares: Middleware<TStage, TData>[]
): Middleware<TStage, TData> {
  return {
    name: `composed-${middlewares.map((m) => m.name).join("-")}`,
    execute: async (
      context: TransitionContext<TStage, TData>,
      next: () => Promise<void>
    ): Promise<void> => {
      let currentIndex = 0;

      const executeNext = async (): Promise<void> => {
        if (currentIndex >= middlewares.length) {
          await next();
          return;
        }

        const middleware = middlewares[currentIndex++];
        await middleware.execute(context, executeNext);
      };

      await executeNext();
    },
  };
}

/**
 * Creates a middleware that executes only for specific stages
 */
export function createStageSpecificMiddleware<
  TStage extends string,
  TData = unknown
>(
  stages: TStage[],
  middleware: Middleware<TStage, TData>,
  options: {
    matchType?: "from" | "to" | "both";
  } = {}
): Middleware<TStage, TData> {
  const { matchType = "from" } = options;

  return createConditionalMiddleware((context): boolean => {
    switch (matchType) {
      case "from":
        return stages.includes(context.from);
      case "to":
        return stages.includes(context.to);
      case "both":
        return stages.includes(context.from) && stages.includes(context.to);
      default:
        return false;
    }
  }, middleware);
}

/**
 * Creates a middleware that executes only for specific events
 */
export function createEventSpecificMiddleware<
  TStage extends string,
  TData = unknown
>(
  events: string[],
  middleware: Middleware<TStage, TData>
): Middleware<TStage, TData> {
  return createConditionalMiddleware(
    (context): boolean =>
      context.event ? events.includes(context.event) : false,
    middleware
  );
}

/**
 * Creates a middleware that retries failed operations
 * Note: This middleware should be placed early in the pipeline to catch errors from subsequent middleware
 */
export function createRetryMiddleware<
  TStage extends string,
  TData = unknown
>(options: {
  maxRetries: number;
  retryDelay?: number;
  shouldRetry?: (
    error: Error,
    context: TransitionContext<TStage, TData>
  ) => boolean;
}): Middleware<TStage, TData> {
  const {
    maxRetries,
    retryDelay = 1000,
    shouldRetry = (): boolean => true,
  } = options;

  return {
    name: "retry-middleware",
    execute: async (
      context: TransitionContext<TStage, TData>,
      next: (resetIndex?: number) => Promise<void>
    ): Promise<void> => {
      let attempts = 0;
      let lastError: Error;

      while (attempts <= maxRetries) {
        try {
          await next();
          return; // Success, exit retry loop
        } catch (error) {
          // Unwrap MiddlewareError to get the original error for retry logic
          let originalError = error;
          if (
            typeof error === "object" &&
            error !== null &&
            "context" in error &&
            error instanceof MiddlewareError &&
            (error as any).context &&
            (error as any).context.error
          ) {
            originalError = (error as any).context.error;
          }
          lastError = originalError as Error;
          attempts++;

          // Check if we should retry
          if (attempts > maxRetries || !shouldRetry(lastError, context)) {
            // On the last attempt, throw the original error for retry tests
            throw lastError;
          }

          // Wait before retrying
          if (retryDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }
      }
    },
  };
}

/**
 * Creates a middleware that caches transition results
 */
export function createCacheMiddleware<TStage extends string, TData = unknown>(
  options: {
    keyGenerator?: (context: TransitionContext<TStage, TData>) => string;
    ttl?: number; // Time to live in milliseconds
    maxSize?: number; // Maximum cache size
  } = {}
): Middleware<TStage, TData> {
  const {
    keyGenerator = (ctx): string =>
      `${ctx.from}-${ctx.to}-${ctx.event ?? "direct"}`,
    ttl = 60000,
  } = options;

  const cache = new Map<string, { result: unknown; timestamp: number }>();

  return {
    name: "cache-middleware",
    execute: async (
      context: TransitionContext<TStage, TData>,
      next: (resetIndex?: number) => Promise<void>
    ): Promise<void> => {
      const key = keyGenerator(context);
      const now = Date.now();

      // Check cache
      const cached = cache.get(key);
      if (cached) {
        const age = now - cached.timestamp;
        if (age < ttl) {
          // Cache hit - skip execution
          return;
        } else {
          // Cache expired - delete entry
          cache.delete(key);
        }
      }

      // Cache miss or expired - execute and cache result
      await next();

      // Update cache with new timestamp only after execution
      cache.set(key, { result: true, timestamp: now });
    },
  };
}
