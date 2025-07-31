/**
 * Legacy adapter for migrating from existing stage flow implementations
 */

import {
  StageFlowConfig,
  StageConfig,
  Transition,
  EffectConfig
} from '../types/core';
import { StageFlowEngine } from '../engine';

/**
 * Legacy flow configuration format (pre-generic version)
 */
export interface LegacyFlowConfig {
  /** Initial stage name */
  initial: string;
  /** Stage definitions */
  stages: Record<string, LegacyStageConfig>;
  /** Optional effects configuration */
  effects?: Record<string, LegacyEffectConfig>;
  /** Optional global configuration */
  config?: {
    /** Whether to enable debug logging */
    debug?: boolean;
    /** Whether to persist state */
    persist?: boolean;
    /** Storage key for persistence */
    storageKey?: string;
  };
}

/**
 * Legacy stage configuration format
 */
export interface LegacyStageConfig {
  /** Component to render for this stage */
  component?: React.ComponentType<any>;
  /** Transitions from this stage */
  on?: Record<string, string | LegacyTransitionConfig>;
  /** Auto-transition after duration */
  after?: number | { duration: number; target: string };
  /** Stage-specific data */
  data?: any;
  /** Entry hook */
  onEntry?: (context: any) => void | Promise<void>;
  /** Exit hook */
  onExit?: (context: any) => void | Promise<void>;
  /** Effect to apply */
  effect?: string;
}

/**
 * Legacy transition configuration
 */
export interface LegacyTransitionConfig {
  /** Target stage */
  target: string;
  /** Condition for transition */
  cond?: (context: any) => boolean | Promise<boolean>;
  /** Actions to perform during transition */
  actions?: Array<(context: any) => void | Promise<void>>;
}

/**
 * Legacy effect configuration
 */
export interface LegacyEffectConfig {
  /** Effect type */
  type?: string;
  /** Duration in milliseconds */
  duration?: number;
  /** Easing function */
  easing?: string;
  /** Delay before effect starts */
  delay?: number;
  /** Custom properties */
  [key: string]: any;
}

/**
 * Legacy Zustand store interface
 */
export interface LegacyStageStore {
  /** Current stage */
  currentStage: string;
  /** Stage data */
  stageData?: any;
  /** Whether transitioning */
  isTransitioning?: boolean;
  /** Transition history */
  history?: Array<{ stage: string; timestamp: number; data?: any }>;
  /** Send event method */
  send: (event: string, data?: any) => void | Promise<void>;
  /** Go to stage method */
  goTo: (stage: string, data?: any) => void | Promise<void>;
  /** Reset method */
  reset: () => void;
  /** Subscribe method */
  subscribe?: (callback: (state: any) => void) => () => void;
}

/**
 * Converts legacy flow configuration to new generic format
 */
export function createLegacyAdapter<TStage extends string = string, TData = any>(
  legacyConfig: LegacyFlowConfig
): StageFlowConfig<TStage, TData> {
  // Convert stages from object format to array format
  const stages: StageConfig<TStage, TData>[] = Object.entries(legacyConfig.stages).map(
    ([stageName, stageConfig]) => {
      const transitions: Transition<TStage, TData>[] = [];

      // Convert 'on' transitions
      if (stageConfig.on) {
        Object.entries(stageConfig.on).forEach(([event, transitionDef]) => {
          if (typeof transitionDef === 'string') {
            // Simple string target
            transitions.push({
              target: transitionDef as TStage,
              event
            });
          } else {
            // Complex transition configuration
            const transition: Transition<TStage, TData> = {
              target: transitionDef.target as TStage,
              event
            };

            // Convert condition
            if (transitionDef.cond) {
              transition.condition = transitionDef.cond;
            }

            transitions.push(transition);
          }
        });
      }

      // Convert 'after' auto-transitions
      if (stageConfig.after) {
        if (typeof stageConfig.after === 'number') {
          // Legacy format: just duration, need to infer target
          // This is a limitation - we'll need the first available transition target
          const firstTransition = transitions[0];
          if (firstTransition) {
            transitions.push({
              target: firstTransition.target,
              after: stageConfig.after
            });
          }
        } else {
          // New format with duration and target
          transitions.push({
            target: stageConfig.after.target as TStage,
            after: stageConfig.after.duration
          });
        }
      }

      return {
        name: stageName as TStage,
        transitions,
        effect: stageConfig.effect,
        data: stageConfig.data,
        onEnter: stageConfig.onEntry,
        onExit: stageConfig.onExit
      };
    }
  );

  // Convert effects
  const effects: Record<string, EffectConfig> = {};
  if (legacyConfig.effects) {
    Object.entries(legacyConfig.effects).forEach(([effectName, legacyEffect]) => {
      effects[effectName] = {
        type: legacyEffect.type || 'fade',
        duration: legacyEffect.duration,
        easing: legacyEffect.easing,
        delay: legacyEffect.delay,
        options: Object.fromEntries(
          Object.entries(legacyEffect).filter(
            ([key]) => !['type', 'duration', 'easing', 'delay'].includes(key)
          )
        )
      };
    });
  }

  // Build new configuration
  const newConfig: StageFlowConfig<TStage, TData> = {
    initial: legacyConfig.initial as TStage,
    stages,
    effects: Object.keys(effects).length > 0 ? effects : undefined
  };

  // Add persistence configuration if enabled in legacy config
  if (legacyConfig.config?.persist) {
    newConfig.persistence = {
      enabled: true,
      storage: 'localStorage',
      key: legacyConfig.config.storageKey || 'stage-flow-state'
    };
  }

  return newConfig;
}

