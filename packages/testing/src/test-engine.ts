/**
 * Test engine for stage flow library with time control and state inspection
 */

import {
  StageFlowConfig,
  StageFlowEngine,
  StageFlowState,
  Plugin,
  Middleware,
  EffectConfig
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
  // Removed unused timerIdCounter variable
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
    this.isTimeControlActive = false;
    this.debug = options.debug || false;
    
    // Store original timer functions
    this.originalSetTimeout = global.setTimeout;
    this.originalClearTimeout = global.clearTimeout;

    // Enable time control before creating the engine so timers are mocked from the start
    this.enableTimeControl();
    // Create the engine (타이머 모킹 이후에 생성해야 함)
    this.engine = new StageFlowEngine(config);

    // mockTime을 globalThis에 노출
    (globalThis as any).mockTime = this.mockTime;

    // Mock Date.now to use mockTime for timer registration
    const self = this;
    global.Date.now = function() { return self.mockTime; };

    // Auto-start if requested
    if (options.autoStart !== false) {
      this.start();
    }

    // Sync engine timers with mock timers after engine is started
    this._syncEngineTimers();
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
    const timers = (this.engine as any).timerManager.getActiveTimers();
    return timers.map((timer: any) => ({
      id: timer.id,
      delay: timer.duration,
      scheduledTime: timer.startTime + timer.duration
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

  getCurrentStageEffect(): string | EffectConfig | undefined {
    return this.engine.getCurrentStageEffect();
  }

  getStageEffect(stage: TStage): string | EffectConfig | undefined {
    return this.engine.getStageEffect(stage);
  }

  setStageData(data: TData): void {
    return this.engine.setStageData(data);
  }

  pauseTimers(): void {
    return this.engine.pauseTimers();
  }

  resumeTimers(): void {
    return this.engine.resumeTimers();
  }

  resetTimers(): void {
    return this.engine.resetTimers();
  }

  getTimerRemainingTime(): number {
    return this.engine.getTimerRemainingTime();
  }

  areTimersPaused(): boolean {
    return this.engine.areTimersPaused();
  }

  /**
   * Syncs engine timers with mock timers
   */
  private _syncEngineTimers(): void {
    const engineTimers = this.engine.getActiveTimers();
    
    if (this.debug) {
      console.log(`[TestEngine] Syncing engine timers. Found ${engineTimers.length} timers`);
    }
    
    for (const timer of engineTimers) {
      // Check if timer is already in mock timers
      if (!this.mockTimers.has(timer.id)) {
        // Add timer to mock timers
        const mockTimer: MockTimer = {
          id: timer.id,
          callback: async () => {
            // This callback will be called when timer expires
            // The actual transition will be handled by the engine
            // We need to trigger the engine's timer execution
            await this._executeEngineTimer(timer.id);
          },
          delay: timer.duration,
          scheduledTime: timer.startTime + timer.duration,
          executed: false
        };
        
        this.mockTimers.set(timer.id, mockTimer);
        
        if (this.debug) {
          console.log(`[TestEngine] Synced engine timer: ${timer.id}`);
        }
      }
    }
  }

  /**
   * Executes a specific engine timer
   */
  private async _executeEngineTimer(timerId: string): Promise<void> {
    // Access the engine's timer manager and execute the timer
    const timerManager = (this.engine as any).timerManager;
    if (timerManager && timerManager._timers.has(timerId)) {
      // Get the timer configuration
      const timerConfig = timerManager._timerConfigs.get(timerId);
      if (timerConfig) {
        // Parse timer ID to get target
        const parts = timerId.split('-');
        if (parts.length >= 3) {
          const target = parts[1];
          
          // Create a transition object
          const transition = {
            target: target as any,
            after: timerConfig.duration
          };
          
          // Execute the transition by directly calling the engine's goTo method
          // This simulates the timer-based transition
          try {
            await this.engine.goTo(transition.target as any);
          } catch (error) {
            console.error(`[TestEngine] Timer execution error:`, error);
          }
        }
      }
    }
  }
}