/**
 * Logging plugin for stage flow library
 * Provides configurable logging with timestamps and context
 */

import type { Plugin, StageContext, TransitionContext } from '@stage-flow/core';

// Type alias for the engine parameter that plugins receive
type PluginEngine<TStage extends string, TData = unknown> = Parameters<Plugin<TStage, TData>['install']>[0];

/**
 * Log levels for the logging plugin
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * Configuration options for the logging plugin
 */
export interface LoggingPluginConfig {
  /** Minimum log level to output */
  level: LogLevel;
  /** Whether to include timestamps in logs */
  includeTimestamp: boolean;
  /** Whether to include stage context in logs */
  includeContext: boolean;
  /** Whether to log stage transitions */
  logTransitions: boolean;
  /** Whether to log stage enter/exit events */
  logStageEvents: boolean;
  /** Custom log prefix */
  prefix: string;
  /** Custom logger function (defaults to console) */
  logger?: {
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
  };
  /** Whether to enable development mode features */
  developmentMode: boolean;
}

/**
 * Default configuration for the logging plugin
 */
const DEFAULT_CONFIG: LoggingPluginConfig = {
  level: LogLevel.INFO,
  includeTimestamp: true,
  includeContext: true,
  logTransitions: true,
  logStageEvents: true,
  prefix: '[StageFlow]',
  logger: console,
  developmentMode: process.env.NODE_ENV === 'development'
};

/**
 * Logging plugin implementation
 */
export class LoggingPlugin<TStage extends string, TData = unknown> implements Plugin<TStage, TData> {
  public readonly name = 'logging';
  public readonly version = '1.0.0';

  private config: LoggingPluginConfig;
  private engine?: PluginEngine<TStage, TData>;
  private transitionStartTimes = new Map<string, number>();

  constructor(config: Partial<LoggingPluginConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Install the plugin
   */
  public async install(engine: PluginEngine<TStage, TData>): Promise<void> {
    this.engine = engine;

    if (this.config.developmentMode) {
      this.setupDevelopmentMode();
    }

    this.log(LogLevel.INFO, 'Logging plugin installed', {
      config: this.config,
      currentStage: engine.getCurrentStage()
    });
  }

  /**
   * Uninstall the plugin
   */
  public async uninstall(): Promise<void> {
    this.log(LogLevel.INFO, 'Logging plugin uninstalled');
    this.engine = undefined;
    this.transitionStartTimes.clear();
  }

  /**
   * Plugin lifecycle hooks
   */
  public hooks = {
    beforeTransition: async (context: TransitionContext<TStage, TData>): Promise<void> => {
      if (!this.config.logTransitions) return;

      const transitionId = `${context.from}->${context.to}`;
      this.transitionStartTimes.set(transitionId, context.timestamp);

      this.log(LogLevel.INFO, 'Transition starting', {
        from: context.from,
        to: context.to,
        event: context.event,
        timestamp: context.timestamp,
        data: this.config.includeContext ? context.data : undefined
      });

      if (this.config.developmentMode) {
        this.logDevelopmentInfo('beforeTransition', context);
      }
    },

    afterTransition: async (context: TransitionContext<TStage, TData>): Promise<void> => {
      if (!this.config.logTransitions) return;

      const transitionId = `${context.from}->${context.to}`;
      const startTime = this.transitionStartTimes.get(transitionId);
      const duration = startTime ? Date.now() - startTime : undefined;

      this.transitionStartTimes.delete(transitionId);

      this.log(LogLevel.INFO, 'Transition completed', {
        from: context.from,
        to: context.to,
        event: context.event,
        duration: duration ? `${duration}ms` : 'unknown',
        timestamp: context.timestamp,
        data: this.config.includeContext ? context.data : undefined
      });

      if (this.config.developmentMode) {
        this.logDevelopmentInfo('afterTransition', context);
      }
    },

    onStageEnter: async (context: StageContext<TStage, TData>): Promise<void> => {
      if (!this.config.logStageEvents) return;

      this.log(LogLevel.INFO, 'Stage entered', {
        stage: context.current,
        timestamp: context.timestamp,
        data: this.config.includeContext ? context.data : undefined
      });

      if (this.config.developmentMode) {
        this.logDevelopmentInfo('onStageEnter', context);
      }
    },

    onStageExit: async (context: StageContext<TStage, TData>): Promise<void> => {
      if (!this.config.logStageEvents) return;

      this.log(LogLevel.INFO, 'Stage exited', {
        stage: context.current,
        timestamp: context.timestamp,
        data: this.config.includeContext ? context.data : undefined
      });

      if (this.config.developmentMode) {
        this.logDevelopmentInfo('onStageExit', context);
      }
    }
  };

  /**
   * Update plugin configuration
   */
  public updateConfig(config: Partial<LoggingPluginConfig>): void {
    this.config = { ...this.config, ...config };
    this.log(LogLevel.DEBUG, 'Configuration updated', { config: this.config });
  }

  /**
   * Get current configuration
   */
  public getConfig(): LoggingPluginConfig {
    return { ...this.config };
  }

  /**
   * Log a message with the specified level
   */
  private log(level: LogLevel, message: string, context?: unknown): void {
    if (level < this.config.level || !this.config.logger) return;

    const timestamp = this.config.includeTimestamp
      ? new Date().toISOString()
      : '';

    const prefix = this.config.prefix;
    const fullMessage = [timestamp, prefix, message].filter(Boolean).join(' ');

    const logMethod = this.getLogMethod(level);

    if (context && this.config.includeContext) {
      logMethod(fullMessage, context);
    } else {
      logMethod(fullMessage);
    }
  }

  /**
   * Get the appropriate log method for the level
   */
  private getLogMethod(level: LogLevel): (message: string, ...args: unknown[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return this.config.logger!.debug;
      case LogLevel.INFO:
        return this.config.logger!.info;
      case LogLevel.WARN:
        return this.config.logger!.warn;
      case LogLevel.ERROR:
        return this.config.logger!.error;
      default:
        return this.config.logger!.info;
    }
  }

  /**
   * Setup development mode features
   */
  private setupDevelopmentMode(): void {
    if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
      // Add global debugging utilities in browser environment
      (globalThis as Record<string, unknown>).__stageFlowDebug = {
        getEngine: (): PluginEngine<TStage, TData> | undefined => this.engine,
        getCurrentStage: (): TStage | undefined => this.engine?.getCurrentStage(),
        getCurrentData: (): TData | undefined => this.engine?.getCurrentData(),
        getInstalledPlugins: (): string[] | undefined => this.engine?.getInstalledPlugins(),
        setLogLevel: (level: LogLevel): void => {
          this.config.level = level;
          this.log(LogLevel.INFO, `Log level changed to ${LogLevel[level]}`);
        },
        enableVerboseLogging: (): void => {
          this.updateConfig({
            level: LogLevel.DEBUG,
            includeContext: true,
            logTransitions: true,
            logStageEvents: true
          });
          this.log(LogLevel.INFO, 'Verbose logging enabled');
        },
        disableLogging: (): void => {
          this.updateConfig({ level: LogLevel.NONE });
          console.info('[StageFlow] Logging disabled');
        }
      };

      this.log(LogLevel.DEBUG, 'Development mode enabled. Use __stageFlowDebug for debugging utilities');
    }
  }

