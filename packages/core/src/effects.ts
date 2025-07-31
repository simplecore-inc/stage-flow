/**
 * Effect configuration system for stage transitions
 */

import { EffectConfig, BuiltInEffectType, CustomEffectDefinition, EffectRegistry } from './types/core.js';

/**
 * Default effect configurations for built-in effects
 */
export const DEFAULT_EFFECTS: Record<BuiltInEffectType, EffectConfig> = {
  none: {
    type: 'none',
    duration: 0,
    easing: 'linear'
  },
  fade: {
    type: 'fade',
    duration: 300,
    easing: 'easeInOut'
  },
  slide: {
    type: 'slide',
    duration: 400,
    easing: 'easeInOut'
  },
  slideUp: {
    type: 'slideUp',
    duration: 400,
    easing: 'easeInOut'
  },
  slideDown: {
    type: 'slideDown',
    duration: 400,
    easing: 'easeInOut'
  },
  slideLeft: {
    type: 'slideLeft',
    duration: 400,
    easing: 'easeInOut'
  },
  slideRight: {
    type: 'slideRight',
    duration: 400,
    easing: 'easeInOut'
  },
  scale: {
    type: 'scale',
    duration: 350,
    easing: 'easeInOut'
  },
  scaleUp: {
    type: 'scaleUp',
    duration: 350,
    easing: 'easeInOut'
  },
  scaleDown: {
    type: 'scaleDown',
    duration: 350,
    easing: 'easeInOut'
  },
  flip: {
    type: 'flip',
    duration: 500,
    easing: 'easeInOut'
  },
  flipX: {
    type: 'flipX',
    duration: 500,
    easing: 'easeInOut'
  },
  flipY: {
    type: 'flipY',
    duration: 500,
    easing: 'easeInOut'
  },
  zoom: {
    type: 'zoom',
    duration: 300,
    easing: 'easeInOut',
    options: {
      scale: 1.1
    }
  },
  rotate: {
    type: 'rotate',
    duration: 400,
    easing: 'easeInOut',
    options: {
      rotation: 180
    }
  }
};

/**
 * Built-in effect factory functions
 */
export const BUILT_IN_EFFECT_FACTORIES: Record<BuiltInEffectType, (options?: Record<string, unknown>) => EffectConfig> = {
  none: (options = {}) => ({
    ...DEFAULT_EFFECTS.none,
    ...options
  }),
  fade: (options = {}) => ({
    ...DEFAULT_EFFECTS.fade,
    ...options
  }),
  slide: (options = {}) => ({
    ...DEFAULT_EFFECTS.slide,
    ...options
  }),
  slideUp: (options = {}) => ({
    ...DEFAULT_EFFECTS.slideUp,
    ...options
  }),
  slideDown: (options = {}) => ({
    ...DEFAULT_EFFECTS.slideDown,
    ...options
  }),
  slideLeft: (options = {}) => ({
    ...DEFAULT_EFFECTS.slideLeft,
    ...options
  }),
  slideRight: (options = {}) => ({
    ...DEFAULT_EFFECTS.slideRight,
    ...options
  }),
  scale: (options = {}) => ({
    ...DEFAULT_EFFECTS.scale,
    ...options
  }),
  scaleUp: (options = {}) => ({
    ...DEFAULT_EFFECTS.scaleUp,
    ...options
  }),
  scaleDown: (options = {}) => ({
    ...DEFAULT_EFFECTS.scaleDown,
    ...options
  }),
  flip: (options = {}) => ({
    ...DEFAULT_EFFECTS.flip,
    ...options
  }),
  flipX: (options = {}) => ({
    ...DEFAULT_EFFECTS.flipX,
    ...options
  }),
  flipY: (options = {}) => ({
    ...DEFAULT_EFFECTS.flipY,
    ...options
  }),
  zoom: (options = {}) => ({
    ...DEFAULT_EFFECTS.zoom,
    options: {
      ...DEFAULT_EFFECTS.zoom.options,
      ...options
    }
  }),
  rotate: (options = {}) => ({
    ...DEFAULT_EFFECTS.rotate,
    options: {
      ...DEFAULT_EFFECTS.rotate.options,
      ...options
    }
  })
};

