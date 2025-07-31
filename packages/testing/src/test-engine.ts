/**
 * Test engine for stage flow library with time control and state inspection
 */

import {
  StageFlowConfig,
  StageFlowEngine,
  StageFlowState,
  Plugin,
  Middleware
} from '@stage-flow/core';

/**
 * Test-specific configuration options
 */
export interface TestEngineOptions {
  /** Whether to automatically start the engine */
  autoStart?: boolean;
  /** Initial time for the test engine */
  initialTime?: number;
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * Mock timer interface for controlling time in tests
 */
interface MockTimer {
  id: string;
  callback: () => void;
  delay: number;
  scheduledTime: number;
  executed: boolean;
}

/**
 * Enhanced stage flow engine for testing with time control and state inspection
 */
export class StageFlowTestEngine<TStage extends string, TData = unknown> {
  private engine: StageFlowEngine<TStage, TData>;
  private mockTime: number;
  private mockTimers: Map<string, MockTimer>;
  private timerIdCounter: number;
  private originalSetTimeout: typeof setTimeout;
  private originalClearTimeout: typeof clearTimeout;
  private isTimeControlActive: boolean;
  private debug: boolean;

  constructor(
    config: StageFlowConfig<TStage, TData>,
    options: TestEngineOptions = {}
  ) {
    this.mockTime = options.initialTime || 0;
    this.mockTimers = new Map();
    this.timerIdCounter = 0;
    this.isTimeControlActive = false;
    this.debug = options.debug || false;
    
    // Store original timer functions
    this.originalSetTimeout = global.setTimeout;
    this.originalClearTimeout = global.clearTimeout;

    // Enable time control before creating the engine so timers are mocked from the start
    this.enableTimeControl();

    // Create the engine
    this.engine = new StageFlowEngine(config);

    // Auto-start if requested
    if (options.autoStart !== false) {
      this.start();
    }
  }

  /**
   * Creates a test engine instance
   */
  static create<TStage extends string, TData = unknown>(
    config: StageFlowConfig<TStage, TData>,
    options: TestEngineOptions = {}
  ): StageFlowTestEngine<TStage, TData> {
    return new StageFlowTestEngine(config, options);
  }

  /**
   * Enables time control by mocking setTimeout and clearTimeout
   */
  enableTimeControl(): void {
    if (this.isTimeControlActive) {
      return;
    }

    this.isTimeControlActive = true;

    // Mock setTimeout
    global.setTimeout = ((callback: () => void, delay: number) => {
      const id = `timer_${this.timerIdCounter++}`;
      const timer: MockTimer = {
        id,
        callback,
        delay,
        scheduledTime: this.mockTime + delay,
        executed: false
      };
      
      this.mockTimers.set(id, timer);
      
      if (this.debug) {
        console.log(`[TestEngine] Timer scheduled: ${id} at ${timer.scheduledTime}`);
      }
      
      return id as any;
    }) as typeof setTimeout;

    // Mock clearTimeout
    global.clearTimeout = ((id: any) => {
      const timer = this.mockTimers.get(id);
      if (timer) {
        this.mockTimers.delete(id);
        if (this.debug) {
          console.log(`[TestEngine] Timer cleared: ${id}`);
        }
      }
    }) as typeof clearTimeout;
  }

  /**
   * Disables time control and restores original timer functions
   */
  disableTimeControl(): void {
    if (!this.isTimeControlActive) {
      return;
    }

    this.isTimeControlActive = false;
    global.setTimeout = this.originalSetTimeout;
    global.clearTimeout = this.originalClearTimeout;
    this.mockTimers.clear();
  }

  /**
   * Advances mock time by the specified amount
   */
  advanceTime(ms: number): void {
    if (!this.isTimeControlActive) {
      this.enableTimeControl();
    }

    const targetTime = this.mockTime + ms;
    
    if (this.debug) {
      console.log(`[TestEngine] Advancing time from ${this.mockTime} to ${targetTime}`);
    }

    // Execute all timers that should fire during this time advance
    const timersToExecute = Array.from(this.mockTimers.values())
      .filter(timer => !timer.executed && timer.scheduledTime <= targetTime)
      .sort((a, b) => a.scheduledTime - b.scheduledTime);

    for (const timer of timersToExecute) {
      this.mockTime = timer.scheduledTime;
      timer.executed = true;
      this.mockTimers.delete(timer.id);
      
      if (this.debug) {
        console.log(`[TestEngine] Executing timer: ${timer.id} at ${this.mockTime}`);
      }
      
      try {
        timer.callback();
      } catch (error) {
        console.error(`[TestEngine] Timer callback error:`, error);
      }
    }

    this.mockTime = targetTime;
  }

  /**
   * Advances time to the next scheduled timer
   */
  advanceToNextTimer(): boolean {
    if (!this.isTimeControlActive) {
      this.enableTimeControl();
    }

    const nextTimer = Array.from(this.mockTimers.values())
      .filter(timer => !timer.executed)
      .sort((a, b) => a.scheduledTime - b.scheduledTime)[0];

    if (!nextTimer) {
      return false;
    }

    const timeToAdvance = nextTimer.scheduledTime - this.mockTime;
    this.advanceTime(timeToAdvance);
    return true;
  }

