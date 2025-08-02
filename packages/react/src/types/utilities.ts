/**
 * Utility types for better type inference and safety
 */

import { ComponentType } from 'react';
import { StageFlowEngine } from '@stage-flow/core';
import { StageProps } from '../components/StageRenderer';

/**
 * Extract stage names from a StageFlowEngine type
 */
export type ExtractStages<T> = T extends StageFlowEngine<infer TStage, any> ? TStage : never;

/**
 * Extract data type from a StageFlowEngine type
 */
export type ExtractData<T> = T extends StageFlowEngine<any, infer TData> ? TData : never;

/**
 * Type-safe stage component map
 */
export type StageComponentMap<TStage extends string, TData = unknown> = {
  [K in TStage]?: ComponentType<StageProps<TStage, TData>>;
};

/**
 * Type for stage-specific effect configurations
 */
export type StageEffectMap<TStage extends string> = {
  [K in TStage | 'default']?: import('@stage-flow/core').EffectConfig;
};

/**
 * Helper type to ensure all stages have components
 */
export type RequiredStageComponents<TStage extends string, TData = unknown> = {
  [K in TStage]: ComponentType<StageProps<TStage, TData>>;
};

/**
 * Type for stage-specific data
 */
export type StageDataMap<TStage extends string, TData = unknown> = {
  [K in TStage]?: TData;
};

/**
 * Type guard to check if a value is a valid stage
 */
export function isValidStage<TStage extends string>(
  stage: string,
  validStages: readonly TStage[]
): stage is TStage {
  return validStages.includes(stage as TStage);
}

/**
 * Type-safe stage transition map
 */
export type StageTransitionMap<TStage extends string> = {
  [K in TStage]?: {
    [event: string]: TStage;
  };
};

/**
 * Helper type for stage flow configuration with better type inference
 */
export interface TypedStageFlowConfig<TStage extends string, TData = unknown> {
  /** Initial stage */
  initialStage: TStage;
  /** Initial data */
  initialData?: TData;
  /** Stage definitions */
  stages: Record<TStage, {
    /** Stage-specific effects */
    effect?: string;
    /** Stage-specific timers */
    timers?: Array<{
      duration: number;
      event: string;
      data?: TData;
    }>;
    /** Valid transitions from this stage */
    on?: Record<string, TStage>;
  }>;
  /** Global effects */
  effects?: Record<string, import('@stage-flow/core').EffectConfig>;
}

/**
 * Helper function to create type-safe stage flow configuration
 */
export function createStageFlowConfig<TStage extends string, TData = unknown>(
  config: TypedStageFlowConfig<TStage, TData>
): TypedStageFlowConfig<TStage, TData> {
  return config;
}

/**
 * Helper function to create type-safe stage components
 */
export function createStageComponents<TStage extends string, TData = unknown>(
  components: StageComponentMap<TStage, TData>
): StageComponentMap<TStage, TData> {
  return components;
}

/**
 * Helper function to create type-safe stage effects
 */
export function createStageEffects<TStage extends string>(
  effects: StageEffectMap<TStage>
): StageEffectMap<TStage> {
  return effects;
}

/**
 * Type for stage flow event handlers
 */
export type StageEventHandler<TStage extends string, TData = unknown> = (
  event: string,
  data?: TData,
  currentStage?: TStage
) => void | Promise<void>;

/**
 * Type for stage flow transition handlers
 */
export type StageTransitionHandler<TStage extends string, TData = unknown> = (
  from: TStage,
  to: TStage,
  data?: TData
) => void | Promise<void>;

/**
 * Enhanced stage props with additional type safety
 */
export interface TypedStageProps<
  TStage extends string,
  TData = unknown,
  TCurrentStage extends TStage = TStage
> extends StageProps<TStage, TData> {
  /** Current stage with narrowed type */
  stage: TCurrentStage;
  /** Type-safe navigation to specific stages */
  goToStage: <TTargetStage extends TStage>(
    stage: TTargetStage,
    data?: TData
  ) => Promise<void>;
  /** Type-safe event sending */
  sendEvent: (event: string, data?: TData) => Promise<void>;
}

/**
 * Helper to create typed stage component
 */
export function createTypedStageComponent<
  TStage extends string,
  TData = unknown,
  TCurrentStage extends TStage = TStage
>(
  component: ComponentType<TypedStageProps<TStage, TData, TCurrentStage>>
): ComponentType<StageProps<TStage, TData>> {
  return component as ComponentType<StageProps<TStage, TData>>;
}