# Effect Configuration System

The effect configuration system provides a flexible and extensible way to define animations and visual effects for stage transitions in the stage-flow library.

## Overview

The effect system consists of:
- **Built-in effects**: Pre-defined effects with sensible defaults
- **Custom effects**: User-defined effects that can be registered and reused
- **Effect registry**: Central management system for all effects
- **Framer Motion integration**: Seamless integration with React animations

## Built-in Effects

The library provides 15 built-in effect types with optimized defaults:

### Basic Effects
- `none` - No animation (0ms)
- `fade` - Opacity transition (300ms)

### Slide Effects
- `slide` - Horizontal slide from right (400ms)
- `slideUp` - Vertical slide from bottom (400ms)
- `slideDown` - Vertical slide from top (400ms)
- `slideLeft` - Horizontal slide from right (400ms)
- `slideRight` - Horizontal slide from left (400ms)

### Scale Effects
- `scale` - Scale from 80% to 100% (350ms)
- `scaleUp` - Scale from 120% to 100% (350ms)
- `scaleDown` - Scale from 80% to 100% (350ms)

### Rotation Effects
- `flip` - Y-axis rotation (500ms)
- `flipX` - X-axis rotation (500ms)
- `flipY` - Y-axis rotation (500ms)
- `rotate` - Z-axis rotation (400ms)

### Special Effects
- `zoom` - Scale with slight zoom effect (300ms)

## Usage

### Basic Usage

```typescript
import { StageFlowConfig, DEFAULT_EFFECTS } from '@stage-flow/core';

const config: StageFlowConfig<'loading' | 'content'> = {
  initial: 'loading',
  stages: [
    {
      name: 'loading',
      effect: 'fade', // Uses DEFAULT_EFFECTS.fade
      transitions: [{ target: 'content', event: 'loaded' }]
    },
    {
      name: 'content',
      effect: 'slide', // Uses DEFAULT_EFFECTS.slide
      transitions: []
    }
  ]
};
```

### Custom Effect Options

```typescript
import { getBuiltInEffect } from '@stage-flow/core';

const config: StageFlowConfig<'loading' | 'content'> = {
  initial: 'loading',
  stages: [
    {
      name: 'loading',
      transitions: [{ target: 'content', event: 'loaded' }]
    }
  ],
  effects: {
    slowFade: getBuiltInEffect('fade', {
      duration: 800,
      delay: 200,
      easing: 'easeInOut'
    }),
    fastSlide: getBuiltInEffect('slide', {
      duration: 200,
      easing: 'easeOut'
    })
  }
};
```

### Creating Custom Effects

```typescript
import { defineCustomEffect, effectRegistry } from '@stage-flow/core';

// Define a custom effect
const bounceEffect = defineCustomEffect(
  'bounce',
  (options = {}) => ({
    type: 'bounce',
    duration: 600,
    easing: 'easeOutBounce',
    options: {
      intensity: 0.8,
      ...options
    }
  }),
  'A bouncing animation effect',
  { intensity: 0.5 } // Default options
);

// Register the effect
effectRegistry.register(bounceEffect);

// Use in configuration
const effect = createEffect('bounce', { intensity: 1.0 });
```

## Effect Configuration Interface

```typescript
interface EffectConfig {
  type: string;           // Effect type identifier
  duration?: number;      // Duration in milliseconds
  easing?: string;        // Easing function name
  delay?: number;         // Delay before effect starts (ms)
  options?: Record<string, unknown>; // Effect-specific options
}
```

## Supported Easing Functions

The system supports various easing functions compatible with Framer Motion:

- `linear`
- `ease`, `easeIn`, `easeOut`, `easeInOut`
- `easeInQuad`, `easeOutQuad`, `easeInOutQuad`
- `easeInCubic`, `easeOutCubic`, `easeInOutCubic`
- `easeInBack`, `easeOutBack`, `easeInOutBack`

## React Integration

### Using with StageAnimation Component

```tsx
import { StageAnimation } from '@stage-flow/react';
import { createEffect } from '@stage-flow/core';

function MyComponent() {
  const customEffect = createEffect('fade', { 
    duration: 500,
    delay: 100 
  });

  return (
    <StageAnimation effect={customEffect}>
      <div>Animated content</div>
    </StageAnimation>
  );
}
```

### Custom Effects with Framer Motion Variants

```typescript
const customEffect = {
  type: 'customBounce',
  duration: 400,
  easing: 'easeInOut',
  options: {
    variants: {
      initial: { scale: 0.5, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.5, opacity: 0 }
    }
  }
};
```

## API Reference

### Functions

#### `createEffect(name: string, options?: Record<string, unknown>): EffectConfig | undefined`
Creates an effect configuration for a built-in or registered custom effect.

#### `getBuiltInEffect(type: BuiltInEffectType, options?: Record<string, unknown>): EffectConfig`
Creates a built-in effect with custom options.

#### `defineCustomEffect(name, factory, description?, defaultOptions?): CustomEffectDefinition`
Defines a custom effect that can be registered.

#### `validateEffectConfig(config: EffectConfig): boolean`
Validates an effect configuration object.

### Effect Registry

#### `effectRegistry.register(effect: CustomEffectDefinition): void`
Registers a custom effect.

#### `effectRegistry.unregister(name: string): void`
Unregisters a custom effect.

#### `effectRegistry.has(name: string): boolean`
Checks if an effect is available.

#### `effectRegistry.create(name: string, options?): EffectConfig | undefined`
Creates an effect configuration.

## Best Practices

1. **Use built-in effects** when possible for consistency
2. **Customize duration and easing** to match your design system
3. **Register custom effects** once at application startup
4. **Validate effect configurations** in development mode
5. **Use meaningful names** for custom effects
6. **Provide default options** for custom effects
7. **Test animations** across different devices and browsers

## Performance Considerations

- Effects with shorter durations perform better
- Avoid complex custom variants for frequently used transitions
- Use `none` effect type to disable animations when needed
- Consider reduced motion preferences in your implementations

## Migration from Previous Versions

If migrating from a previous version:

1. Replace direct Framer Motion variant definitions with effect configurations
2. Use `getBuiltInEffect()` instead of hardcoded effect objects
3. Register custom effects using the effect registry
4. Update component props to use the new `EffectConfig` interface

## Troubleshooting

### Common Issues

1. **Effect not found**: Ensure custom effects are registered before use
2. **Animation not working**: Check that effect type is supported by StageAnimation
3. **TypeScript errors**: Ensure proper imports from `@stage-flow/core`
4. **Performance issues**: Reduce animation duration or complexity

### Debug Mode

Enable debug logging to troubleshoot effect issues:

```typescript
// Check available effects
console.log('Built-in effects:', Object.keys(DEFAULT_EFFECTS));
console.log('Custom effects:', effectRegistry.getRegistered());

// Validate effect configuration
const isValid = validateEffectConfig(myEffect);
console.log('Effect valid:', isValid);
```