/**
 * Analytics plugin for stage flow library
 * Provides stage transition tracking and performance metrics
 */

import type { Plugin, StageContext, TransitionContext } from '@stage-flow/core';



/**
 * Analytics event types
 */
export type AnalyticsEventType =
  | 'stage_enter'
  | 'stage_exit'
  | 'transition_start'
  | 'transition_complete'
  | 'transition_cancel'
  | 'performance_metric';

/**
 * Analytics event data structure
 */
export interface AnalyticsEvent<TStage extends string, TData = unknown> {
  /** Event type */
  type: AnalyticsEventType;
  /** Event timestamp */
  timestamp: number;
  /** Stage information */
  stage?: TStage;
  /** Previous stage (for transitions) */
  fromStage?: TStage;
  /** Target stage (for transitions) */
  toStage?: TStage;
  /** Event that triggered the transition */
  event?: string;
  /** Associated data */
  data?: TData;
  /** Performance metrics */
  metrics?: {
    duration?: number;
    transitionTime?: number;
    stageDuration?: number;
  };
  /** Additional custom properties */
  properties?: Record<string, unknown>;
}

/**
 * Analytics event handler function
 */
export type AnalyticsEventHandler<TStage extends string, TData = unknown> = (
  event: AnalyticsEvent<TStage, TData>
) => void | Promise<void>;

/**
 * Performance metrics tracking
 */
interface PerformanceMetrics {
  stageEnterTime: number;
  transitionStartTime?: number;
  totalTransitions: number;
  stageDurations: Map<string, number[]>;
  transitionDurations: Map<string, number[]>;
}

/**
 * Configuration options for the analytics plugin
 */
export interface AnalyticsPluginConfig<TStage extends string, TData = unknown> {
  /** Whether to track stage enter/exit events */
  trackStageEvents: boolean;
  /** Whether to track transition events */
  trackTransitions: boolean;
  /** Whether to collect performance metrics */
  collectMetrics: boolean;
  /** Whether to track stage durations */
  trackStageDurations: boolean;
  /** Whether to track transition durations */
  trackTransitionDurations: boolean;
  /** Custom event handlers */
  eventHandlers: AnalyticsEventHandler<TStage, TData>[];
  /** Custom properties to include with all events */
  globalProperties?: Record<string, unknown>;
  /** Whether to batch events before sending */
  batchEvents: boolean;
  /** Batch size for event batching */
  batchSize: number;
  /** Batch timeout in milliseconds */
  batchTimeout: number;
  /** Whether to persist metrics across sessions */
  persistMetrics: boolean;
  /** Storage key for persisted metrics */
  metricsStorageKey: string;
}

/**
 * Default configuration for the analytics plugin
 */
const DEFAULT_CONFIG: AnalyticsPluginConfig<string, unknown> = {
  trackStageEvents: true,
  trackTransitions: true,
  collectMetrics: true,
  trackStageDurations: true,
  trackTransitionDurations: true,
  eventHandlers: [],
  batchEvents: false,
  batchSize: 10,
  batchTimeout: 5000,
  persistMetrics: false,
  metricsStorageKey: 'stage-flow-analytics-metrics'
};

/**
 * Analytics plugin implementation
 */
export class AnalyticsPlugin<TStage extends string, TData = unknown> implements Plugin<TStage, TData> {
  public readonly name = 'analytics';
  public readonly version = '1.0.0';

  private config: AnalyticsPluginConfig<TStage, TData>;
  private metrics: PerformanceMetrics;
  private eventBatch: AnalyticsEvent<TStage, TData>[] = [];
  private batchTimer?: NodeJS.Timeout;

  constructor(config: Partial<AnalyticsPluginConfig<TStage, TData>> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as AnalyticsPluginConfig<TStage, TData>;
    this.metrics = this.initializeMetrics();
  }

  /**
   * Install the plugin
   */
  public async install(): Promise<void> {

    // Load persisted metrics if enabled
    if (this.config.persistMetrics) {
      this.loadPersistedMetrics();
    }

    // Initialize stage enter time
    this.metrics.stageEnterTime = Date.now();
  }

  /**
   * Uninstall the plugin
   */
  public async uninstall(): Promise<void> {
    // Flush any pending batched events
    if (this.config.batchEvents && this.eventBatch.length > 0) {
      await this.flushEventBatch();
    }

    // Clear batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    // Persist metrics if enabled
    if (this.config.persistMetrics) {
      this.persistMetrics();
    }


  }

