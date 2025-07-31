/**
 * Tests for useStageEffect hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStageEffect } from '../hooks/useStageEffect';
import { StageFlowEngine, DEFAULT_EFFECTS } from '@stage-flow/core';

// Mock the effect registry
vi.mock('@stage-flow/core', async () => {
  const actual = await vi.importActual<typeof import('@stage-flow/core')>('@stage-flow/core');
  return {
    ...actual,
    effectRegistry: {
      create: vi.fn((name: string) => {
        if (name === 'custom-effect') {
          return { type: 'custom-effect', duration: 500, easing: 'easeInOut' };
        }
        return undefined;
      })
    }
  };
});

// Mock StageFlowEngine
const createMockEngine = (stageEffect?: string) => ({
  getCurrentStage: vi.fn(() => 'stage1'),
  getCurrentData: vi.fn(() => ({ test: 'data' })),
  getCurrentStageEffect: vi.fn(() => stageEffect),
  getStageEffect: vi.fn(() => stageEffect),
  send: vi.fn(),
  goTo: vi.fn(),
  subscribe: vi.fn((callback) => {
    // Store callback for manual triggering
    (createMockEngine as any).lastCallback = callback;
    return vi.fn(); // unsubscribe function
  }),
  installPlugin: vi.fn(),
  uninstallPlugin: vi.fn(),
  getInstalledPlugins: vi.fn(() => []),
  getPlugin: vi.fn(),
  getPluginState: vi.fn(),
  setPluginState: vi.fn(),
  addMiddleware: vi.fn(),
  removeMiddleware: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  reset: vi.fn()
}) as unknown as StageFlowEngine<'stage1' | 'stage2', { test: string }>;

describe('useStageEffect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default effect when no stage effect is defined', () => {
    const mockEngine = createMockEngine();
    const defaultEffect = DEFAULT_EFFECTS.slide;

    const { result } = renderHook(() => useStageEffect(mockEngine, defaultEffect));

    expect(result.current.effect).toEqual(defaultEffect);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return built-in effect when stage has built-in effect', () => {
    const mockEngine = createMockEngine('fade');

    const { result } = renderHook(() => useStageEffect(mockEngine));

    expect(result.current.effect).toEqual(DEFAULT_EFFECTS.fade);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return custom effect from registry', () => {
    const mockEngine = createMockEngine('custom-effect');

    const { result } = renderHook(() => useStageEffect(mockEngine));

    expect(result.current.effect).toEqual({
      type: 'custom-effect',
      duration: 500,
      easing: 'easeInOut'
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('should warn and use default when effect is not found', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mockEngine = createMockEngine('unknown-effect');
    const defaultEffect = DEFAULT_EFFECTS.scale;

    const { result } = renderHook(() => useStageEffect(mockEngine, defaultEffect));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Effect "unknown-effect" not found')
    );
    expect(result.current.effect).toEqual(defaultEffect);
    expect(result.current.isLoading).toBe(false);

    consoleSpy.mockRestore();
  });

  it('should update effect when stage changes', () => {
    const mockEngine = createMockEngine('fade');

    const { result } = renderHook(() => useStageEffect(mockEngine));

    expect(result.current.effect).toEqual(DEFAULT_EFFECTS.fade);

    // Simulate stage change
    mockEngine.getCurrentStageEffect = vi.fn(() => 'slide');
    
    act(() => {
      // Trigger the subscription callback
      if ((createMockEngine as any).lastCallback) {
        (createMockEngine as any).lastCallback('stage2', {});
      }
    });

    expect(result.current.effect).toEqual(DEFAULT_EFFECTS.slide);
  });

  it('should handle errors gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockEngine = createMockEngine();
    
    // Make getCurrentStageEffect throw an error
    mockEngine.getCurrentStageEffect = vi.fn(() => {
      throw new Error('Test error');
    });

    const defaultEffect = DEFAULT_EFFECTS.zoom;
    const { result } = renderHook(() => useStageEffect(mockEngine, defaultEffect));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error resolving stage effect:',
      expect.any(Error)
    );
    expect(result.current.effect).toEqual(defaultEffect);
    expect(result.current.isLoading).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it('should unsubscribe on unmount', () => {
    const mockEngine = createMockEngine();
    const unsubscribeMock = vi.fn();
    mockEngine.subscribe = vi.fn(() => unsubscribeMock);

    const { unmount } = renderHook(() => useStageEffect(mockEngine));

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it('should use fade as default when no default is provided', () => {
    const mockEngine = createMockEngine();

    const { result } = renderHook(() => useStageEffect(mockEngine));

    expect(result.current.effect).toEqual(DEFAULT_EFFECTS.fade);
    expect(result.current.isLoading).toBe(false);
  });
});