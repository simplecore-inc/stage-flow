/**
 * React hook for connecting to StageFlowEngine
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { StageFlowEngine } from '@stage-flow/core';
import { useStageFlowContext } from '../components/StageFlowProvider';

/**
 * Return type for useStageFlow hook
 */
export interface UseStageFlowReturn<TStage extends string, TData = unknown> {
  /** Current stage */
  currentStage: TStage;
  /** Current stage data */
  data?: TData;
  /** Send an event to trigger transitions */
  send: (event: string, data?: TData) => Promise<void>;
  /** Navigate directly to a stage */
  goTo: (stage: TStage, data?: TData) => Promise<void>;
  /** Update stage data without triggering transitions */
  setStageData: (data: TData) => void;
  /** Whether a transition is currently in progress */
  isTransitioning: boolean;
  /** Pause all timers for the current stage */
  pauseTimers: () => void;
  /** Resume all paused timers for the current stage */
  resumeTimers: () => void;
  /** Reset all timers for the current stage to their original duration */
  resetTimers: () => void;
  /** Get the remaining time for timers in the current stage */
  getTimerRemainingTime: () => number;
  /** Check if timers are paused for the current stage */
  areTimersPaused: () => boolean;
  /** The underlying StageFlowEngine instance */
  engine: StageFlowEngine<TStage, TData>;
}

/**
 * React hook that connects to a StageFlowEngine and provides reactive state
 * 
 * @param engine - Optional StageFlowEngine instance to connect to (if not provided, uses context)
 * @returns Object containing current stage, data, and control methods
 */
export function useStageFlow<TStage extends string, TData = unknown>(
  engine?: StageFlowEngine<TStage, TData>
): UseStageFlowReturn<TStage, TData> {
  // Get engine from context if not provided
  const contextEngine = useStageFlowContext<TStage, TData>();
  const actualEngine = engine || contextEngine;
  
  // State for current stage and data
  const [currentStage, setCurrentStage] = useState<TStage>(() => actualEngine.getCurrentStage());
  const [data, setData] = useState<TData | undefined>(() => actualEngine.getCurrentData());
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  
  // Keep track of the engine reference to detect changes
  const engineRef = useRef(actualEngine);
  
  // Update engine reference if it changes
  if (engineRef.current !== actualEngine) {
    engineRef.current = actualEngine;
    // Update state immediately when engine changes
    setCurrentStage(actualEngine.getCurrentStage());
    setData(actualEngine.getCurrentData());
    setIsTransitioning(false);
  }

  // Subscribe to engine changes
  useEffect(() => {
    const currentEngine = engineRef.current;
    
    // Update initial state
    setCurrentStage(currentEngine.getCurrentStage());
    setData(currentEngine.getCurrentData());
    
    // Subscribe to stage changes
    const unsubscribe = currentEngine.subscribe((stage: TStage, stageData?: TData) => {
      setCurrentStage(stage);
      setData(stageData);
      setIsTransitioning(false); // Transition completed
    });

    return unsubscribe;
  }, [actualEngine]);

  // Memoized send function that tracks transition state
  const send = useCallback(async (event: string, eventData?: TData): Promise<void> => {
    const currentEngine = engineRef.current;
    const currentStage = currentEngine.getCurrentStage();
    
    setIsTransitioning(true);
    try {
      await currentEngine.send(event, eventData);
      // If stage didn't change, it means the event was invalid/ignored
      if (currentEngine.getCurrentStage() === currentStage) {
        setIsTransitioning(false);
      }
    } catch (error) {
      setIsTransitioning(false);
      throw error;
    }
    // Note: setIsTransitioning(false) is handled by the subscription callback for valid transitions
  }, []);

  // Memoized goTo function that tracks transition state
  const goTo = useCallback(async (stage: TStage, stageData?: TData): Promise<void> => {
    const currentEngine = engineRef.current;
    
    setIsTransitioning(true);
    try {
      await currentEngine.goTo(stage, stageData);
    } catch (error) {
      setIsTransitioning(false);
      throw error;
    }
    // Note: setIsTransitioning(false) is handled by the subscription callback
  }, []);

  return {
    currentStage,
    data,
    send,
    goTo,
    setStageData: (data: TData) => actualEngine.setStageData(data),
    isTransitioning,
    pauseTimers: () => actualEngine.pauseTimers(),
    resumeTimers: () => actualEngine.resumeTimers(),
    resetTimers: () => actualEngine.resetTimers(),
    getTimerRemainingTime: () => actualEngine.getTimerRemainingTime(),
    areTimersPaused: () => actualEngine.areTimersPaused(),
    engine: actualEngine
  };
}