/**
 * Implementation of the effect registry
 */
class EffectRegistryImpl implements EffectRegistry {
  private customEffects = new Map<string, CustomEffectDefinition>();

  /**
   * Register a custom effect
   */
  register(effect: CustomEffectDefinition): void {
    if (this.isBuiltInEffect(effect.name)) {
      throw new Error(`Cannot register effect "${effect.name}": name conflicts with built-in effect`);
    }
    
    this.customEffects.set(effect.name, effect);
  }

  /**
   * Unregister a custom effect
   */
  unregister(name: string): void {
    if (this.isBuiltInEffect(name)) {
      throw new Error(`Cannot unregister built-in effect "${name}"`);
    }
    
    this.customEffects.delete(name);
  }

  /**
   * Get a registered effect
   */
  get(name: string): CustomEffectDefinition | undefined {
    return this.customEffects.get(name);
  }

  /**
   * Get all registered effect names
   */
  getRegistered(): string[] {
    return Array.from(this.customEffects.keys());
  }

  /**
   * Check if an effect is registered
   */
  has(name: string): boolean {
    return this.customEffects.has(name) || this.isBuiltInEffect(name);
  }

  /**
   * Create an effect configuration
   */
  create(name: string, options?: Record<string, unknown>): EffectConfig | undefined {
    // Check for built-in effects first
    if (this.isBuiltInEffect(name)) {
      const factory = BUILT_IN_EFFECT_FACTORIES[name as BuiltInEffectType];
      return factory(options);
    }

    // Check for custom effects
    const customEffect = this.customEffects.get(name);
    if (customEffect) {
      const mergedOptions = {
        ...customEffect.defaultOptions,
        ...options
      };
      return customEffect.create(mergedOptions);
    }

    return undefined;
  }

  /**
   * Check if a name is a built-in effect
   */
  private isBuiltInEffect(name: string): boolean {
    return name in BUILT_IN_EFFECT_FACTORIES;
  }

  /**
   * Get all available effect names (built-in + custom)
   */
  getAllAvailable(): string[] {
    const builtIn = Object.keys(BUILT_IN_EFFECT_FACTORIES);
    const custom = this.getRegistered();
    return [...builtIn, ...custom];
  }
}

/**
 * Global effect registry instance
 */
export const effectRegistry: EffectRegistry = new EffectRegistryImpl();

/**
 * Utility function to create an effect configuration
 */
export function createEffect(name: string, options?: Record<string, unknown>): EffectConfig | undefined {
  return effectRegistry.create(name, options);
}

/**
 * Utility function to create a custom effect definition
 */
export function defineCustomEffect(
  name: string,
  factory: (options?: Record<string, unknown>) => EffectConfig,
  description?: string,
  defaultOptions?: Record<string, unknown>
): CustomEffectDefinition {
  return {
    name,
    create: factory,
    description,
    defaultOptions
  };
}

/**
 * Utility function to register multiple effects at once
 */
export function registerEffects(effects: CustomEffectDefinition[]): void {
  effects.forEach(effect => effectRegistry.register(effect));
}

/**
 * Utility function to get a built-in effect with custom options
 */
export function getBuiltInEffect(type: BuiltInEffectType, options?: Record<string, unknown>): EffectConfig {
  return BUILT_IN_EFFECT_FACTORIES[type](options);
}

/**
 * Utility function to validate an effect configuration
 */
export function validateEffectConfig(config: EffectConfig): boolean {
  if (!config.type || typeof config.type !== 'string') {
    return false;
  }

  if (config.duration !== undefined && (typeof config.duration !== 'number' || config.duration < 0)) {
    return false;
  }

  if (config.delay !== undefined && (typeof config.delay !== 'number' || config.delay < 0)) {
    return false;
  }

  if (config.easing !== undefined && typeof config.easing !== 'string') {
    return false;
  }

  return true;
}