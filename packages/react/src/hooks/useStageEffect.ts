/**
 * React hook for accessing stage effect configuration
 */

import { useEffect, useState } from 'react';
import { StageFlowEngine, EffectConfig, effectRegistry, DEFAULT_EFFECTS } from '@stage-flow/core';

/**
 * Return type for useStageEffect hook
 */
export interface UseStageEffectReturn {
  /** Current stage effect configuration */
  effect: EffectConfig | undefined;
  /** Whether the effect is loading/resolving */
  isLoading: boolean;
}

/**
 * React hook that provides the current stage's effect configuration
 * 
 * @param engine - The StageFlowEngine instance
 * @param defaultEffect - Default effect to use when no stage effect is defined
 * @returns Object containing effect configuration and loading state
 */
export function useStageEffect<TStage extends string, TData = unknown>(
  engine: StageFlowEngine<TStage, TData>,
  defaultEffect: EffectConfig = DEFAULT_EFFECTS.fade
): UseStageEffectReturn {
  const [effect, setEffect] = useState<EffectConfig | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const updateEffect = () => {
      setIsLoading(true);
      
      try {
        // Get stage-specific effect from engine
        const stageEffect = engine.getCurrentStageEffect();
        
        if (stageEffect) {
          // If it's already an EffectConfig object, use it directly
          if (typeof stageEffect === 'object' && 'type' in stageEffect) {
            setEffect(stageEffect as EffectConfig);
            setIsLoading(false);
            return;
          }

          // If it's a string, try to resolve it
          if (typeof stageEffect === 'string') {
            // Try to resolve the effect from the registry
            const resolvedEffect = effectRegistry.create(stageEffect);
            if (resolvedEffect) {
              setEffect(resolvedEffect);
              setIsLoading(false);
              return;
            }

            // If not found in registry, check if it's a built-in effect
            if (stageEffect in DEFAULT_EFFECTS) {
              setEffect(DEFAULT_EFFECTS[stageEffect as keyof typeof DEFAULT_EFFECTS]);
              setIsLoading(false);
              return;
            }

            // If effect name is not recognized, log warning and use default
            console.warn(`Effect "${stageEffect}" not found in registry or built-in effects. Using default effect.`);
          }
        }

        // Use default effect
        setEffect(defaultEffect);
        setIsLoading(false);
      } catch (error) {
        console.error('Error resolving stage effect:', error);
        setEffect(defaultEffect);
        setIsLoading(false);
      }
    };

    // Update effect immediately
    updateEffect();

    // Subscribe to stage changes to update effect
    const unsubscribe = engine.subscribe(() => {
      updateEffect();
    });

    return unsubscribe;
  }, [engine, defaultEffect]);

  return {
    effect,
    isLoading
  };
}