/**
 * Creates a compatibility wrapper for legacy Zustand stores
 */
export function migrateLegacyStore<TStage extends string = string, TData = any>(
  legacyStore: LegacyStageStore,
  legacyConfig?: LegacyFlowConfig
): StageFlowEngine<TStage, TData> {
  // If we have legacy config, use it to create a proper engine
  if (legacyConfig) {
    const newConfig = createLegacyAdapter<TStage, TData>(legacyConfig);
    return new StageFlowEngine(newConfig);
  }

  // Otherwise, create a minimal configuration from the store state
  const minimalConfig: StageFlowConfig<TStage, TData> = {
    initial: legacyStore.currentStage as TStage,
    stages: [
      {
        name: legacyStore.currentStage as TStage,
        transitions: [] // No transitions available from store alone
      }
    ]
  };

  const engine = new StageFlowEngine(minimalConfig);

  // Create a compatibility layer that bridges the old store API to the new engine
  const compatibilityLayer = {
    // Sync engine state with legacy store
    syncWithLegacyStore: () => {
      // Subscribe to engine changes and update legacy store if it has update methods
      engine.subscribe((stage, data) => {
        if ('currentStage' in legacyStore && typeof legacyStore.currentStage === 'string') {
          (legacyStore as any).currentStage = stage;
        }
        if ('stageData' in legacyStore) {
          (legacyStore as any).stageData = data;
        }
      });

      // If legacy store has subscribe method, sync changes back to engine
      if (legacyStore.subscribe) {
        legacyStore.subscribe((state: any) => {
          if (state.currentStage !== engine.getCurrentStage()) {
            // Legacy store changed, update engine
            engine.goTo(state.currentStage as TStage, state.stageData);
          }
        });
      }
    },

    // Wrap legacy store methods to use new engine
    wrapLegacyMethods: () => {
      const originalSend = legacyStore.send;
      const originalGoTo = legacyStore.goTo;
      const originalReset = legacyStore.reset;

      // Override send method
      legacyStore.send = async (event: string, data?: any) => {
        try {
          await engine.send(event, data);
        } catch (error) {
          // Fallback to original method if engine fails
          if (originalSend) {
            return originalSend(event, data);
          }
          throw error;
        }
      };

      // Override goTo method
      legacyStore.goTo = async (stage: string, data?: any) => {
        try {
          await engine.goTo(stage as TStage, data);
        } catch (error) {
          // Fallback to original method if engine fails
          if (originalGoTo) {
            return originalGoTo(stage, data);
          }
          throw error;
        }
      };

      // Override reset method
      legacyStore.reset = async () => {
        try {
          await engine.reset();
        } catch (error) {
          // Fallback to original method if engine fails
          if (originalReset) {
            return originalReset();
          }
          throw error;
        }
      };
    }
  };

  // Initialize compatibility layer
  compatibilityLayer.syncWithLegacyStore();
  compatibilityLayer.wrapLegacyMethods();

  return engine;
}

/**
 * Migration utilities for smooth transition
 */
