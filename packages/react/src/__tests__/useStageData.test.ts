/**
 * Tests for useStageData hook
 */

import { renderHook, act } from '@testing-library/react';
import { StageFlowEngine, StageFlowConfig } from '@stage-flow/core';
import { useStageData } from '../hooks/useStageData';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Test stages enum
type TestStage = 'initial' | 'loading' | 'success' | 'error';

// Test data interface
interface TestData {
  message?: string;
  count?: number;
}

describe('useStageData', () => {
  let engine: StageFlowEngine<TestStage, TestData>;
  let config: StageFlowConfig<TestStage, TestData>;

  beforeEach(() => {
    config = {
      initial: 'initial' as TestStage,
      stages: [
        {
          name: 'initial' as TestStage,
          transitions: [
            { target: 'loading' as TestStage, event: 'start' },
            { target: 'success' as TestStage, event: 'skip' },
            { target: 'error' as TestStage, event: 'error' }
          ]
        },
        {
          name: 'loading' as TestStage,
          data: { message: 'Loading...', count: 0 },
          transitions: [
            { target: 'success' as TestStage, event: 'complete' },
            { target: 'error' as TestStage, event: 'fail' },
            { target: 'initial' as TestStage, event: 'reset' }
          ]
        },
        {
          name: 'success' as TestStage,
          data: { message: 'Success!', count: 100 },
          transitions: [
            { target: 'initial' as TestStage, event: 'reset' },
            { target: 'loading' as TestStage, event: 'reload' }
          ]
        },
        {
          name: 'error' as TestStage,
          data: { message: 'Error occurred', count: -1 },
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

  it('should return initial data (undefined)', () => {
    const { result } = renderHook(() => useStageData(engine));

    expect(result.current).toBeUndefined();
  });

  it('should return stage-specific data when stage changes', async () => {
    await engine.start();
    const { result } = renderHook(() => useStageData(engine));

    expect(result.current).toBeUndefined();

    // Transition to loading stage which has data
    await act(async () => {
      await engine.send('start');
    });

    expect(result.current).toEqual({ message: 'Loading...', count: 0 });

    // Transition to success stage which has different data
    await act(async () => {
      await engine.send('complete');
    });

    expect(result.current).toEqual({ message: 'Success!', count: 100 });
  });

  it('should update when data is passed during transition', async () => {
    await engine.start();
    const { result } = renderHook(() => useStageData(engine));

    const customData: TestData = { message: 'Custom message', count: 42 };

    await act(async () => {
      await engine.goTo('success', customData);
    });

    expect(result.current).toEqual(customData);
  });

  it('should handle engine changes', async () => {
    const { result, rerender } = renderHook(
      ({ engine }) => useStageData(engine),
      { initialProps: { engine } }
    );

    expect(result.current).toBeUndefined();

    // Create a completely new config with loading as initial stage
    const newConfig: StageFlowConfig<TestStage, TestData> = {
      initial: 'loading' as TestStage,
      stages: [
        {
          name: 'initial' as TestStage,
          transitions: [
            { target: 'loading' as TestStage, event: 'start' }
          ]
        },
        {
          name: 'loading' as TestStage,
          data: { message: 'Loading...', count: 0 },
          transitions: [
            { target: 'success' as TestStage, event: 'complete' }
          ]
        },
        {
          name: 'success' as TestStage,
          data: { message: 'Success!', count: 100 },
          transitions: [
            { target: 'initial' as TestStage, event: 'reset' }
          ]
        }
      ]
    };
    const newEngine = new StageFlowEngine(newConfig);

    // Rerender with new engine
    await act(async () => {
      rerender({ engine: newEngine });
    });

    expect(result.current).toEqual({ message: 'Loading...', count: 0 });
  });

  it('should sync with external engine data changes', async () => {
    await engine.start();
    const { result } = renderHook(() => useStageData(engine));

    expect(result.current).toBeUndefined();

    // Change stage externally through engine
    await act(async () => {
      await engine.send('start');
    });

    expect(result.current).toEqual({ message: 'Loading...', count: 0 });

    // Change to success with custom data
    const customData: TestData = { message: 'External change', count: 999 };
    await act(async () => {
      await engine.goTo('success', customData);
    });

    expect(result.current).toEqual(customData);
  });

  it('should handle data clearing', async () => {
    await engine.start();
    const { result } = renderHook(() => useStageData(engine));

    // Start with data
    await act(async () => {
      await engine.send('start');
    });

    expect(result.current).toEqual({ message: 'Loading...', count: 0 });

    // Go back to initial stage (no data)
    await act(async () => {
      await engine.send('reset');
    });

    expect(result.current).toBeUndefined();
  });

  it('should only re-render when data changes, not stage', async () => {
    await engine.start();
    let renderCount = 0;
    
    const { result } = renderHook(() => {
      renderCount++;
      return useStageData(engine);
    });

    expect(renderCount).toBe(1);
    expect(result.current).toBeUndefined();

    // Transition to loading (data changes)
    await act(async () => {
      await engine.send('start');
    });

    expect(renderCount).toBe(2);
    expect(result.current).toEqual({ message: 'Loading...', count: 0 });

    // Transition to success (data changes)
    await act(async () => {
      await engine.send('complete');
    });

    expect(renderCount).toBe(3);
    expect(result.current).toEqual({ message: 'Success!', count: 100 });
  });
});