/**
 * Configuration validation for the stage flow library
 * 
 * This module provides comprehensive validation for StageFlowConfig objects,
 * runtime type checking for stage transitions, and development-time warnings
 * for common configuration mistakes.
 */

import {
  StageFlowConfig,
  StageConfig,
  Transition,
  Plugin,
  Middleware,
  EffectConfig,
  PersistenceConfig
} from './types/core';
import { ConfigurationError } from './types/errors';

/**
 * Validation result interface
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Array of error messages */
  errors: string[];
  /** Array of warning messages */
  warnings: string[];
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Whether to perform strict validation (default: true) */
  strict?: boolean;
  /** Whether to validate stage transitions (default: true) */
  validateTransitions?: boolean;
  /** Whether to validate stage data types (default: true) */
  validateData?: boolean;
  /** Whether to show development warnings (default: true in development) */
  showWarnings?: boolean;
  /** Whether to validate plugin dependencies (default: true) */
  validatePlugins?: boolean;
  /** Whether to validate middleware configuration (default: true) */
  validateMiddleware?: boolean;
  /** Whether to validate effect configurations (default: true) */
  validateEffects?: boolean;
}

/**
 * Default validation options
 */
export const DEFAULT_VALIDATION_OPTIONS: Required<ValidationOptions> = {
  strict: true,
  validateTransitions: true,
  validateData: true,
  showWarnings: process.env.NODE_ENV === 'development',
  validatePlugins: true,
  validateMiddleware: true,
  validateEffects: true
};

/**
 * Configuration validator class
 */
export class StageFlowValidator<TStage extends string, TData = unknown> {
  private options: Required<ValidationOptions>;

  constructor(options: ValidationOptions = {}) {
    this.options = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  }

  /**
   * Validates a complete stage flow configuration
   */
  validate(config: StageFlowConfig<TStage, TData>): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Basic structure validation
      this.validateBasicStructure(config, result);

      // Validate stages
      this.validateStages(config, result);

      // Validate transitions
      if (this.options.validateTransitions) {
        this.validateTransitions(config, result);
      }

      // Validate plugins
      if (this.options.validatePlugins && config.plugins) {
        this.validatePlugins(config.plugins, result);
      }

      // Validate middleware
      if (this.options.validateMiddleware && config.middleware) {
        this.validateMiddleware(config.middleware, result);
      }

      // Validate effects
      if (this.options.validateEffects && config.effects) {
        this.validateEffects(config.effects, result);
      }

      // Validate persistence
      if (config.persistence) {
        this.validatePersistence(config.persistence, result);
      }