export const migrationUtils = {
  /**
   * Validates that a legacy configuration can be successfully migrated
   */
  validateLegacyConfig(legacyConfig: LegacyFlowConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!legacyConfig.initial) {
      errors.push('Legacy config must have an initial stage');
    }

    if (!legacyConfig.stages || Object.keys(legacyConfig.stages).length === 0) {
      errors.push('Legacy config must have at least one stage');
    }

    if (legacyConfig.initial && legacyConfig.stages && !legacyConfig.stages[legacyConfig.initial]) {
      errors.push(`Initial stage "${legacyConfig.initial}" not found in stages`);
    }

    // Validate stage transitions reference existing stages
    if (legacyConfig.stages) {
      const stageNames = Object.keys(legacyConfig.stages);
      Object.entries(legacyConfig.stages).forEach(([stageName, stageConfig]) => {
        if (stageConfig.on) {
          Object.entries(stageConfig.on).forEach(([, transitionDef]) => {
            const target = typeof transitionDef === 'string' ? transitionDef : transitionDef.target;
            if (!stageNames.includes(target)) {
              errors.push(`Stage "${stageName}" has transition to non-existent stage "${target}"`);
            }
          });
        }

        if (stageConfig.after && typeof stageConfig.after === 'object') {
          if (!stageNames.includes(stageConfig.after.target)) {
            errors.push(`Stage "${stageName}" has auto-transition to non-existent stage "${stageConfig.after.target}"`);
          }
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Generates a migration report showing what will change
   */
  generateMigrationReport(legacyConfig: LegacyFlowConfig): {
    summary: string;
    changes: Array<{ type: 'info' | 'warning' | 'error'; message: string }>;
    newConfig: StageFlowConfig<string, any>;
  } {
    const changes: Array<{ type: 'info' | 'warning' | 'error'; message: string }> = [];
    
    try {
      const newConfig = createLegacyAdapter(legacyConfig);
      
      changes.push({
        type: 'info',
        message: `Migrating ${Object.keys(legacyConfig.stages).length} stages`
      });

      // Check for potential issues
      Object.entries(legacyConfig.stages).forEach(([stageName, stageConfig]) => {
        if (stageConfig.after && typeof stageConfig.after === 'number') {
          changes.push({
            type: 'warning',
            message: `Stage "${stageName}" has legacy auto-transition format - target will be inferred`
          });
        }

        if (stageConfig.onEntry || stageConfig.onExit) {
          changes.push({
            type: 'info',
            message: `Stage "${stageName}" lifecycle hooks will be preserved`
          });
        }
      });

      if (legacyConfig.effects) {
        changes.push({
          type: 'info',
          message: `Migrating ${Object.keys(legacyConfig.effects).length} effect configurations`
        });
      }

      if (legacyConfig.config?.persist) {
        changes.push({
          type: 'info',
          message: 'Persistence configuration will be migrated to new format'
        });
      }

      return {
        summary: `Successfully analyzed migration of ${Object.keys(legacyConfig.stages).length} stages`,
        changes,
        newConfig
      };
    } catch (error) {
      changes.push({
        type: 'error',
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      return {
        summary: 'Migration analysis failed',
        changes,
        newConfig: {} as StageFlowConfig<string, any>
      };
    }
  },

  /**
   * Creates a side-by-side comparison of old and new configurations
   */
  compareConfigurations(
    legacyConfig: LegacyFlowConfig,
    newConfig: StageFlowConfig<string, any>
  ): {
    legacy: any;
    modern: any;
    differences: Array<{ path: string; legacy: any; modern: any }>;
  } {
    const differences: Array<{ path: string; legacy: any; modern: any }> = [];

    // Compare structure
    differences.push({
      path: 'stages.format',
      legacy: 'Object with stage names as keys',
      modern: 'Array of stage configurations'
    });

    differences.push({
      path: 'transitions.format',
      legacy: 'on: { event: target } format',
      modern: 'transitions: [{ target, event }] format'
    });

    if (legacyConfig.config?.persist !== undefined) {
      differences.push({
        path: 'persistence',
        legacy: `config.persist: ${legacyConfig.config.persist}`,
        modern: `persistence: { enabled: ${newConfig.persistence?.enabled || false} }`
      });
    }

    return {
      legacy: legacyConfig,
      modern: newConfig,
      differences
    };
  }
};

/**
 * Helper function to create a migration guide
 */
export function createMigrationGuide(legacyConfig: LegacyFlowConfig): string {
  const report = migrationUtils.generateMigrationReport(legacyConfig);
  
  let guide = '# Stage Flow Migration Guide\n\n';
  guide += `## Summary\n${report.summary}\n\n`;
  
  if (report.changes.length > 0) {
    guide += '## Changes\n\n';
    report.changes.forEach(change => {
      const icon = change.type === 'error' ? '❌' : change.type === 'warning' ? '⚠️' : 'ℹ️';
      guide += `${icon} **${change.type.toUpperCase()}**: ${change.message}\n\n`;
    });
  }

  guide += '## Migration Steps\n\n';
  guide += '1. Install the new stage-flow library\n';
  guide += '2. Replace your legacy configuration with the migrated version\n';
  guide += '3. Update your component imports to use the new API\n';
  guide += '4. Test your stage flows to ensure they work as expected\n';
  guide += '5. Remove the legacy stage flow dependencies\n\n';

  guide += '## New Configuration\n\n';
  guide += '```typescript\n';
  guide += JSON.stringify(report.newConfig, null, 2);
  guide += '\n```\n';

  return guide;
}