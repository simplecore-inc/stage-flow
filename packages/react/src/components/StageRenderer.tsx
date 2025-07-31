/**
 * StageRenderer - Component for rendering stages with animation support
 */

import React, { ComponentType, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { StageFlowEngine, EffectConfig, effectRegistry, DEFAULT_EFFECTS } from '@stage-flow/core';
import { useStageFlow } from '../hooks/useStageFlow';
import { StageAnimation } from './StageAnimation';

/**
 * Props for individual stage components
 */
export interface StageProps<TStage extends string, TData = unknown> {
  /** Current stage name */
  stage: TStage;
  /** Stage-specific data */
  data?: TData;
  /** Function to send events */
  send: (event: string, data?: TData) => Promise<void>;
  /** Function to navigate to a stage */
  goTo: (stage: TStage, data?: TData) => Promise<void>;
  /** Whether a transition is in progress */
  isTransitioning: boolean;
}

/**
 * Props for StageRenderer component
 */
export interface StageRendererProps<TStage extends string, TData = unknown> {
  /** The StageFlowEngine instance (optional if using context) */
  engine?: StageFlowEngine<TStage, TData>;
  /** Optional effect configurations - overrides stage-specific effects */
  effects?: Record<string, EffectConfig>;
  /** Optional stage component overrides */
  stageComponents?: Partial<Record<TStage, ComponentType<StageProps<TStage, TData>>>>;
  /** Optional fallback component for stages without specific components */
  fallbackComponent?: ComponentType<StageProps<TStage, TData>>;
  /** Whether to disable animations globally */
  disableAnimations?: boolean;
  /** Default effect to use when no stage-specific effect is defined */
  defaultEffect?: EffectConfig;
  /** Custom className for the container */
  className?: string;
  /** Custom style for the container */
  style?: React.CSSProperties;
}

/**
 * Default fallback component for stages without specific components
 */
const DefaultStageComponent = <TStage extends string, TData = unknown>({
  stage,
  data
}: StageProps<TStage, TData>) => (
  <div>
    <h2>Stage: {stage}</h2>
    {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
  </div>
);

/**
 * Component that renders the current stage with animation support
 * 
 * @param props - Renderer props
 * @returns JSX element rendering the current stage
 */
export function StageRenderer<TStage extends string, TData = unknown>({
  engine,
  effects = {},
  stageComponents = {},
  fallbackComponent = DefaultStageComponent,
  disableAnimations = false,
  defaultEffect = DEFAULT_EFFECTS.fade,
  className,
  style
}: StageRendererProps<TStage, TData>): JSX.Element {
  const { currentStage, data, send, goTo, isTransitioning } = useStageFlow(engine);
  const animationCleanupRef = useRef<(() => void) | null>(null);

  // Clean up any ongoing animations when component unmounts or stage changes
  useEffect(() => {
    return () => {
      if (animationCleanupRef.current) {
        animationCleanupRef.current();
        animationCleanupRef.current = null;
      }
    };
  }, [currentStage]);

  // Get the effect configuration for the current stage
  const getStageEffect = (): EffectConfig => {
    // Priority order:
    // 1. Explicit effect override from props
    // 2. Stage-specific effect from engine configuration
    // 3. Default effect from props
    // 4. Built-in fade effect

    // Check for explicit override in effects prop
    if (effects[currentStage]) {
      return effects[currentStage];
    }

    // Check for global default in effects prop
    if (effects.default) {
      return effects.default;
    }

    // Get stage-specific effect from engine (if available)
    if (engine) {
      const stageEffectName = engine.getCurrentStageEffect();
      if (stageEffectName) {
        // Try to resolve the effect from the registry
        const resolvedEffect = effectRegistry.create(stageEffectName);
        if (resolvedEffect) {
          return resolvedEffect;
        }

        // If not found in registry, check if it's a built-in effect
        if (stageEffectName in DEFAULT_EFFECTS) {
          return DEFAULT_EFFECTS[stageEffectName as keyof typeof DEFAULT_EFFECTS];
        }

        // If effect name is not recognized, log warning and fall back
        console.warn(`Effect "${stageEffectName}" not found in registry or built-in effects. Using default effect.`);
      }
    }

    // Use provided default effect or built-in fade
    return defaultEffect;
  };

  const stageEffect = getStageEffect();

  const stageProps: StageProps<TStage, TData> = {
    stage: currentStage,
    data,
    send,
    goTo,
    isTransitioning
  };

  // Render the stage component
  const renderStageComponent = (): JSX.Element => {
    const StageComponent = stageComponents[currentStage] || fallbackComponent;
    return React.createElement(StageComponent, stageProps);
  };

  // Handle animation cleanup when interrupted
  const handleAnimationStart = () => {
    // Clear any previous cleanup function
    if (animationCleanupRef.current) {
      animationCleanupRef.current();
    }

    // Set up new cleanup function for this animation
    animationCleanupRef.current = () => {
      // This will be called if the animation is interrupted
      // The actual cleanup is handled by Framer Motion's AnimatePresence
    };
  };

  const handleAnimationComplete = () => {
    // Clear cleanup function when animation completes normally
    if (animationCleanupRef.current) {
      animationCleanupRef.current();
      animationCleanupRef.current = null;
    }
  };

  if (disableAnimations) {
    return (
      <div className={className} style={style}>
        {renderStageComponent()}
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <AnimatePresence 
        mode="wait"
        onExitComplete={handleAnimationComplete}
      >
        <StageAnimation
          key={currentStage}
          effect={stageEffect}
          onAnimationStart={handleAnimationStart}
          onAnimationComplete={handleAnimationComplete}
        >
          {renderStageComponent()}
        </StageAnimation>
      </AnimatePresence>
    </div>
  );
}