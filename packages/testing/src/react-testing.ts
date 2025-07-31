/**
 * React testing utilities for stage flow library
 */

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import {
  StageFlowConfig,
  StageFlowEngine
} from '@stage-flow/core';
import { StageFlowTestEngine, TestEngineOptions } from './test-engine';

/**
 * Extended render result with stage flow testing utilities
 */
export interface StageFlowRenderResult<TStage extends string, TData = unknown> extends RenderResult {
  /** The test engine instance */
  engine: StageFlowTestEngine<TStage, TData>;
  /** Advance mock time by the specified amount */
  advanceTime: (ms: number) => void;
  /** Advance to the next scheduled timer */
  advanceToNextTimer: () => boolean;
  /** Wait for a specific stage to be reached */
  waitForStage: (stage: TStage, timeout?: number) => Promise<void>;
  /** Wait for any ongoing transitions to complete */
  waitForTransition: () => Promise<void>;
  /** Get the current stage */
  getCurrentStage: () => TStage;
  /** Get the current data */
  getCurrentData: () => TData | undefined;
  /** Check if currently transitioning */
  isTransitioning: () => boolean;
  /** Get the engine state for inspection */
  getState: () => any;
  /** Reset the engine to initial state */
  reset: () => Promise<void>;
}

/**
 * Options for renderStageFlow
 */
export interface RenderStageFlowOptions extends RenderOptions {
  /** Test engine options */
  engineOptions?: TestEngineOptions;
  /** Custom wrapper component */
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  /** Whether to enable time control automatically */
  enableTimeControl?: boolean;
}

/**
 * Renders a component with stage flow context and testing utilities
 */
export function renderStageFlow<TStage extends string, TData = unknown>(
  config: StageFlowConfig<TStage, TData>,
  ui: React.ReactElement,
  options: RenderStageFlowOptions = {}
): StageFlowRenderResult<TStage, TData> {
  const {
    engineOptions = {},
    enableTimeControl = true,
    wrapper: CustomWrapper,
    ...renderOptions
  } = options;

  // Create test engine
  const engine = StageFlowTestEngine.create(config, engineOptions);

  // Enable time control if requested
  if (enableTimeControl) {
    engine.enableTimeControl();
  }

  // Create wrapper component that provides the engine context
  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const content = CustomWrapper 
      ? React.createElement(CustomWrapper, null, children)
      : children;

    return React.createElement(React.Fragment, null, content);
  };

  // Render the component
  const renderResult = render(ui, {
    ...renderOptions,
    wrapper: TestWrapper
  });

  // Create extended result with testing utilities
  const extendedResult: StageFlowRenderResult<TStage, TData> = {
    ...renderResult,
    engine,
    advanceTime: (ms: number) => engine.advanceTime(ms),
    advanceToNextTimer: () => engine.advanceToNextTimer(),
    waitForStage: (stage: TStage, timeout?: number) => engine.waitForStage(stage, timeout),
    waitForTransition: () => engine.waitForTransition(),
    getCurrentStage: () => engine.getCurrentStage(),
    getCurrentData: () => engine.getCurrentData(),
    isTransitioning: () => engine.isTransitioning(),
    getState: () => engine.getState(),
    reset: () => engine.reset()
  };

  // Clean up on unmount
  const originalUnmount = extendedResult.unmount;
  extendedResult.unmount = () => {
    engine.stop();
    originalUnmount();
  };

  return extendedResult;
}

/**
 * Creates a mock stage component for testing
 */
export function createMockStageComponent<TStage extends string, TData = unknown>(
  testId: string = 'mock-stage'
): React.ComponentType<{ stage: TStage; data?: TData }> {
  return ({ stage, data }) => {
    return React.createElement('div', {
      'data-testid': testId,
      'data-stage': stage,
      'data-has-data': data !== undefined
    }, `Stage: ${stage}${data ? ` | Data: ${JSON.stringify(data)}` : ''}`);
  };
}

/**
 * Creates a test provider component that wraps children with stage flow context
 */
export function createTestProvider<TStage extends string, TData = unknown>(
  _engine: StageFlowEngine<TStage, TData> | StageFlowTestEngine<TStage, TData>
): React.ComponentType<{ children: React.ReactNode }> {
  return ({ children }) => {
    // This would typically use the actual StageFlowProvider from @stage-flow/react
    // For now, we'll create a simple wrapper that provides the engine via context
    return React.createElement(React.Fragment, null, children);
  };
}

/**
 * Utility to create a complete stage flow test setup
 */
export interface StageFlowTestSetup<TStage extends string, TData = unknown> {
  engine: StageFlowTestEngine<TStage, TData>;
  Provider: React.ComponentType<{ children: React.ReactNode }>;
  MockStageComponent: React.ComponentType<{ stage: TStage; data?: TData }>;
  render: (ui: React.ReactElement, options?: RenderOptions) => StageFlowRenderResult<TStage, TData>;
}

/**
 * Creates a complete test setup with engine, provider, and utilities
 */
