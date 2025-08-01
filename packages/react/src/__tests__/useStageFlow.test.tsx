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

    // Change engine state externally
    await act(async () => {
      await engine.goTo('success', { message: 'External change' });
    });

    expect(result.current.currentStage).toBe('success');
    expect(result.current.data).toEqual({ message: 'External change' });
  });

  describe('setStageData', () => {
    beforeEach(async () => {
      await engine.start();
    });

    it('should update stage data without changing stage', () => {
      const { result } = renderHook(() => useStageFlow(engine), { wrapper });

      const newData = { message: 'Updated data', count: 42 };
      act(() => {
        result.current.setStageData(newData);
      });

      expect(result.current.currentStage).toBe('initial');
      expect(result.current.data).toEqual(newData);
      expect(result.current.isTransitioning).toBe(false);
    });

    it('should update data and notify subscribers', () => {
      const { result } = renderHook(() => useStageFlow(engine), { wrapper });

      const initialData = { message: 'Initial' };
      act(() => {
        result.current.setStageData(initialData);
      });

      expect(result.current.data).toEqual(initialData);

      const updatedData = { message: 'Updated', count: 123 };
      act(() => {
        result.current.setStageData(updatedData);
      });

      expect(result.current.data).toEqual(updatedData);
    });

    it('should work with complex data structures', () => {
      const { result } = renderHook(() => useStageFlow(engine), { wrapper });

      const complexData = {
        message: 'Complex data',
        count: 42,
        nested: {
          value: 'nested value',
          array: [1, 2, 3]
        },
        flags: {
          isActive: true,
          isVisible: false
        }
      };

      act(() => {
        result.current.setStageData(complexData);
      });

      expect(result.current.data).toEqual(complexData);
    });

    it('should preserve stage when updating data', async () => {
      const { result } = renderHook(() => useStageFlow(engine), { wrapper });

      // First navigate to a different stage
      await act(async () => {
        await result.current.goTo('loading', { message: 'Loading' });
      });

      expect(result.current.currentStage).toBe('loading');

      // Update data without changing stage
      const updatedData = { message: 'Updated loading data', count: 99 };
      act(() => {
        result.current.setStageData(updatedData);
      });

      expect(result.current.currentStage).toBe('loading');
      expect(result.current.data).toEqual(updatedData);
    });

    it('should not trigger transition state when updating data', () => {
      const { result } = renderHook(() => useStageFlow(engine), { wrapper });

      expect(result.current.isTransitioning).toBe(false);

      act(() => {
        result.current.setStageData({ message: 'Test' });
      });

      expect(result.current.isTransitioning).toBe(false);
    });
  });
});