      // Check for common mistakes and add warnings
      if (this.options.showWarnings) {
        this.addDevelopmentWarnings(config, result);
      }

    } catch (error) {
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validates basic configuration structure
   */
  private validateBasicStructure(config: StageFlowConfig<TStage, TData>, result: ValidationResult): void {
    if (!config) {
      result.errors.push('Configuration is required');
      return;
    }

    if (!config.initial) {
      result.errors.push('Initial stage must be specified');
    }

    if (!config.stages || !Array.isArray(config.stages)) {
      result.errors.push('Stages array is required');
      return;
    }

    if (config.stages.length === 0) {
      result.errors.push('At least one stage must be defined');
    }
  }

  /**
   * Validates stage configurations
   */
  private validateStages(config: StageFlowConfig<TStage, TData>, result: ValidationResult): void {
    const stageNames = new Set<TStage>();
    const initialStageExists = config.stages.some(stage => stage.name === config.initial);

    if (!initialStageExists) {
      result.errors.push(`Initial stage "${config.initial}" not found in stages array`);
    }

    for (let i = 0; i < config.stages.length; i++) {
      const stage = config.stages[i];
      const stagePrefix = `Stage ${i + 1} (${stage?.name || 'unnamed'})`;

      // Validate stage structure
      if (!stage) {
        result.errors.push(`${stagePrefix}: Stage configuration is required`);
        continue;
      }

      if (!stage.name) {
        result.errors.push(`${stagePrefix}: Stage name is required`);
        continue;
      }

      // Check for duplicate stage names
      if (stageNames.has(stage.name)) {
        result.errors.push(`${stagePrefix}: Duplicate stage name "${stage.name}"`);
      } else {
        stageNames.add(stage.name);
      }

      // Validate transitions array
      if (!stage.transitions || !Array.isArray(stage.transitions)) {
        result.errors.push(`${stagePrefix}: Transitions array is required`);
        continue;
      }

      // Validate individual transitions
      this.validateStageTransitions(stage, config.stages, result);

      // Validate stage-specific properties
      this.validateStageProperties(stage, result);
    }
  }

  /**
   * Validates transitions for a specific stage
   */
  private validateStageTransitions(
    stage: StageConfig<TStage, TData>,
    allStages: StageConfig<TStage, TData>[],
    result: ValidationResult
  ): void {
    const stageNames = new Set(allStages.map(s => s.name));

    // Check for multiple after transitions
    const afterTransitions = stage.transitions.filter(t => t.after !== undefined);
    if (afterTransitions.length > 1) {
      result.errors.push(`Stage "${stage.name}" has multiple transitions with 'after' property. Only one automatic transition is allowed per stage.`);
    }

    for (let i = 0; i < stage.transitions.length; i++) {
      const transition = stage.transitions[i];
      const transitionPrefix = `Stage "${stage.name}" transition ${i + 1}`;

      if (!transition) {
        result.errors.push(`${transitionPrefix}: Transition configuration is required`);
        continue;
      }

      if (!transition.target) {
        result.errors.push(`${transitionPrefix}: Target stage is required`);
        continue;
      }

      // Check if target stage exists
      if (!stageNames.has(transition.target)) {
        result.errors.push(`${transitionPrefix}: Target stage "${transition.target}" does not exist`);
      }

      // Validate transition properties
      this.validateTransitionProperties(transition, stage.name, result);
    }
  }

  /**
   * Validates transition properties
   */
  private validateTransitionProperties(
    transition: Transition<TStage, TData>,
    stageName: TStage,
    result: ValidationResult
  ): void {
    const transitionPrefix = `Stage "${stageName}" transition to "${transition.target}"`;

    // Validate after
    if (transition.after !== undefined) {
      if (typeof transition.after !== 'number' || transition.after < 0) {
        result.errors.push(`${transitionPrefix}: After must be a non-negative number`);
      }
      if (transition.after > 300000) { // 5 minutes
        result.warnings.push(`${transitionPrefix}: After is very long (${transition.after}ms). Consider if this is intentional.`);
      }
    }

    // Validate event name
    if (transition.event !== undefined) {
      if (typeof transition.event !== 'string' || transition.event.trim() === '') {
        result.errors.push(`${transitionPrefix}: Event name must be a non-empty string`);
      }
    }

    // Validate condition function
    if (transition.condition !== undefined) {
      if (typeof transition.condition !== 'function') {
        result.errors.push(`${transitionPrefix}: Condition must be a function`);
      }
    }

    // Validate middleware
    if (transition.middleware) {
      this.validateMiddleware(transition.middleware, result, `${transitionPrefix} middleware`);
    }
  }

  /**
   * Validates stage-specific properties
   */
  private validateStageProperties(stage: StageConfig<TStage, TData>, result: ValidationResult): void {
    const stagePrefix = `Stage "${stage.name}"`;

    // Validate effect reference
    if (stage.effect !== undefined) {
      if (typeof stage.effect !== 'string' || stage.effect.trim() === '') {
        result.errors.push(`${stagePrefix}: Effect must be a non-empty string`);
      }
    }

    // Validate lifecycle hooks
    if (stage.onEnter !== undefined && typeof stage.onEnter !== 'function') {
      result.errors.push(`${stagePrefix}: onEnter must be a function`);
    }

    if (stage.onExit !== undefined && typeof stage.onExit !== 'function') {
      result.errors.push(`${stagePrefix}: onExit must be a function`);
    }
  }

  /**
   * Validates all transitions in the configuration
   */
  private validateTransitions(config: StageFlowConfig<TStage, TData>, result: ValidationResult): void {
    const stageMap = new Map(config.stages.map(stage => [stage.name, stage]));

    // Check for unreachable stages
    const reachableStages = new Set<TStage>([config.initial]);
    const toVisit = [config.initial];

    while (toVisit.length > 0) {
      const currentStage = toVisit.pop()!;
      const stageConfig = stageMap.get(currentStage);

      if (stageConfig) {
        for (const transition of stageConfig.transitions) {
          if (!reachableStages.has(transition.target)) {
            reachableStages.add(transition.target);
            toVisit.push(transition.target);
          }
        }
      }
    }

    // Warn about unreachable stages
    for (const stage of config.stages) {
      if (!reachableStages.has(stage.name)) {
        result.warnings.push(`Stage "${stage.name}" is not reachable from the initial stage`);
      }
    }

    // Check for stages with no outgoing transitions (potential dead ends)
    for (const stage of config.stages) {
      if (stage.transitions.length === 0) {
        result.warnings.push(`Stage "${stage.name}" has no outgoing transitions (potential dead end)`);
      }
    }

    // Check for circular transitions without conditions
    this.detectCircularTransitions(config, result);
  }

  /**
   * Detects potentially problematic circular transitions
   */
  private detectCircularTransitions(config: StageFlowConfig<TStage, TData>, result: ValidationResult): void {
    const stageMap = new Map(config.stages.map(stage => [stage.name, stage]));

    for (const stage of config.stages) {
      for (const transition of stage.transitions) {
        // Check for immediate self-loops without conditions or events
        if (transition.target === stage.name && !transition.condition && !transition.event && !transition.after) {
          result.warnings.push(
            `Stage "${stage.name}" has an unconditional self-loop transition that may cause infinite loops`
          );
        }

        // Check for simple two-stage loops
        const targetStage = stageMap.get(transition.target);
        if (targetStage) {
          const backTransition = targetStage.transitions.find(t => t.target === stage.name);
          if (backTransition && !transition.condition && !backTransition.condition && 
              !transition.event && !backTransition.event && !transition.after && !backTransition.after) {
            result.warnings.push(
              `Potential infinite loop between stages "${stage.name}" and "${transition.target}" without conditions or events`
            );
          }
        }
      }
    }
  }

  /**
   * Validates plugin configurations
   */
  private validatePlugins(plugins: Plugin<TStage, TData>[], result: ValidationResult, prefix = 'Plugin'): void {
    const pluginNames = new Set<string>();

    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];
      const pluginPrefix = `${prefix} ${i + 1}`;

      if (!plugin) {
        result.errors.push(`${pluginPrefix}: Plugin configuration is required`);
        continue;
      }

      if (!plugin.name || typeof plugin.name !== 'string') {
        result.errors.push(`${pluginPrefix}: Plugin name is required and must be a string`);
        continue;
      }

      // Check for duplicate plugin names
      if (pluginNames.has(plugin.name)) {
        result.errors.push(`${pluginPrefix}: Duplicate plugin name "${plugin.name}"`);
      } else {
        pluginNames.add(plugin.name);
      }

      // Validate install function
      if (!plugin.install || typeof plugin.install !== 'function') {
        result.errors.push(`${pluginPrefix} "${plugin.name}": Install function is required`);
      }

      // Validate uninstall function if present
      if (plugin.uninstall !== undefined && typeof plugin.uninstall !== 'function') {
        result.errors.push(`${pluginPrefix} "${plugin.name}": Uninstall must be a function`);
      }

      // Validate version if present
      if (plugin.version !== undefined && typeof plugin.version !== 'string') {
        result.errors.push(`${pluginPrefix} "${plugin.name}": Version must be a string`);
      }

      // Validate dependencies
      if (plugin.dependencies) {
        if (!Array.isArray(plugin.dependencies)) {
          result.errors.push(`${pluginPrefix} "${plugin.name}": Dependencies must be an array`);
        } else {
          for (const dep of plugin.dependencies) {
            if (typeof dep !== 'string') {
              result.errors.push(`${pluginPrefix} "${plugin.name}": Dependency names must be strings`);
            }
          }
        }
      }

      // Validate hooks
      if (plugin.hooks) {
        this.validatePluginHooks(plugin, result);
      }
    }

    // Validate plugin dependencies
    this.validatePluginDependencies(plugins, result);
  }

  /**
   * Validates plugin hook functions
   */
  private validatePluginHooks(plugin: Plugin<TStage, TData>, result: ValidationResult): void {
    const pluginPrefix = `Plugin "${plugin.name}"`;
    const hooks = plugin.hooks!;

    if (hooks.beforeTransition !== undefined && typeof hooks.beforeTransition !== 'function') {
      result.errors.push(`${pluginPrefix}: beforeTransition hook must be a function`);
    }

    if (hooks.afterTransition !== undefined && typeof hooks.afterTransition !== 'function') {
      result.errors.push(`${pluginPrefix}: afterTransition hook must be a function`);
    }

    if (hooks.onStageEnter !== undefined && typeof hooks.onStageEnter !== 'function') {
      result.errors.push(`${pluginPrefix}: onStageEnter hook must be a function`);
    }

    if (hooks.onStageExit !== undefined && typeof hooks.onStageExit !== 'function') {
      result.errors.push(`${pluginPrefix}: onStageExit hook must be a function`);
    }
  }

  /**
   * Validates plugin dependency chains
   */
  private validatePluginDependencies(plugins: Plugin<TStage, TData>[], result: ValidationResult): void {
    const pluginMap = new Map(plugins.map(p => [p.name, p]));

    for (const plugin of plugins) {
      if (plugin.dependencies) {
        // Check if all dependencies exist
        for (const depName of plugin.dependencies) {
          if (!pluginMap.has(depName)) {
            result.errors.push(`Plugin "${plugin.name}" depends on "${depName}" which is not included in the configuration`);
          }
        }

        // Check for circular dependencies
        const visited = new Set<string>();
        const visiting = new Set<string>();

        const checkCircular = (pluginName: string): boolean => {
          if (visiting.has(pluginName)) {
            return true; // Circular dependency found
          }
          if (visited.has(pluginName)) {
            return false;
          }

          visiting.add(pluginName);
          const currentPlugin = pluginMap.get(pluginName);
          
          if (currentPlugin?.dependencies) {
            for (const dep of currentPlugin.dependencies) {
              if (checkCircular(dep)) {
                return true;
              }
            }
          }

          visiting.delete(pluginName);
          visited.add(pluginName);
          return false;
        };

        if (checkCircular(plugin.name)) {
          result.errors.push(`Circular dependency detected involving plugin "${plugin.name}"`);
        }
      }
    }
  }

  /**
   * Validates middleware configurations
   */
  private validateMiddleware(
    middleware: Middleware<TStage, TData>[], 
    result: ValidationResult, 
    prefix = 'Middleware'
  ): void {
    const middlewareNames = new Set<string>();

    for (let i = 0; i < middleware.length; i++) {
      const mw = middleware[i];
      const middlewarePrefix = `${prefix} ${i + 1}`;

      if (!mw) {
        result.errors.push(`${middlewarePrefix}: Middleware configuration is required`);
        continue;
      }

      if (!mw.name || typeof mw.name !== 'string') {
        result.errors.push(`${middlewarePrefix}: Middleware name is required and must be a string`);
        continue;
      }

      // Check for duplicate middleware names
      if (middlewareNames.has(mw.name)) {
        result.errors.push(`${middlewarePrefix}: Duplicate middleware name "${mw.name}"`);
      } else {
        middlewareNames.add(mw.name);
      }

      // Validate execute function
      if (!mw.execute || typeof mw.execute !== 'function') {
        result.errors.push(`${middlewarePrefix} "${mw.name}": Execute function is required`);
      }
    }
  }

  /**
   * Validates effect configurations
   */
  private validateEffects(effects: Record<string, EffectConfig>, result: ValidationResult): void {
    for (const [effectName, effectConfig] of Object.entries(effects)) {
      const effectPrefix = `Effect "${effectName}"`;

      if (!effectConfig) {
        result.errors.push(`${effectPrefix}: Effect configuration is required`);
        continue;
      }

      if (!effectConfig.type || typeof effectConfig.type !== 'string') {
        result.errors.push(`${effectPrefix}: Effect type is required and must be a string`);
      }

      if (effectConfig.duration !== undefined) {
        if (typeof effectConfig.duration !== 'number' || effectConfig.duration < 0) {
          result.errors.push(`${effectPrefix}: Duration must be a non-negative number`);
        }
      }

      if (effectConfig.delay !== undefined) {
        if (typeof effectConfig.delay !== 'number' || effectConfig.delay < 0) {
          result.errors.push(`${effectPrefix}: Delay must be a non-negative number`);
        }
      }

      if (effectConfig.easing !== undefined && typeof effectConfig.easing !== 'string') {
        result.errors.push(`${effectPrefix}: Easing must be a string`);
      }
    }
  }

  /**
   * Validates persistence configuration
   */
  private validatePersistence(persistence: PersistenceConfig<TStage, TData>, result: ValidationResult): void {
    if (typeof persistence.enabled !== 'boolean') {
      result.errors.push('Persistence: enabled must be a boolean');
    }

    if (!persistence.key || typeof persistence.key !== 'string') {
      result.errors.push('Persistence: key is required and must be a string');
    }

    const validStorageTypes = ['localStorage', 'sessionStorage', 'custom'];
    if (!validStorageTypes.includes(persistence.storage)) {
      result.errors.push(`Persistence: storage must be one of: ${validStorageTypes.join(', ')}`);
    }

    if (persistence.storage === 'custom' && !persistence.serializer) {
      result.errors.push('Persistence: custom storage requires a serializer');
    }

    if (persistence.serializer) {
      if (typeof persistence.serializer.serialize !== 'function') {
        result.errors.push('Persistence: serializer.serialize must be a function');
      }
      if (typeof persistence.serializer.deserialize !== 'function') {
        result.errors.push('Persistence: serializer.deserialize must be a function');
      }
    }

    if (persistence.ttl !== undefined) {
      if (typeof persistence.ttl !== 'number' || persistence.ttl <= 0) {
        result.errors.push('Persistence: ttl must be a positive number');
      }
    }
  }

  /**
   * Adds development-time warnings for common mistakes
   */
  private addDevelopmentWarnings(config: StageFlowConfig<TStage, TData>, result: ValidationResult): void {
    // Warn about stages with only timer-based transitions
    for (const stage of config.stages) {
      const hasNonTimerTransitions = stage.transitions.some(t => !t.after || t.event || t.condition);
      if (!hasNonTimerTransitions && stage.transitions.length > 0) {
        result.warnings.push(`Stage "${stage.name}" only has timer-based transitions. Consider adding event-based or conditional transitions for better user control.`);
      }
    }

    // Warn about unused effects
    if (config.effects) {
      const usedEffects = new Set<string>();
      for (const stage of config.stages) {
        if (stage.effect) {
          usedEffects.add(stage.effect);
        }
      }

      for (const effectName of Object.keys(config.effects)) {
        if (!usedEffects.has(effectName)) {
          result.warnings.push(`Effect "${effectName}" is defined but not used by any stage`);
        }
      }
    }

    // Warn about stages referencing non-existent effects
    if (config.effects) {
      const definedEffects = new Set(Object.keys(config.effects));
      for (const stage of config.stages) {
        if (stage.effect && !definedEffects.has(stage.effect)) {
          result.warnings.push(`Stage "${stage.name}" references undefined effect "${stage.effect}"`);
        }
      }
    }

    // Warn about very short or very long transition after times
    for (const stage of config.stages) {
      for (const transition of stage.transitions) {
        if (transition.after !== undefined) {
          if (transition.after < 100) {
            result.warnings.push(`Stage "${stage.name}" transition to "${transition.target}" has very short after time (${transition.after}ms). This may cause jarring user experience.`);
          }
          if (transition.after > 60000) {
            result.warnings.push(`Stage "${stage.name}" transition to "${transition.target}" has very long after time (${transition.after}ms). Consider if this timeout is appropriate.`);
          }
        }
      }
    }
  }

  /**
   * Updates validation options
   */
  updateOptions(newOptions: Partial<ValidationOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Gets current validation options
   */
  getOptions(): Required<ValidationOptions> {
    return { ...this.options };
  }
}

