// Client modules for Stage Flow
import { StageFlowEngine } from '../../packages/core/src/index.ts';
import { StageFlowProvider, useStageFlow, useStageFlowContext, useStageData, useStageEffect, StageAnimation, StageRenderer } from '../../packages/react/src/index.ts';

// Make Stage Flow available globally (only in browser environment)
if (typeof window !== 'undefined') {
  window.StageFlowEngine = StageFlowEngine;
  window.StageFlowProvider = StageFlowProvider;
  window.useStageFlow = useStageFlow;
  window.useStageFlowContext = useStageFlowContext;
  window.useStageData = useStageData;
  window.useStageEffect = useStageEffect;
  window.StageAnimation = StageAnimation;
  window.StageRenderer = StageRenderer;
} 