  /**
   * Plugin lifecycle hooks
   */
  public hooks = {
    beforeTransition: async (context: TransitionContext<TStage, TData>): Promise<void> => {
      if (this.config.trackTransitions) {
        this.metrics.transitionStartTime = Date.now();

        await this.emitEvent({
          type: 'transition_start',
          timestamp: context.timestamp,
          fromStage: context.from,
          toStage: context.to,
          event: context.event,
          data: context.data
        });
      }
    },

    afterTransition: async (context: TransitionContext<TStage, TData>): Promise<void> => {
      if (this.config.trackTransitions) {
        const transitionDuration = this.metrics.transitionStartTime
          ? Date.now() - this.metrics.transitionStartTime
          : undefined;

        this.metrics.totalTransitions++;

        // Track transition duration
        if (this.config.trackTransitionDurations && transitionDuration !== undefined) {
          const transitionKey = `${context.from}->${context.to}`;
          if (!this.metrics.transitionDurations.has(transitionKey)) {
            this.metrics.transitionDurations.set(transitionKey, []);
          }
          this.metrics.transitionDurations.get(transitionKey)!.push(transitionDuration);
        }

        await this.emitEvent({
          type: 'transition_complete',
          timestamp: context.timestamp,
          fromStage: context.from,
          toStage: context.to,
          event: context.event,
          data: context.data,
          metrics: {
            transitionTime: transitionDuration,
            duration: transitionDuration
          }
        });

        this.metrics.transitionStartTime = undefined;
      }
    },

    onStageEnter: async (context: StageContext<TStage, TData>): Promise<void> => {
      const now = Date.now();

      if (this.config.trackStageEvents) {
        await this.emitEvent({
          type: 'stage_enter',
          timestamp: context.timestamp,
          stage: context.current,
          data: context.data
        });
      }

      this.metrics.stageEnterTime = now;
    },

    onStageExit: async (context: StageContext<TStage, TData>): Promise<void> => {
      const now = Date.now();
      const stageDuration = now - this.metrics.stageEnterTime;

      // Track stage duration
      if (this.config.trackStageDurations) {
        if (!this.metrics.stageDurations.has(context.current)) {
          this.metrics.stageDurations.set(context.current, []);
        }
        this.metrics.stageDurations.get(context.current)!.push(stageDuration);
      }

      if (this.config.trackStageEvents) {
        await this.emitEvent({
          type: 'stage_exit',
          timestamp: context.timestamp,
          stage: context.current,
          data: context.data,
          metrics: {
            stageDuration
          }
        });
      }
    }
  };

  /**
   * Add an event handler
   */
  public addEventHandler(handler: AnalyticsEventHandler<TStage, TData>): void {
    this.config.eventHandlers.push(handler);
  }

  /**
   * Remove an event handler
   */
  public removeEventHandler(handler: AnalyticsEventHandler<TStage, TData>): void {
    const index = this.config.eventHandlers.indexOf(handler);
    if (index > -1) {
      this.config.eventHandlers.splice(index, 1);
    }
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): {
    totalTransitions: number;
    averageStageDurations: Record<string, number>;
    averageTransitionDurations: Record<string, number>;
    stageDurationStats: Record<string, { min: number; max: number; avg: number; count: number }>;
    transitionDurationStats: Record<string, { min: number; max: number; avg: number; count: number }>;
  } {
    const averageStageDurations: Record<string, number> = {};
    const averageTransitionDurations: Record<string, number> = {};
    const stageDurationStats: Record<string, { min: number; max: number; avg: number; count: number }> = {};
    const transitionDurationStats: Record<string, { min: number; max: number; avg: number; count: number }> = {};

    // Calculate stage duration statistics
    for (const [stage, durations] of this.metrics.stageDurations.entries()) {
      if (durations.length > 0) {
        const sum = durations.reduce((a, b) => a + b, 0);
        const avg = sum / durations.length;
        averageStageDurations[stage] = avg;

        stageDurationStats[stage] = {
          min: Math.min(...durations),
          max: Math.max(...durations),
          avg,
          count: durations.length
        };
      }
    }

    // Calculate transition duration statistics
    for (const [transition, durations] of this.metrics.transitionDurations.entries()) {
      if (durations.length > 0) {
        const sum = durations.reduce((a, b) => a + b, 0);
        const avg = sum / durations.length;
        averageTransitionDurations[transition] = avg;

        transitionDurationStats[transition] = {
          min: Math.min(...durations),
          max: Math.max(...durations),
          avg,
          count: durations.length
        };
      }
    }

    return {
      totalTransitions: this.metrics.totalTransitions,
      averageStageDurations,
      averageTransitionDurations,
      stageDurationStats,
      transitionDurationStats
    };
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = this.initializeMetrics();

    if (this.config.persistMetrics) {
      this.persistMetrics();
    }
  }

  /**
   * Manually emit an analytics event
   */
  public async emitCustomEvent(
    type: AnalyticsEventType,
    properties: Partial<AnalyticsEvent<TStage, TData>> = {}
  ): Promise<void> {
    await this.emitEvent({
      type,
      timestamp: Date.now(),
      ...properties
    });
  }

