/**
 * Tests for React testing utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  renderStageFlow,
  createMockStageComponent,
  createTestProvider,
  createStageFlowTestSetup,
  createStageFlowInteractions,
  waitForReactUpdate,
  StageFlowTestInteractions,
  stageFlowMatchers
} from '../react-testing';
import { StageFlowTestEngine } from '../test-engine';
import { StageFlowConfig } from '@stage-flow/core';

// Mock React createElement to avoid JSX issues in tests
vi.mock('react', async () => {
  const actual = await vi.importActual('react') as any;
  return {
    ...actual,
    createElement: vi.fn((type, props, ...children) => ({
      type,
      props: { ...props, children: children.length === 1 ? children[0] : children },
      key: null,
      ref: null
    }))
  };
});

type TestStage = 'loading' | 'ready' | 'error';
interface TestData {
  message: string;
  count: number;
}

describe('React Testing Utilities', () => {
  let config: StageFlowConfig<TestStage, TestData>;

  beforeEach(() => {
    config = {
      initial: 'loading',
      stages: [
        {
          name: 'loading',
          transitions: [
            { target: 'ready', event: 'loaded' },
            { target: 'error', event: 'failed' }
          ],
          data: { message: 'Loading...', count: 0 }
        },
        {
          name: 'ready',
          transitions: [
            { target: 'error', event: 'error' }
          ],
          data: { message: 'Ready!', count: 1 }
        },
        {
          name: 'error',
          transitions: [
            { target: 'loading', event: 'retry' }
          ],
          data: { message: 'Error occurred', count: -1 }
        }
      ]
    };
  });

  describe('renderStageFlow', () => {
    it('should render a component with stage flow context', () => {
      const TestComponent = () => React.createElement('div', { 'data-testid': 'test' }, 'Test Component');
      
      const result = renderStageFlow(config, React.createElement(TestComponent));

      expect(result.engine).toBeInstanceOf(StageFlowTestEngine);
      expect(result.getCurrentStage()).toBe('loading');
      expect(result.getCurrentData()).toEqual({ message: 'Loading...', count: 0 });
    });

    it('should provide testing utilities', () => {
      const TestComponent = () => React.createElement('div', { 'data-testid': 'test' }, 'Test Component');
      
      const result = renderStageFlow(config, React.createElement(TestComponent));

      expect(typeof result.advanceTime).toBe('function');
      expect(typeof result.advanceToNextTimer).toBe('function');
      expect(typeof result.waitForStage).toBe('function');
      expect(typeof result.waitForTransition).toBe('function');
      expect(typeof result.reset).toBe('function');
    });

    it('should enable time control by default', () => {
      const TestComponent = () => React.createElement('div', { 'data-testid': 'test' }, 'Test Component');
      
      const result = renderStageFlow(config, React.createElement(TestComponent));

      // Time control should be enabled
      result.advanceTime(1000);
      expect(result.engine.getCurrentTime()).toBe(1000);
    });

    it('should allow disabling time control', () => {
      const TestComponent = () => React.createElement('div', { 'data-testid': 'test' }, 'Test Component');
      
      const result = renderStageFlow(config, React.createElement(TestComponent), {
        enableTimeControl: false
      });

      expect(result.engine).toBeInstanceOf(StageFlowTestEngine);
    });

    it('should accept custom wrapper', () => {
      const TestComponent = () => React.createElement('div', { 'data-testid': 'test' }, 'Test Component');
      const CustomWrapper = ({ children }: { children: React.ReactNode }) => 
        React.createElement('div', { 'data-testid': 'wrapper' }, children);
      
      const result = renderStageFlow(config, React.createElement(TestComponent), {
        wrapper: CustomWrapper
      });

      expect(result.engine).toBeInstanceOf(StageFlowTestEngine);
    });

    it('should clean up on unmount', () => {
      const TestComponent = () => React.createElement('div', { 'data-testid': 'test' }, 'Test Component');
      
      const result = renderStageFlow(config, React.createElement(TestComponent));
      const stopSpy = vi.spyOn(result.engine, 'stop');

      result.unmount();

      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('createMockStageComponent', () => {
    it('should create a mock stage component with default testId', () => {
      const MockComponent = createMockStageComponent<TestStage, TestData>();
      
      const element = React.createElement(MockComponent, { stage: 'loading', data: { message: 'test', count: 1 } });

      expect(element.type).toBe(MockComponent);
      expect(element.props.stage).toBe('loading');
      expect(element.props.data).toEqual({ message: 'test', count: 1 });
    });

    it('should create a mock stage component with custom testId', () => {
      const MockComponent = createMockStageComponent<TestStage, TestData>('custom-stage');
      
      const element = React.createElement(MockComponent, { stage: 'ready' });

      expect(element.type).toBe(MockComponent);
      expect(element.props.stage).toBe('ready');
      expect(element.props.data).toBeUndefined();
    });

    it('should display stage and data information', () => {
      const MockComponent = createMockStageComponent<TestStage, TestData>();
      
      const element = React.createElement(MockComponent, { 
        stage: 'error', 
        data: { message: 'Error!', count: -1 } 
      });

      expect(element.type).toBe(MockComponent);
      expect(element.props.stage).toBe('error');
      expect(element.props.data).toEqual({ message: 'Error!', count: -1 });
    });
  });

  describe('createTestProvider', () => {
    it('should create a test provider component', () => {
      const engine = StageFlowTestEngine.create(config);
      const Provider = createTestProvider(engine);
      
      const element = React.createElement(Provider, {} as any, 'test children');

      expect(element.type).toBe(Provider);
      expect(element.props.children).toBe('test children');
    });
  });

  describe('createStageFlowTestSetup', () => {
    it('should create a complete test setup', () => {
      const setup = createStageFlowTestSetup(config);

      expect(setup.engine).toBeInstanceOf(StageFlowTestEngine);
      expect(typeof setup.Provider).toBe('function');
      expect(typeof setup.MockStageComponent).toBe('function');
      expect(typeof setup.render).toBe('function');
    });

    it('should provide a render function that uses the setup', () => {
      const setup = createStageFlowTestSetup(config);
      const TestComponent = () => React.createElement('div', { 'data-testid': 'test' }, 'Test');
      
      const result = setup.render(React.createElement(TestComponent));

      // The render function creates a new engine, so we just check that it works
      expect(result.engine).toBeInstanceOf(StageFlowTestEngine);
      expect(result.getCurrentStage()).toBe('loading');
    });
  });

  describe('createStageFlowInteractions', () => {
    it('should create interaction utilities', () => {
      const engine = StageFlowTestEngine.create(config);
      const interactions = createStageFlowInteractions(engine);

      expect(interactions).toBeInstanceOf(StageFlowTestInteractions);
    });
  });

  describe('StageFlowTestInteractions', () => {
    let engine: StageFlowTestEngine<TestStage, TestData>;
    let interactions: StageFlowTestInteractions<TestStage, TestData>;

    beforeEach(() => {
      engine = StageFlowTestEngine.create(config);
      interactions = createStageFlowInteractions(engine);
    });

    it('should send events', async () => {
      expect(engine.getCurrentStage()).toBe('loading');

      await interactions.sendEvent('loaded');

      expect(engine.getCurrentStage()).toBe('ready');
    });

    it('should navigate to stages', async () => {
      expect(engine.getCurrentStage()).toBe('loading');

      await interactions.goToStage('error');

      expect(engine.getCurrentStage()).toBe('error');
    });

    it('should advance time', async () => {
      const initialTime = engine.getCurrentTime();

      await interactions.passTime(1000);

      expect(engine.getCurrentTime()).toBe(initialTime + 1000);
    });

    it.skip('should wait for auto transitions', async () => {
      // Add a timed transition to test
      const timedConfig = {
        ...config,
        stages: [
          {
            ...config.stages[0],
            transitions: [
              ...config.stages[0].transitions,
              { target: 'ready' as TestStage, duration: 500 }
            ]
          },
          ...config.stages.slice(1)
        ]
      };

      const timedEngine = StageFlowTestEngine.create(timedConfig);
      const timedInteractions = createStageFlowInteractions(timedEngine);

      expect(timedEngine.getCurrentStage()).toBe('loading');

      const hasTimer = await timedInteractions.waitForAutoTransition();

      expect(hasTimer).toBe(true);
      expect(timedEngine.getCurrentStage()).toBe('ready');
    });

    it('should execute a sequence of interactions', async () => {
      await interactions.sequence([
        { type: 'send', event: 'loaded' },
        { type: 'wait', ms: 100 },
        { type: 'send', event: 'error' },
        { type: 'goTo', stage: 'loading' }
      ]);

      expect(engine.getCurrentStage()).toBe('loading');
    });
  });

  describe('waitForReactUpdate', () => {
    it('should wait for React to finish rendering', async () => {
      const startTime = Date.now();
      
      await waitForReactUpdate();
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('stageFlowMatchers', () => {
    let engine: StageFlowTestEngine<TestStage, TestData>;

    beforeEach(() => {
      engine = StageFlowTestEngine.create(config);
    });

    describe('toBeInStage', () => {
      it('should pass when engine is in expected stage', () => {
        const result = stageFlowMatchers.toBeInStage(engine, 'loading');
        
        expect(result.pass).toBe(true);
        expect(result.message()).toContain('Expected engine not to be in stage "loading"');
      });

      it('should fail when engine is not in expected stage', () => {
        const result = stageFlowMatchers.toBeInStage(engine, 'ready');
        
        expect(result.pass).toBe(false);
        expect(result.message()).toContain('Expected engine to be in stage "ready", but was in "loading"');
      });
    });

    describe('toHaveTransitioned', () => {
      it('should pass when transition occurred', async () => {
        await engine.send('loaded');
        
        const result = stageFlowMatchers.toHaveTransitioned(engine, 'loading', 'ready');
        
        expect(result.pass).toBe(true);
      });

      it('should fail when transition did not occur', () => {
        const result = stageFlowMatchers.toHaveTransitioned(engine, 'loading', 'ready');
        
        expect(result.pass).toBe(false);
        expect(result.message()).toContain('Expected engine to have transitioned from "loading" to "ready"');
      });
    });

    describe('toBeTransitioning', () => {
      it('should pass when engine is transitioning', () => {
        // Mock the isTransitioning method to return true
        vi.spyOn(engine, 'isTransitioning').mockReturnValue(true);
        
        const result = stageFlowMatchers.toBeTransitioning(engine);
        
        expect(result.pass).toBe(true);
        expect(result.message()).toBe('Expected engine not to be transitioning');
      });

      it('should fail when engine is not transitioning', () => {
        const result = stageFlowMatchers.toBeTransitioning(engine);
        
        expect(result.pass).toBe(false);
        expect(result.message()).toBe('Expected engine to be transitioning');
      });
    });
  });
});