/**
 * Convenience function to validate a stage flow configuration
 */
export function validateStageFlowConfig<TStage extends string, TData = unknown>(
  config: StageFlowConfig<TStage, TData>,
  options: ValidationOptions = {}
): ValidationResult {
  const validator = new StageFlowValidator<TStage, TData>(options);
  return validator.validate(config);
}

/**
 * Convenience function to validate and throw on errors
 */
export function validateStageFlowConfigStrict<TStage extends string, TData = unknown>(
  config: StageFlowConfig<TStage, TData>,
  options: ValidationOptions = {}
): void {
  const result = validateStageFlowConfig(config, options);
  
  if (!result.isValid) {
    throw new ConfigurationError(
      `Configuration validation failed:\n${result.errors.join('\n')}`,
      { validationResult: result, config }
    );
  }

  // Log warnings in development
  if (result.warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('Stage Flow Configuration Warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
}

/**
 * Runtime type checker for stage transitions
 */
export class RuntimeTypeChecker<TStage extends string, TData = unknown> {
  private expectedStages: Set<TStage>;
  private config: StageFlowConfig<TStage, TData>;

  constructor(config: StageFlowConfig<TStage, TData>) {
    this.config = config;
    this.expectedStages = new Set(config.stages.map(stage => stage.name));
  }

  /**
   * Checks if a stage name is valid
   */
  isValidStage(stage: unknown): stage is TStage {
    return typeof stage === 'string' && this.expectedStages.has(stage as TStage);
  }

  /**
   * Validates a stage transition at runtime
   */
  validateTransition(from: TStage, to: unknown, event?: string): void {
    if (!this.isValidStage(to)) {
      throw new ConfigurationError(
        `Invalid transition target: "${to}" is not a valid stage name`,
        { from, to, event, validStages: Array.from(this.expectedStages) }
      );
    }

    // Check if transition is allowed
    const fromStage = this.config.stages.find(stage => stage.name === from);
    if (!fromStage) {
      throw new ConfigurationError(
        `Source stage "${from}" not found in configuration`,
        { from, to, event }
      );
    }

    const validTransition = fromStage.transitions.find(transition => 
      transition.target === to && (!event || transition.event === event)
    );

    if (!validTransition) {
      throw new ConfigurationError(
        `No valid transition from "${from}" to "${to}"${event ? ` with event "${event}"` : ''}`,
        { from, to, event, availableTransitions: fromStage.transitions }
      );
    }
  }

  /**
   * Validates stage data at runtime
   */
  validateStageData(stage: TStage, data: unknown): void {
    // Basic type checking - in a real implementation, you might want to use
    // a schema validation library like Zod or Joi for more sophisticated validation
    if (data !== undefined && data !== null) {
      if (typeof data !== 'object') {
        console.warn(`Stage "${stage}" data should be an object, got ${typeof data}`);
      }
    }
  }

  /**
   * Updates the configuration for runtime checking
   */
  updateConfig(config: StageFlowConfig<TStage, TData>): void {
    this.config = config;
    this.expectedStages = new Set(config.stages.map(stage => stage.name));
  }
}

/**
 * Development-time warning system
 */
export class DevelopmentWarnings {
  private static warnings = new Set<string>();

  /**
   * Shows a warning once (prevents duplicate warnings)
   */
  static warn(message: string, context?: unknown): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const warningKey = `${message}${context ? JSON.stringify(context) : ''}`;
    if (!this.warnings.has(warningKey)) {
      this.warnings.add(warningKey);
      console.warn(`[Stage Flow Warning] ${message}`, context || '');
    }
  }

  /**
   * Clears all recorded warnings (useful for testing)
   */
  static clearWarnings(): void {
    this.warnings.clear();
  }

  /**
   * Gets the number of unique warnings shown
   */
  static getWarningCount(): number {
    return this.warnings.size;
  }
}