/**
 * StageFlowProvider - React context provider for stage flow engine
 */

import { createContext, useContext, ReactNode } from 'react';
import { StageFlowEngine } from '@stage-flow/core';
import React from 'react';

/**
 * Context for sharing StageFlowEngine instance
 */
const StageFlowContext = createContext<StageFlowEngine<string, unknown> | null>(null);

/**
 * Props for StageFlowProvider component
 */
export interface StageFlowProviderProps<TStage extends string, TData = unknown> {
  /** The StageFlowEngine instance to provide */
  engine: StageFlowEngine<TStage, TData>;
  /** Child components */
  children: ReactNode;
}

/**
 * Provider component that makes StageFlowEngine available to child components
 * 
 * @param props - Provider props containing engine and children
 * @returns JSX element providing stage flow context
 */
export function StageFlowProvider<TStage extends string, TData = unknown>({
  engine,
  children
}: StageFlowProviderProps<TStage, TData>): React.JSX.Element {
  return (
    <StageFlowContext.Provider value={engine as unknown as StageFlowEngine<string, unknown>}>
      {children}
    </StageFlowContext.Provider>
  );
}

/**
 * Hook to access the StageFlowEngine from context
 * 
 * @returns The StageFlowEngine instance from context
 * @throws Error if used outside of StageFlowProvider
 */
export function useStageFlowContext<TStage extends string, TData = unknown>(): StageFlowEngine<TStage, TData> {
  const engine = useContext(StageFlowContext);
  
  if (!engine) {
    throw new Error('useStageFlowContext must be used within a StageFlowProvider');
  }
  
  return engine as unknown as StageFlowEngine<TStage, TData>;
}