  /**
   * Log development-specific information
   */
  private logDevelopmentInfo(
    event: string,
    context: StageContext<TStage, TData> | TransitionContext<TStage, TData>
  ): void {
    if (!this.config.developmentMode) return;

    const devInfo: Record<string, unknown> = {
      event,
      timestamp: context.timestamp,
      engine: {
        installedPlugins: this.engine?.getInstalledPlugins(),
        currentStage: this.engine?.getCurrentStage()
      }
    };

    if ('from' in context && 'to' in context) {
      // TransitionContext
      devInfo.transition = {
        from: context.from,
        to: context.to,
        event: context.event
      };
    } else {
      // StageContext
      devInfo.stage = {
        current: context.current
      };
    }

    this.log(LogLevel.DEBUG, `[DEV] ${event}`, devInfo);
  }

  /**
   * Create a logging plugin instance with default configuration
   */
  static create<TStage extends string, TData = unknown>(
    config: Partial<LoggingPluginConfig> = {}
  ): LoggingPlugin<TStage, TData> {
    return new LoggingPlugin<TStage, TData>(config);
  }

  /**
   * Create a logging plugin instance for development
   */
  static createForDevelopment<TStage extends string, TData = unknown>(
    config: Partial<LoggingPluginConfig> = {}
  ): LoggingPlugin<TStage, TData> {
    return new LoggingPlugin<TStage, TData>({
      level: LogLevel.DEBUG,
      developmentMode: true,
      includeContext: true,
      logTransitions: true,
      logStageEvents: true,
      ...config
    });
  }

  /**
   * Create a logging plugin instance for production
   */
  static createForProduction<TStage extends string, TData = unknown>(
    config: Partial<LoggingPluginConfig> = {}
  ): LoggingPlugin<TStage, TData> {
    return new LoggingPlugin<TStage, TData>({
      level: LogLevel.WARN,
      developmentMode: false,
      includeContext: false,
      logTransitions: false,
      logStageEvents: false,
      ...config
    });
  }
}