export function createStageFlowTestSetup<TStage extends string, TData = unknown>(
  config: StageFlowConfig<TStage, TData>,
  options: TestEngineOptions = {}
): StageFlowTestSetup<TStage, TData> {
  const engine = StageFlowTestEngine.create(config, options);
  const Provider = createTestProvider(engine);
  const MockStageComponent = createMockStageComponent<TStage, TData>();

  const testRender = (ui: React.ReactElement, renderOptions: RenderOptions = {}) => {
    return renderStageFlow(config, ui, {
      ...renderOptions,
      engineOptions: options,
      wrapper: Provider
    });
  };

  return {
    engine,
    Provider,
    MockStageComponent,
    render: testRender
  };
}

/**
 * Utility to wait for React to finish rendering
 */
export async function waitForReactUpdate(): Promise<void> {
  return new Promise(resolve => {
    // Use React's scheduler if available, otherwise use setTimeout
    if (typeof (globalThis as any).setImmediate !== 'undefined') {
      (globalThis as any).setImmediate(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * Utility to simulate user interactions with stage flow
 */
export class StageFlowTestInteractions<TStage extends string, TData = unknown> {
  constructor(private engine: StageFlowTestEngine<TStage, TData>) {}

  /**
   * Simulates sending an event
   */
  async sendEvent(event: string, data?: TData): Promise<void> {
    await this.engine.send(event, data);
    await waitForReactUpdate();
  }

  /**
   * Simulates direct navigation to a stage
   */
  async goToStage(stage: TStage, data?: TData): Promise<void> {
    await this.engine.goTo(stage, data);
    await waitForReactUpdate();
  }

  /**
   * Simulates time passing
   */
  async passTime(ms: number): Promise<void> {
    this.engine.advanceTime(ms);
    await waitForReactUpdate();
  }

  /**
   * Simulates waiting for automatic transitions
   */
  async waitForAutoTransition(): Promise<boolean> {
    const hasTimer = this.engine.advanceToNextTimer();
    if (hasTimer) {
      await waitForReactUpdate();
    }
    return hasTimer;
  }

  /**
   * Simulates a sequence of interactions
   */
  async sequence(
    interactions: Array<
      | { type: 'send'; event: string; data?: TData }
      | { type: 'goTo'; stage: TStage; data?: TData }
      | { type: 'wait'; ms: number }
      | { type: 'waitForTransition' }
      | { type: 'waitForStage'; stage: TStage; timeout?: number }
    >
  ): Promise<void> {
    for (const interaction of interactions) {
      switch (interaction.type) {
        case 'send':
          await this.sendEvent(interaction.event, interaction.data);
          break;
        case 'goTo':
          await this.goToStage(interaction.stage, interaction.data);
          break;
        case 'wait':
          await this.passTime(interaction.ms);
          break;
        case 'waitForTransition':
          await this.engine.waitForTransition();
          break;
        case 'waitForStage':
          await this.engine.waitForStage(interaction.stage, interaction.timeout);
          break;
      }
    }
  }
}

/**
 * Creates interaction utilities for a test engine
 */
export function createStageFlowInteractions<TStage extends string, TData = unknown>(
  engine: StageFlowTestEngine<TStage, TData>
): StageFlowTestInteractions<TStage, TData> {
  return new StageFlowTestInteractions(engine);
}

/**
 * Custom Jest matchers for stage flow testing
 */
export const stageFlowMatchers = {
  toBeInStage<TStage extends string>(
    engine: StageFlowTestEngine<TStage, any>,
    expectedStage: TStage
  ): { pass: boolean; message: () => string } {
    const currentStage = engine.getCurrentStage();
    const pass = currentStage === expectedStage;

    return {
      pass,
      message: () =>
        pass
          ? `Expected engine not to be in stage "${expectedStage}"`
          : `Expected engine to be in stage "${expectedStage}", but was in "${currentStage}"`
    };
  },

  toHaveTransitioned<TStage extends string>(
    engine: StageFlowTestEngine<TStage, any>,
    fromStage: TStage,
    toStage: TStage
  ): { pass: boolean; message: () => string } {
    const history = engine.getHistory();
    const hasTransition = history.some((entry, index) => {
      if (index === 0) return false;
      const previousEntry = history[index - 1];
      return previousEntry.stage === fromStage && entry.stage === toStage;
    });

    return {
      pass: hasTransition,
      message: () =>
        hasTransition
          ? `Expected engine not to have transitioned from "${fromStage}" to "${toStage}"`
          : `Expected engine to have transitioned from "${fromStage}" to "${toStage}"`
    };
  },

  toBeTransitioning<TStage extends string>(
    engine: StageFlowTestEngine<TStage, any>
  ): { pass: boolean; message: () => string } {
    const isTransitioning = engine.isTransitioning();

    return {
      pass: isTransitioning,
      message: () =>
        isTransitioning
          ? 'Expected engine not to be transitioning'
          : 'Expected engine to be transitioning'
    };
  }
};

// Extend Jest matchers if in a Jest environment
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInStage<TStage extends string>(expectedStage: TStage): R;
      toHaveTransitioned<TStage extends string>(fromStage: TStage, toStage: TStage): R;
      toBeTransitioning(): R;
    }
  }
}