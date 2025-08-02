/**
 * Debug utilities for StageFlow development
 */

import { useEffect, useRef } from 'react';
import { StageFlowEngine } from '@stage-flow/core';
import { useStageFlow } from './useStageFlow';

export interface StageFlowDebugInfo<TStage extends string, TData = unknown> {
  /** Current stage */
  currentStage: TStage;
  /** Previous stage */
  previousStage?: TStage;
  /** Stage transition history */
  history: Array<{
    from: TStage;
    to: TStage;
    event?: string;
    timestamp: number;
    data?: TData;
  }>;
  /** Current stage data */
  data?: TData;
  /** Whether a transition is in progress */
  isTransitioning: boolean;
  /** Number of transitions made */
  transitionCount: number;
  /** Time spent in current stage (ms) */
  timeInCurrentStage: number;
}

export interface UseStageFlowDebugOptions {
  /** Whether to log transitions to console */
  logTransitions?: boolean;
  /** Whether to log data changes to console */
  logDataChanges?: boolean;
  /** Maximum number of history entries to keep */
  maxHistorySize?: number;
  /** Custom log prefix */
  logPrefix?: string;
}

/**
 * Debug hook that provides detailed information about stage flow state and transitions
 * 
 * @param engine - StageFlowEngine instance to debug
 * @param options - Debug configuration options
 * @returns Debug information object
 */
export function useStageFlowDebug<TStage extends string, TData = unknown>(
  engine?: StageFlowEngine<TStage, TData>,
  options: UseStageFlowDebugOptions = {}
): StageFlowDebugInfo<TStage, TData> {
  const {
    logTransitions = false,
    logDataChanges = false,
    maxHistorySize = 50,
    logPrefix = '[StageFlow]'
  } = options;

  const { currentStage, data, isTransitioning } = useStageFlow(engine);
  
  const previousStageRef = useRef<TStage>();
  const historyRef = useRef<StageFlowDebugInfo<TStage, TData>['history']>([]);
  const transitionCountRef = useRef(0);
  const stageStartTimeRef = useRef(Date.now());
  const previousDataRef = useRef<TData | undefined>();

  // Track stage transitions
  useEffect(() => {
    const prevStage = previousStageRef.current;
    
    if (prevStage && prevStage !== currentStage) {
      const transition = {
        from: prevStage,
        to: currentStage,
        timestamp: Date.now(),
        data
      };

      // Add to history
      historyRef.current.push(transition);
      
      // Limit history size
      if (historyRef.current.length > maxHistorySize) {
        historyRef.current = historyRef.current.slice(-maxHistorySize);
      }

      transitionCountRef.current += 1;
      stageStartTimeRef.current = Date.now();

      // Log transition if enabled
      if (logTransitions) {
        console.log(`${logPrefix} Transition:`, {
          from: prevStage,
          to: currentStage,
          data,
          transitionCount: transitionCountRef.current
        });
      }
    }

    previousStageRef.current = currentStage;
  }, [currentStage, data, logTransitions, logPrefix, maxHistorySize]);

  // Track data changes
  useEffect(() => {
    const prevData = previousDataRef.current;
    
    if (logDataChanges && prevData !== data) {
      console.log(`${logPrefix} Data changed:`, {
        stage: currentStage,
        previousData: prevData,
        newData: data
      });
    }

    previousDataRef.current = data;
  }, [data, currentStage, logDataChanges, logPrefix]);

  const timeInCurrentStage = Date.now() - stageStartTimeRef.current;

  return {
    currentStage,
    previousStage: previousStageRef.current,
    history: [...historyRef.current],
    data,
    isTransitioning,
    transitionCount: transitionCountRef.current,
    timeInCurrentStage
  };
}

/**
 * Hook that provides performance metrics for stage flow
 */
export function useStageFlowPerformance<TStage extends string, TData = unknown>(
  engine?: StageFlowEngine<TStage, TData>
): StageFlowDebugInfo<TStage, TData> & {
  averageTransitionTime: number;
  stageFrequency: Record<TStage, number>;
  mostVisitedStage: { stage: TStage; count: number };
} {
  const debugInfo = useStageFlowDebug(engine);
  
  const averageTransitionTime = debugInfo.history.length > 1 
    ? debugInfo.history.reduce((acc, transition, index) => {
        if (index === 0) return acc;
        const prevTransition = debugInfo.history[index - 1];
        return acc + (transition.timestamp - prevTransition.timestamp);
      }, 0) / (debugInfo.history.length - 1)
    : 0;

  const stageFrequency = debugInfo.history.reduce((acc, transition) => {
    acc[transition.to] = (acc[transition.to] || 0) + 1;
    return acc;
  }, {} as Record<TStage, number>);

  const mostVisitedStage = Object.entries(stageFrequency).reduce(
    (max, [stage, count]) => (count as number) > max.count ? { stage: stage as TStage, count: count as number } : max,
    { stage: debugInfo.currentStage, count: 0 }
  );

  return {
    ...debugInfo,
    averageTransitionTime,
    stageFrequency,
    mostVisitedStage
  };
}