  /**
   * Update plugin configuration
   */
  public updateConfig(config: Partial<AnalyticsPluginConfig<TStage, TData>>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): AnalyticsPluginConfig<TStage, TData> {
    return { ...this.config };
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      stageEnterTime: Date.now(),
      totalTransitions: 0,
      stageDurations: new Map(),
      transitionDurations: new Map()
    };
  }

  /**
   * Emit an analytics event
   */
  private async emitEvent(event: AnalyticsEvent<TStage, TData>): Promise<void> {
    // Add global properties
    if (this.config.globalProperties) {
      event.properties = { ...this.config.globalProperties, ...event.properties };
    }

    if (this.config.batchEvents) {
      this.eventBatch.push(event);

      if (this.eventBatch.length >= this.config.batchSize) {
        await this.flushEventBatch();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.flushEventBatch();
        }, this.config.batchTimeout);
      }
    } else {
      await this.sendEvent(event);
    }
  }

  /**
   * Send a single event to all handlers
   */
  private async sendEvent(event: AnalyticsEvent<TStage, TData>): Promise<void> {
    const promises = this.config.eventHandlers.map(handler => {
      try {
        return Promise.resolve(handler(event));
      } catch (error) {
        // Handle synchronous errors
        if (process.env.NODE_ENV !== 'test') {
          console.warn('[StageFlow Analytics] Event handler error:', error);
        }
        return Promise.resolve();
      }
    });

    try {
      await Promise.all(promises);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[StageFlow Analytics] Event handler error:', error);
      }
    }
  }

  /**
   * Flush batched events
   */
  private async flushEventBatch(): Promise<void> {
    if (this.eventBatch.length === 0) return;

    const events = [...this.eventBatch];
    this.eventBatch = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    // Send all events
    await Promise.all(events.map(event => this.sendEvent(event)));
  }

  /**
   * Load persisted metrics from storage
   */
  private loadPersistedMetrics(): void {
    try {
      if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
        const localStorage = (globalThis as Record<string, unknown>).localStorage as { getItem: (key: string) => string | null };
        const stored = localStorage.getItem(this.config.metricsStorageKey);
        if (stored) {
          const data = JSON.parse(stored);
          this.metrics.totalTransitions = data.totalTransitions || 0;
          this.metrics.stageDurations = new Map(data.stageDurations || []);
          this.metrics.transitionDurations = new Map(data.transitionDurations || []);
        }
      }
    } catch (error) {
      console.warn('[StageFlow Analytics] Failed to load persisted metrics:', error);
    }
  }

  /**
   * Persist metrics to storage
   */
  private persistMetrics(): void {
    try {
      if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
        const localStorage = (globalThis as Record<string, unknown>).localStorage as { setItem: (key: string, value: string) => void };
        const data = {
          totalTransitions: this.metrics.totalTransitions,
          stageDurations: Array.from(this.metrics.stageDurations.entries()),
          transitionDurations: Array.from(this.metrics.transitionDurations.entries())
        };

        localStorage.setItem(this.config.metricsStorageKey, JSON.stringify(data));
      }
    } catch (error) {
      console.warn('[StageFlow Analytics] Failed to persist metrics:', error);
    }
  }

  /**
   * Create an analytics plugin instance with default configuration
   */
  static create<TStage extends string, TData = unknown>(
    config: Partial<AnalyticsPluginConfig<TStage, TData>> = {}
  ): AnalyticsPlugin<TStage, TData> {
    return new AnalyticsPlugin<TStage, TData>(config);
  }

  /**
   * Create an analytics plugin instance with custom event handlers
   */
  static createWithHandlers<TStage extends string, TData = unknown>(
    handlers: AnalyticsEventHandler<TStage, TData>[],
    config: Partial<AnalyticsPluginConfig<TStage, TData>> = {}
  ): AnalyticsPlugin<TStage, TData> {
    return new AnalyticsPlugin<TStage, TData>({
      eventHandlers: handlers,
      ...config
    });
  }

  /**
   * Create an analytics plugin instance for performance tracking only
   */
  static createForPerformance<TStage extends string, TData = unknown>(
    config: Partial<AnalyticsPluginConfig<TStage, TData>> = {}
  ): AnalyticsPlugin<TStage, TData> {
    return new AnalyticsPlugin<TStage, TData>({
      trackStageEvents: false,
      trackTransitions: false,
      collectMetrics: true,
      trackStageDurations: true,
      trackTransitionDurations: true,
      ...config
    });
  }

  /**
   * Create an analytics plugin instance with event batching
   */
  static createWithBatching<TStage extends string, TData = unknown>(
    batchSize: number = 10,
    batchTimeout: number = 5000,
    config: Partial<AnalyticsPluginConfig<TStage, TData>> = {}
  ): AnalyticsPlugin<TStage, TData> {
    return new AnalyticsPlugin<TStage, TData>({
      batchEvents: true,
      batchSize,
      batchTimeout,
      ...config
    });
  }
}