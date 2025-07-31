/**
 * Tests for the effect configuration system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_EFFECTS,
  BUILT_IN_EFFECT_FACTORIES,
  effectRegistry,
  createEffect,
  defineCustomEffect,
  registerEffects,
  getBuiltInEffect,
  validateEffectConfig
} from '../effects';
import { EffectConfig, BuiltInEffectType, CustomEffectDefinition } from '../types/core';

describe('Effect Configuration System', () => {
  beforeEach(() => {
    // Clear custom effects before each test
    effectRegistry.getRegistered().forEach(name => {
      effectRegistry.unregister(name);
    });
  });

  describe('DEFAULT_EFFECTS', () => {
    it('should contain all built-in effect types', () => {
      const expectedTypes: BuiltInEffectType[] = [
        'none', 'fade', 'slide', 'slideUp', 'slideDown', 'slideLeft', 'slideRight',
        'scale', 'scaleUp', 'scaleDown', 'flip', 'flipX', 'flipY', 'zoom', 'rotate'
      ];

      expectedTypes.forEach(type => {
        expect(DEFAULT_EFFECTS[type]).toBeDefined();
        expect(DEFAULT_EFFECTS[type].type).toBe(type);
      });
    });

    it('should have sensible default durations', () => {
      expect(DEFAULT_EFFECTS.none.duration).toBe(0);
      expect(DEFAULT_EFFECTS.fade.duration).toBe(300);
      expect(DEFAULT_EFFECTS.slide.duration).toBe(400);
      expect(DEFAULT_EFFECTS.scale.duration).toBe(350);
    });

    it('should have appropriate easing values', () => {
      expect(DEFAULT_EFFECTS.fade.easing).toBe('easeInOut');
      expect(DEFAULT_EFFECTS.slide.easing).toBe('easeInOut');
      expect(DEFAULT_EFFECTS.none.easing).toBe('linear');
    });
  });

  describe('BUILT_IN_EFFECT_FACTORIES', () => {
    it('should create effects with default options', () => {
      const fadeEffect = BUILT_IN_EFFECT_FACTORIES.fade();
      expect(fadeEffect).toEqual(DEFAULT_EFFECTS.fade);
    });

    it('should merge custom options with defaults', () => {
      const customFade = BUILT_IN_EFFECT_FACTORIES.fade({ duration: 500 });
      expect(customFade.duration).toBe(500);
      expect(customFade.type).toBe('fade');
      expect(customFade.easing).toBe('easeInOut');
    });

    it('should handle effects with nested options', () => {
      const customZoom = BUILT_IN_EFFECT_FACTORIES.zoom({ scale: 1.5 });
      expect(customZoom.options?.scale).toBe(1.5);
      expect(customZoom.type).toBe('zoom');
    });
  });

  describe('EffectRegistry', () => {
    it('should register and retrieve custom effects', () => {
      const customEffect = defineCustomEffect(
        'bounce',
        (options = {}) => ({
          type: 'bounce',
          duration: 600,
          easing: 'easeOutBounce',
          ...options
        })
      );

      effectRegistry.register(customEffect);
      expect(effectRegistry.has('bounce')).toBe(true);
      expect(effectRegistry.get('bounce')).toBe(customEffect);
    });

    it('should prevent registering effects with built-in names', () => {
      const conflictingEffect = defineCustomEffect('fade', () => ({ type: 'fade' }));
      
      expect(() => effectRegistry.register(conflictingEffect)).toThrow(
        'Cannot register effect "fade": name conflicts with built-in effect'
      );
    });

    it('should unregister custom effects', () => {
      const customEffect = defineCustomEffect('test', () => ({ type: 'test' }));
      effectRegistry.register(customEffect);
      
      expect(effectRegistry.has('test')).toBe(true);
      effectRegistry.unregister('test');
      expect(effectRegistry.has('test')).toBe(false);
    });

    it('should prevent unregistering built-in effects', () => {
      expect(() => effectRegistry.unregister('fade')).toThrow(
        'Cannot unregister built-in effect "fade"'
      );
    });

    it('should create effect configurations', () => {
      // Test built-in effect
      const fadeConfig = effectRegistry.create('fade', { duration: 500 });
      expect(fadeConfig?.type).toBe('fade');
      expect(fadeConfig?.duration).toBe(500);

      // Test custom effect
      const customEffect = defineCustomEffect(
        'custom',
        (options = {}) => ({ type: 'custom', duration: 400, ...options })
      );
      effectRegistry.register(customEffect);
      
      const customConfig = effectRegistry.create('custom', { duration: 800 });
      expect(customConfig?.type).toBe('custom');
      expect(customConfig?.duration).toBe(800);
    });

    it('should return undefined for unknown effects', () => {
      const unknownConfig = effectRegistry.create('unknown');
      expect(unknownConfig).toBeUndefined();
    });

    it('should list all registered custom effects', () => {
      const effect1 = defineCustomEffect('custom1', () => ({ type: 'custom1' }));
      const effect2 = defineCustomEffect('custom2', () => ({ type: 'custom2' }));
      
      effectRegistry.register(effect1);
      effectRegistry.register(effect2);
      
      const registered = effectRegistry.getRegistered();
      expect(registered).toContain('custom1');
      expect(registered).toContain('custom2');
      expect(registered).toHaveLength(2);
    });
  });

  describe('Utility Functions', () => {
    describe('createEffect', () => {
      it('should create built-in effects', () => {
        const effect = createEffect('fade', { duration: 500 });
        expect(effect?.type).toBe('fade');
        expect(effect?.duration).toBe(500);
      });

      it('should create custom effects', () => {
        const customEffect = defineCustomEffect(
          'test',
          (options = {}) => ({ type: 'test', duration: 300, ...options })
        );
        effectRegistry.register(customEffect);
        
        const effect = createEffect('test', { duration: 600 });
        expect(effect?.type).toBe('test');
        expect(effect?.duration).toBe(600);
      });
    });

    describe('defineCustomEffect', () => {
      it('should create a custom effect definition', () => {
        const effect = defineCustomEffect(
          'bounce',
          (options = {}) => ({ type: 'bounce', ...options }),
          'A bouncy effect',
          { intensity: 0.5 }
        );

        expect(effect.name).toBe('bounce');
        expect(effect.description).toBe('A bouncy effect');
        expect(effect.defaultOptions).toEqual({ intensity: 0.5 });
        expect(effect.create({ duration: 400 })).toEqual({
          type: 'bounce',
          duration: 400
        });
      });
    });

    describe('registerEffects', () => {
      it('should register multiple effects at once', () => {
        const effects = [
          defineCustomEffect('effect1', () => ({ type: 'effect1' })),
          defineCustomEffect('effect2', () => ({ type: 'effect2' }))
        ];

        registerEffects(effects);
        
        expect(effectRegistry.has('effect1')).toBe(true);
        expect(effectRegistry.has('effect2')).toBe(true);
      });
    });

    describe('getBuiltInEffect', () => {
      it('should return built-in effects with custom options', () => {
        const effect = getBuiltInEffect('fade', { duration: 1000 });
        expect(effect.type).toBe('fade');
        expect(effect.duration).toBe(1000);
        expect(effect.easing).toBe('easeInOut');
      });
    });

    describe('validateEffectConfig', () => {
      it('should validate correct effect configurations', () => {
        const validConfig: EffectConfig = {
          type: 'fade',
          duration: 300,
          easing: 'easeInOut',
          delay: 100
        };
        
        expect(validateEffectConfig(validConfig)).toBe(true);
      });

      it('should reject configurations without type', () => {
        const invalidConfig = {
          duration: 300
        } as EffectConfig;
        
        expect(validateEffectConfig(invalidConfig)).toBe(false);
      });

      it('should reject configurations with invalid duration', () => {
        const invalidConfig: EffectConfig = {
          type: 'fade',
          duration: -100
        };
        
        expect(validateEffectConfig(invalidConfig)).toBe(false);
      });

      it('should reject configurations with invalid delay', () => {
        const invalidConfig: EffectConfig = {
          type: 'fade',
          delay: -50
        };
        
        expect(validateEffectConfig(invalidConfig)).toBe(false);
      });

      it('should reject configurations with non-string easing', () => {
        const invalidConfig: EffectConfig = {
          type: 'fade',
          easing: 123 as any
        };
        
        expect(validateEffectConfig(invalidConfig)).toBe(false);
      });
    });
  });

  describe('Integration', () => {
    it('should work with custom effects that have default options', () => {
      const customEffect = defineCustomEffect(
        'pulse',
        (options = {}) => ({
          type: 'pulse',
          duration: 500,
          easing: 'easeInOut',
          options: {
            scale: 1.1,
            ...options
          }
        }),
        'A pulsing effect',
        { intensity: 0.8 }
      );

      effectRegistry.register(customEffect);
      
      const config = effectRegistry.create('pulse', { scale: 1.2 });
      expect(config?.type).toBe('pulse');
      expect(config?.options?.scale).toBe(1.2);
      expect(config?.options?.intensity).toBe(0.8);
    });
  });
});