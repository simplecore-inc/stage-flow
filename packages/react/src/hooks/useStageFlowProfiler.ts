/**
 * Performance profiling utilities for StageFlow
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { StageFlowEngine } from '@stage-flow/core';
import { useStageFlow } from './useStageFlow';

export interface StageFlowProfilerData {
  /** Stage name */
  stage: string;
  /** Time spent in stage (ms) */
  duration: number;
  /** Number of renders in this stage */
  renderCount: number;
  /** Transition event that led to this stage */
  triggerEvent?: string;
  /** Data associated with the stage */
  data?: unknown;
}

export interface UseStageFlowProfilerOptions {
  /** Whether to enable profiling */
  enabled?: boolean;
  /** Custom profiler ID for React DevTools */
  id?: string;
  /** Callback for profiler data */
  onProfile?: (data: StageFlowProfilerData) => void;
  /** Whether to log performance data to console */
  logToConsole?: boolean;
}

/**
 * Hook that provides performance profiling for StageFlow
 * Integrates with React DevTools Profiler
 */
export function useStageFlowProfiler<TStage extends string, TData = unknown>(
  engine?: StageFlowEngine<TStage, TData>,
  options: UseStageFlowProfilerOptions = {}
): {
  trackEvent: (event: string) => void;
  onRenderCallback: React.ProfilerOnRenderCallback;
  currentMetrics: {
    stage: TStage;
    timeInStage: number;
    renderCount: number;
  };
} {
  const {
    enabled = process.env.NODE_ENV === 'development',
    id = 'StageFlow',
    onProfile,
    logToConsole = false
  } = options;

  const { currentStage, data } = useStageFlow(engine);
  
  const stageStartTimeRef = useRef<number>(Date.now());
  const renderCountRef = useRef<number>(0);
  const previousStageRef = useRef<TStage>();
  const lastEventRef = useRef<string>();

  // Track renders
  renderCountRef.current += 1;

  // Track stage changes and measure performance
  useEffect(() => {
    if (!enabled) return;

    const now = Date.now();
    const previousStage = previousStageRef.current;

    if (previousStage && previousStage !== currentStage) {
      // Calculate time spent in previous stage
      const duration = now - stageStartTimeRef.current;
      
      const profileData: StageFlowProfilerData = {
        stage: previousStage,
        duration,
        renderCount: renderCountRef.current - 1, // Subtract current render
        triggerEvent: lastEventRef.current,
        data
      };

      // Call custom profiler callback
      if (onProfile) {
        onProfile(profileData);
      }

      // Log to console if enabled
      if (logToConsole) {
        console.log(`[${id}] Stage Performance:`, profileData);
      }

      // Reset counters for new stage
      renderCountRef.current = 1;
      stageStartTimeRef.current = now;
    }

    previousStageRef.current = currentStage;
  }, [currentStage, enabled, id, onProfile, logToConsole, data]);

  // Track events that trigger transitions
  const trackEvent = useCallback((event: string) => {
    if (enabled) {
      lastEventRef.current = event;
    }
  }, [enabled]);

  // React DevTools Profiler callback
  const onRenderCallback = useCallback((
    id: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    if (!enabled) return;

    const profileData = {
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
      stage: currentStage,
      renderCount: renderCountRef.current
    };

    if (logToConsole) {
      console.log(`[${id}] React Render:`, profileData);
    }
  }, [enabled, currentStage, logToConsole]);

  return {
    trackEvent,
    onRenderCallback,
    currentMetrics: {
      stage: currentStage,
      timeInStage: Date.now() - stageStartTimeRef.current,
      renderCount: renderCountRef.current
    }
  };
}

/**
 * Higher-order component that wraps a component with StageFlow profiling
 */
export function withStageFlowProfiler<P extends object>(
  Component: React.ComponentType<P>,
  options: UseStageFlowProfilerOptions = {}
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const { onRenderCallback } = useStageFlowProfiler(undefined, options);

    if (!options.enabled && process.env.NODE_ENV !== 'development') {
      return React.createElement(Component, props);
    }

    return React.createElement(
      React.Profiler,
      { id: options.id || 'StageFlow', onRender: onRenderCallback },
      React.createElement(Component, props)
    );
  };

  WrappedComponent.displayName = `withStageFlowProfiler(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}