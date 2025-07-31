/**
 * React hook for accessing stage-specific data
 */

import { useEffect, useState, useRef } from 'react';
import { StageFlowEngine } from '@stage-flow/core';

/**
 * Return type for useStageData hook
 */
export type UseStageDataReturn<TData = unknown> = TData | undefined;

/**
 * React hook for accessing stage-specific data from a StageFlowEngine
 * 
 * This hook provides a focused way to access just the data portion of the stage flow state,
 * which can be useful for components that only need to react to data changes.
 * 
 * @param engine - The StageFlowEngine instance to get data from
 * @returns The current stage data, or undefined if no data is set
 */
export function useStageData<TStage extends string, TData = unknown>(
  engine: StageFlowEngine<TStage, TData>
): UseStageDataReturn<TData> {
  // State for current data
  const [data, setData] = useState<TData | undefined>(() => engine.getCurrentData());
  
  // Keep track of the engine reference to detect changes
  const engineRef = useRef(engine);
  
  // Update engine reference if it changes
  if (engineRef.current !== engine) {
    engineRef.current = engine;
    // Update state immediately when engine changes
    setData(engine.getCurrentData());
  }

  // Subscribe to engine changes
  useEffect(() => {
    const currentEngine = engineRef.current;
    
    // Update initial state
    setData(currentEngine.getCurrentData());
    
    // Subscribe to stage changes (we only care about data changes)
    const unsubscribe = currentEngine.subscribe((_stage: TStage, stageData?: TData) => {
      setData(stageData);
    });

    return unsubscribe;
  }, [engine]);

  return data;
}