/**
 * Tests for useStageFlow hook
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { StageFlowEngine, StageFlowConfig } from '@stage-flow/core';
import { useStageFlow, StageFlowProvider } from '../index';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Test stages enum
type TestStage = 'initial' | 'loading' | 'success' | 'error';

// Test data interface
interface TestData {
  message?: string;
  count?: number;
}

describe('useStageFlow', () => {
  let engine: StageFlowEngine<TestStage, TestData>;
  let config: StageFlowConfig<TestStage, TestData>;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StageFlowProvider engine={engine}>
      {children}
    </StageFlowProvider>
  );

  beforeEach(() => {
    config = {
      initial: 'initial' as TestStage,
      stages: [
        {
          name: 'initial' as TestStage,
          transitions: [
            { target: 'loading' as TestStage, event: 'start' },
            { target: 'success' as TestStage, event: 'skip' }
          ]
        },
        {
          name: 'loading' as TestStage,
          transitions: [
            { target: 'success' as TestStage, event: 'complete' },
            { target: 'error' as TestStage, event: 'fail' }
          ]
        },
        {
          name: 'success' as TestStage,
          transitions: [
            { target: 'initial' as TestStage, event: 'reset' }
          ]
        },
        {
          name: 'error' as TestStage,
          transitions: [
            { target: 'initial' as TestStage, event: 'reset' },
            { target: 'loading' as TestStage, event: 'retry' }
          ]
        }
      ]
    };

    engine = new StageFlowEngine(config);
  });

  afterEach(async () => {
    await engine.stop();
  });

  it('should return initial stage and data', () => {
    const { result } = renderHook(() => useStageFlow(engine), { wrapper });

    expect(result.current.currentStage).toBe('initial');
    expect(result.current.data).toBeUndefined();
    expect(result.current.isTransitioning).toBe(false);
    expect(typeof result.current.send).toBe('function');
    expect(typeof result.current.goTo).toBe('function');
  });

  it('should update when stage changes via send', async () => {
    await engine.start();
    const { result } = renderHook(() => useStageFlow(engine), { wrapper });

    expect(result.current.currentStage).toBe('initial');
    expect(result.current.isTransitioning).toBe(false);

    await act(async () => {
      await result.current.send('start');
    });

    expect(result.current.currentStage).toBe('loading');
    expect(result.current.isTransitioning).toBe(false);
  });

  it('should update when stage changes via goTo', async () => {
    await engine.start();
    const { result } = renderHook(() => useStageFlow(engine), { wrapper });

    expect(result.current.currentStage).toBe('initial');

    await act(async () => {
      await result.current.goTo('success');
    });

    expect(result.current.currentStage).toBe('success');
    expect(result.current.isTransitioning).toBe(false);
  });

  it('should complete transitions and reset transition state', async () => {
    await engine.start();
    const { result } = renderHook(() => useStageFlow(engine), { wrapper });

    expect(result.current.isTransitioning).toBe(false);

    // Complete the transition
    await act(async () => {
      await result.current.send('start');
    });

    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.currentStage).toBe('loading');
  });

  it('should complete goTo transitions and reset transition state', async () => {
    await engine.start();
    const { result } = renderHook(() => useStageFlow(engine), { wrapper });

    expect(result.current.isTransitioning).toBe(false);

    // Complete the transition
    await act(async () => {
      await result.current.goTo('success');
    });

    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.currentStage).toBe('success');
  });

  it('should handle data updates', async () => {
    await engine.start();
    const { result } = renderHook(() => useStageFlow(engine), { wrapper });

    const testData: TestData = { message: 'Hello', count: 42 };

    await act(async () => {
      await result.current.goTo('success', testData);
    });

    expect(result.current.currentStage).toBe('success');
    expect(result.current.data).toEqual(testData);
  });

  it('should handle invalid events gracefully', async () => {
    await engine.start();
    const { result } = renderHook(() => useStageFlow(engine), { wrapper });

    // Try to send an invalid event (this won't actually throw an error, just be ignored)
    await act(async () => {
      await result.current.send('invalid-event');
    });

    // Should not be transitioning after invalid event
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.currentStage).toBe('initial'); // Should remain in initial state
  });

  it('should handle engine changes', () => {
    const { result, rerender } = renderHook(
      ({ engine }) => useStageFlow(engine),
      { 
        initialProps: { engine },
        wrapper: ({ children }) => (
          <StageFlowProvider engine={engine}>
            {children}
          </StageFlowProvider>
        )
      }
    );

    expect(result.current.currentStage).toBe('initial');

    // Create a new engine with different initial state
    const newConfig: StageFlowConfig<TestStage, TestData> = {
      ...config,
      initial: 'loading' as TestStage
    };
    const newEngine = new StageFlowEngine(newConfig);

    // Rerender with new engine
    rerender({ engine: newEngine });

    expect(result.current.currentStage).toBe('loading');
  });

  it('should sync with external engine changes', async () => {
    await engine.start();
    const { result } = renderHook(() => useStageFlow(engine), { wrapper });

    expect(result.current.currentStage).toBe('initial');

    // Change stage externally through engine
    await act(async () => {
      await engine.send('start');
    });

    expect(result.current.currentStage).toBe('loading');
  });

  it('should maintain stable function references', () => {
    const { result, rerender } = renderHook(() => useStageFlow(engine), { wrapper });

    const initialSend = result.current.send;
    const initialGoTo = result.current.goTo;

    rerender();

    expect(result.current.send).toBe(initialSend);
    expect(result.current.goTo).toBe(initialGoTo);
  });
});