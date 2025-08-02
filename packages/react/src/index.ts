/**
 * @stage-flow/react - React integration for stage flow library
 */

// Re-export core types for convenience
export * from '@stage-flow/core';

// React hooks
export { useStageFlow } from './hooks/useStageFlow';
export { useStageData } from './hooks/useStageData';
export { useStageEffect } from './hooks/useStageEffect';
export { useStageFlowDebug, useStageFlowPerformance } from './hooks/useStageFlowDebug';
export { useStageFlowProfiler, withStageFlowProfiler } from './hooks/useStageFlowProfiler';

// React components
export { StageFlowProvider, useStageFlowContext } from './components/StageFlowProvider';
export { StageRenderer } from './components/StageRenderer';
export { StageAnimation } from './components/StageAnimation';
export { 
  StageErrorBoundary, 
  withStageErrorBoundary 
} from './components/StageErrorBoundary';

// Hook return types
export type { UseStageFlowReturn } from './hooks/useStageFlow';
export type { UseStageDataReturn } from './hooks/useStageData';
export type { UseStageEffectReturn } from './hooks/useStageEffect';
export type { 
  StageFlowDebugInfo, 
  UseStageFlowDebugOptions 
} from './hooks/useStageFlowDebug';
export type { 
  StageFlowProfilerData, 
  UseStageFlowProfilerOptions 
} from './hooks/useStageFlowProfiler';

// Component prop types
export type { StageFlowProviderProps } from './components/StageFlowProvider';
export type { StageRendererProps, StageProps } from './components/StageRenderer';
export type { StageAnimationProps } from './components/StageAnimation';
export type { 
  StageErrorBoundaryProps, 
  StageErrorFallbackProps,
  UseErrorBoundaryOptions 
} from './components/StageErrorBoundary';

// Utility types
export type {
  ExtractStages,
  ExtractData,
  StageComponentMap,
  StageEffectMap,
  RequiredStageComponents,
  StageDataMap,
  StageTransitionMap,
  TypedStageFlowConfig,
  StageEventHandler,
  StageTransitionHandler,
  TypedStageProps
} from './types/utilities';

// Utility functions
export {
  isValidStage,
  createStageFlowConfig,
  createStageComponents,
  createStageEffects,
  createTypedStageComponent
} from './types/utilities';