  /**
   * Advances to the next transition (finds the next timer and executes it)
   */
  advanceToNextTransition(): boolean {
    return this.advanceToNextTimer();
  }

  /**
   * Gets the current mock time
   */
  getCurrentTime(): number {
    return this.mockTime;
  }

  /**
   * Gets all pending timers
   */
  getPendingTimers(): Array<{ id: string; delay: number; scheduledTime: number }> {
    return Array.from(this.mockTimers.values())
      .filter(timer => !timer.executed)
      .map(timer => ({
        id: timer.id,
        delay: timer.delay,
        scheduledTime: timer.scheduledTime
      }));
  }

  /**
   * Gets the internal state of the engine for inspection
   */
  getState(): StageFlowState<TStage, TData> {
    // Access private state through reflection (for testing purposes)
    const state = (this.engine as any).state as StageFlowState<TStage, TData>;
    return {
      current: state.current,
      data: state.data,
      isTransitioning: state.isTransitioning,
      history: [...state.history], // Create a copy
      plugins: new Map(state.plugins), // Create a copy
      middleware: [...state.middleware] // Create a copy
    };
  }

  /**
   * Gets the transition history
   */
  getHistory(): Array<{ stage: TStage; timestamp: number; data?: TData }> {
    return this.getState().history;
  }

  /**
   * Gets the current stage
   */
  getCurrentStage(): TStage {
    return this.engine.getCurrentStage();
  }

  /**
   * Gets the current data
   */
  getCurrentData(): TData | undefined {
    return this.engine.getCurrentData();
  }

  /**
   * Checks if the engine is currently transitioning
   */
  isTransitioning(): boolean {
    return this.getState().isTransitioning;
  }

  /**
   * Gets installed plugin names
   */
  getInstalledPlugins(): string[] {
    return this.engine.getInstalledPlugins();
  }

  /**
   * Gets registered middleware names
   */
  getRegisteredMiddleware(): string[] {
    return this.getState().middleware.map(m => m.name);
  }

  /**
   * Waits for the engine to finish any ongoing transitions
   */
  async waitForTransition(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isTransitioning()) {
        resolve();
        return;
      }

      const unsubscribe = this.engine.subscribe(() => {
        if (!this.isTransitioning()) {
          unsubscribe();
          resolve();
        }
      });
    });
  }

  /**
   * Waits for a specific stage to be reached
   */
  async waitForStage(stage: TStage, timeout: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.getCurrentStage() === stage) {
        resolve();
        return;
      }

      const timeoutId = this.originalSetTimeout(() => {
        unsubscribe();
        reject(new Error(`Timeout waiting for stage: ${stage}`));
      }, timeout);

      const unsubscribe = this.engine.subscribe((currentStage) => {
        if (currentStage === stage) {
          this.originalClearTimeout(timeoutId);
          unsubscribe();
          resolve();
        }
      });
    });
  }

  /**
   * Resets the test engine to its initial state
   */
  async reset(): Promise<void> {
    this.mockTime = 0;
    this.mockTimers.clear();
    await this.engine.reset();
  }

  /**
   * Starts the engine
   */
  async start(): Promise<void> {
    await this.engine.start();
  }

  /**
   * Stops the engine and cleans up
   */
  async stop(): Promise<void> {
    await this.engine.stop();
    this.disableTimeControl();
  }

  // Delegate all other methods to the underlying engine
  async send(event: string, data?: TData): Promise<void> {
    return this.engine.send(event, data);
  }

  async goTo(stage: TStage, data?: TData): Promise<void> {
    return this.engine.goTo(stage, data);
  }

  subscribe(callback: (stage: TStage, data?: TData) => void): () => void {
    return this.engine.subscribe(callback);
  }

  async installPlugin(plugin: Plugin<TStage, TData>): Promise<void> {
    return this.engine.installPlugin(plugin);
  }

  async uninstallPlugin(name: string): Promise<void> {
    return this.engine.uninstallPlugin(name);
  }

  getPlugin(name: string): Plugin<TStage, TData> | undefined {
    return this.engine.getPlugin(name);
  }

  getPluginState(name: string): Record<string, unknown> | undefined {
    return this.engine.getPluginState(name);
  }

  setPluginState(name: string, state: Record<string, unknown>): void {
    return this.engine.setPluginState(name, state);
  }

  addMiddleware(middleware: Middleware<TStage, TData>): void {
    return this.engine.addMiddleware(middleware);
  }

  removeMiddleware(name: string): void {
    return this.engine.removeMiddleware(name);
  }

  getCurrentStageEffect(): string | undefined {
    return this.engine.getCurrentStageEffect();
  }

  getStageEffect(stage: TStage): string | undefined {
    return this.engine.getStageEffect(stage);
  }
}