# Animation System Integration

This document describes how the animation system is integrated with React components in the stage-flow library, specifically covering the implementation of task 7.2.

## Overview

The animation system integration provides seamless connection between the core effect system and React components, with support for:

- **Effect System Connection**: Automatic resolution of stage-specific effects from the engine configuration
- **Animation Disable/Enable**: Global and granular control over animations
- **Proper Cleanup**: Handling of interrupted animations and memory management

## Components

### StageRenderer

The `StageRenderer` component is the primary integration point between the effect system and React components.

#### Enhanced Features

1. **Automatic Effect Resolution**: The renderer automatically resolves effects in the following priority order:
   - Explicit effect override from `effects` prop
   - Stage-specific effect from engine configuration
   - Default effect from `defaultEffect` prop
   - Built-in fade effect (fallback)

2. **Animation Control**: Global animation disable/enable through the `disableAnimations` prop

3. **Cleanup Management**: Proper cleanup of interrupted animations when stages change rapidly

#### Usage Example

```tsx
import { StageRenderer, DEFAULT_EFFECTS } from '@stage-flow/react';

<StageRenderer
  engine={engine}
  effects={{
    welcome: DEFAULT_EFFECTS.fade,
    loading: DEFAULT_EFFECTS.slide,
    default: DEFAULT_EFFECTS.scale // Fallback
  }}
  disableAnimations={false}
  defaultEffect={DEFAULT_EFFECTS.fade}
/>
```

### StageAnimation

The `StageAnimation` component handles the actual animation rendering with Framer Motion integration.

#### Enhanced Features

1. **Animation Lifecycle Callbacks**: Support for `onAnimationStart` and `onAnimationComplete` callbacks
2. **Consistent Behavior**: Callbacks are called even for 'none' effect type for consistency
3. **Proper Integration**: Seamless integration with Framer Motion's AnimatePresence

#### Usage Example

```tsx
import { StageAnimation } from '@stage-flow/react';

<StageAnimation
  effect={effectConfig}
  onAnimationStart={() => console.log('Animation started')}
  onAnimationComplete={() => console.log('Animation completed')}
>
  <YourComponent />
</StageAnimation>
```

## Hooks

### useStageEffect

A new hook that provides reactive access to the current stage's effect configuration.

```tsx
import { useStageEffect } from '@stage-flow/react';

const MyComponent = ({ engine }) => {
  const { effect, isLoading } = useStageEffect(engine, DEFAULT_EFFECTS.fade);
  
  if (isLoading) {
    return <div>Loading effect...</div>;
  }
  
  return <div>Current effect: {effect.type}</div>;
};
```

#### Features

- **Reactive Updates**: Automatically updates when the stage changes
- **Error Handling**: Graceful fallback to default effect on errors
- **Loading States**: Provides loading state during effect resolution

## Engine Integration

### New Methods

The `StageFlowEngine` has been enhanced with methods to access effect configurations:

```typescript
// Get effect for current stage
const currentEffect = engine.getCurrentStageEffect();

// Get effect for specific stage
const stageEffect = engine.getStageEffect('loading');
```

These methods return the effect name as defined in the stage configuration, which is then resolved by the React components using the effect registry.

## Animation Disable/Enable Configuration

### Global Disable

```tsx
<StageRenderer
  engine={engine}
  disableAnimations={true} // Disables all animations
/>
```

### Conditional Disable

```tsx
const [animationsEnabled, setAnimationsEnabled] = useState(true);

<StageRenderer
  engine={engine}
  disableAnimations={!animationsEnabled}
/>
```

### Per-Stage Control

```tsx
const effects = {
  welcome: DEFAULT_EFFECTS.fade,
  loading: { type: 'none' }, // No animation for this stage
  dashboard: DEFAULT_EFFECTS.slide
};

<StageRenderer
  engine={engine}
  effects={effects}
/>
```

## Cleanup for Interrupted Animations

The system handles interrupted animations through several mechanisms:

### 1. Animation Reference Tracking

```tsx
const animationCleanupRef = useRef<(() => void) | null>(null);

useEffect(() => {
  return () => {
    if (animationCleanupRef.current) {
      animationCleanupRef.current();
      animationCleanupRef.current = null;
    }
  };
}, [currentStage]);
```

### 2. Framer Motion Integration

```tsx
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
```

### 3. Lifecycle Management

- **Animation Start**: Sets up cleanup function for the current animation
- **Animation Complete**: Clears cleanup function when animation finishes normally
- **Stage Change**: Triggers cleanup of any ongoing animation before starting new one

## Error Handling

### Effect Resolution Errors

When an effect cannot be resolved, the system:

1. Logs a warning to the console
2. Falls back to the default effect
3. Continues normal operation

```tsx
// Example warning:
// "Effect 'unknown-effect' not found in registry or built-in effects. Using default effect."
```

### Animation Errors

Animation errors are handled gracefully:

- Failed animations don't break the stage flow
- Error boundaries can be used for additional error handling
- Fallback to no animation if critical errors occur

## Performance Considerations

### Memory Management

- Cleanup functions prevent memory leaks from interrupted animations
- Animation references are properly cleared on component unmount
- Effect resolution is cached per stage change

### Optimization

- Effects are resolved only when stages change
- Animation components are keyed by stage for proper React reconciliation
- Framer Motion's `mode="wait"` prevents overlapping animations

## Testing

The animation integration includes comprehensive tests:

### StageRenderer Tests

- Effect resolution priority
- Animation disable/enable functionality
- Cleanup behavior
- Error handling

### StageAnimation Tests

- Lifecycle callback execution
- Effect type handling
- Framer Motion integration

### useStageEffect Tests

- Reactive updates
- Error handling
- Loading states
- Cleanup on unmount

## Migration Guide

### From Previous Version

If you were using the previous version without integrated effects:

```tsx
// Before
<StageRenderer engine={engine} effects={customEffects} />

// After (effects are now automatically resolved from engine)
<StageRenderer engine={engine} />

// Or with overrides
<StageRenderer 
  engine={engine} 
  effects={overrideEffects} // Only needed for overrides
/>
```

### Adding Effects to Existing Stages

```tsx
// Add effects to your stage configuration
const config: StageFlowConfig<MyStage, MyData> = {
  initial: 'start',
  stages: [
    {
      name: 'start',
      effect: 'fade', // Add this line
      transitions: [...]
    }
  ]
};
```

## Best Practices

### 1. Effect Naming

Use descriptive names for custom effects:

```tsx
const customSlideIn = defineCustomEffect(
  'slideInFromRight', // Descriptive name
  (options) => ({ ... })
);
```

### 2. Performance

For performance-critical applications:

```tsx
// Disable animations on slower devices
const shouldDisableAnimations = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<StageRenderer
  engine={engine}
  disableAnimations={shouldDisableAnimations}
/>
```

### 3. Accessibility

Respect user preferences:

```tsx
// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const accessibleEffects = prefersReducedMotion 
  ? { default: { type: 'none' } }
  : normalEffects;
```

### 4. Error Boundaries

Wrap stage renderers in error boundaries:

```tsx
<StageErrorBoundary>
  <StageRenderer engine={engine} />
</StageErrorBoundary>
```

This ensures that animation errors don't crash the entire application.