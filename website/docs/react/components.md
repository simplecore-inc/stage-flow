# React Components

Stage Flow provides several React components that make it easy to integrate stage machines into your React applications.

## StageFlowProvider

The main provider component that wraps your application. Think of it as a "context provider" that makes your stage flow engine available to all child components.

**What it does:**
- Provides the stage flow engine to all child components via React Context
- Manages the lifecycle of the engine
- Enables hooks like `useStageFlow` to work throughout your app
- Provides `useStageFlowContext` hook for direct engine access

```tsx
import { StageFlowProvider } from '@stage-flow/react';
import { StageFlowEngine } from '@stage-flow/core';

type AppStage = 'idle' | 'loading' | 'success' | 'error';
type AppData = { email?: string; user?: User; error?: string };

const config = {
  initial: 'idle',
  stages: [
    {
      name: 'idle',
      transitions: [{ target: 'loading', event: 'start' }]
    },
    {
      name: 'loading',
      transitions: [
        { target: 'success', event: 'complete' },
        { target: 'error', event: 'fail' }
      ]
    },
    {
      name: 'success',
      transitions: [{ target: 'idle', event: 'reset' }]
    },
    {
      name: 'error',
      transitions: [{ target: 'idle', event: 'retry' }]
    }
  ]
};

const engine = new StageFlowEngine(config);

function App() {
  return (
    <StageFlowProvider engine={engine}>
      <YourApp />
    </StageFlowProvider>
  );
}
```

## StageRenderer

A component that automatically renders different content based on the current stage. Instead of manually writing conditional rendering with `if/else` statements, StageRenderer handles this for you.

**What it does:**
- Automatically shows the right component for the current stage
- Handles transitions between different views with animation support
- Provides a clean, declarative way to manage UI state
- Supports custom effects, fallback components, and animation control

**Props:**
- `engine`: The StageFlowEngine instance (optional if using context)
- `stageComponents`: Object mapping stage names to component functions
- `effects`: Optional effect configurations to override stage-specific effects
- `disableAnimations`: Whether to disable animations globally
- `defaultEffect`: Default effect to use when no stage-specific effect is defined
- `className`: Custom CSS class name for the container
- `style`: Custom CSS styles for the container

```tsx
import { StageRenderer } from '@stage-flow/react';

function App() {
  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        engine={engine}
        stageComponents={{
          idle: IdleView,
          loading: LoadingView,
          success: SuccessView,
          error: ErrorView
        }}
        disableAnimations={false}
        style={{ minHeight: "400px" }}
      />
    </StageFlowProvider>
  );
}

// Stage components receive specific props
function IdleView({ stage, data, send, goTo, isTransitioning }) {
  return (
    <div>
      <h1>Welcome</h1>
      <button onClick={() => send('start')}>Start</button>
    </div>
  );
}

function LoadingView({ stage, data, send, goTo, isTransitioning }) {
  return (
    <div>
      <h1>Loading...</h1>
      <div className="spinner" />
    </div>
  );
}

function SuccessView({ stage, data, send, goTo, isTransitioning }) {
  return (
    <div>
      <h1>Success!</h1>
      <p>Welcome, {data.user?.name}!</p>
      <button onClick={() => send('reset')}>Reset</button>
    </div>
  );
}

function ErrorView({ stage, data, send, goTo, isTransitioning }) {
  return (
    <div>
      <h1>Error</h1>
      <p>{data.error}</p>
      <button onClick={() => send('retry')}>Try Again</button>
    </div>
  );
}
```

## StageAnimation

A component that provides smooth transitions between stages using Framer Motion. This component wraps your content with animation effects and handles the transition animations automatically.

**What it does:**
- Wraps content with Framer Motion animations
- Supports built-in animation effects (fade, slide, scale, etc.)
- Handles custom animation configurations
- Provides animation lifecycle callbacks
- Supports custom easing and timing functions
- Allows custom CSS classes and styles
- Supports custom animation variants

**Props:**
- `children`: React nodes to animate
- `effect`: Animation effect configuration (optional, defaults to fade)
- `className`: Custom CSS class name (optional)
- `style`: Custom CSS styles (optional)
- `onAnimationStart`: Callback when animation starts (optional)
- `onAnimationComplete`: Callback when animation completes (optional)

**Built-in Animation Effects:**
- `fade`: Simple opacity transition (300ms, easeInOut)
- `slide`: Horizontal slide with opacity (400ms, easeInOut)
- `slideUp`: Vertical slide from bottom (400ms, easeInOut)
- `slideDown`: Vertical slide from top (400ms, easeInOut)
- `slideLeft`: Slide from right to left (400ms, easeInOut)
- `slideRight`: Slide from left to right (400ms, easeInOut)
- `scale`: Scale with opacity (350ms, easeInOut)
- `scaleUp`: Scale up animation (350ms, easeInOut)
- `scaleDown`: Scale down animation (350ms, easeInOut)
- `flip`: 3D flip animation (500ms, easeInOut)
- `flipX`: Flip on X-axis (500ms, easeInOut)
- `flipY`: Flip on Y-axis (500ms, easeInOut)
- `zoom`: Zoom in/out effect (300ms, easeInOut)
- `rotate`: Rotation animation (400ms, easeInOut)
- `none`: No animation (0ms, linear)

**Supported Easing Functions:**
- `linear`: Linear interpolation
- `ease`: Standard ease curve
- `easeIn`: Ease in curve
- `easeOut`: Ease out curve
- `easeInOut`: Ease in-out curve
- `easeInQuad`: Quadratic ease in
- `easeOutQuad`: Quadratic ease out
- `easeInOutQuad`: Quadratic ease in-out
- `easeInCubic`: Cubic ease in
- `easeOutCubic`: Cubic ease out
- `easeInOutCubic`: Cubic ease in-out
- `easeInBack`: Back ease in
- `easeOutBack`: Back ease out
- `easeInOutBack`: Back ease in-out

```tsx
import { StageAnimation } from '@stage-flow/react';

// Basic usage with fade effect
function BasicAnimation() {
  return (
    <StageAnimation effect={{ type: 'fade', duration: 300 }}>
      <div>Animated content</div>
    </StageAnimation>
  );
}

// Advanced usage with custom configuration
function AdvancedAnimation() {
  return (
    <StageAnimation
      effect={{
        type: 'slide',
        duration: 500,
        easing: 'easeInOut',
        delay: 100
      }}
      onAnimationStart={() => console.log('Animation started')}
      onAnimationComplete={() => console.log('Animation completed')}
      className="custom-animation"
      style={{ width: '100%' }}
    >
      <div>Advanced animated content</div>
    </StageAnimation>
  );
}

// Using with StageRenderer for automatic stage transitions
function App() {
  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        engine={engine}
        stageComponents={{
          idle: IdleView,
          loading: LoadingView,
          success: SuccessView,
          error: ErrorView
        }}
        defaultEffect={{ type: 'fade', duration: 300 }}
      />
    </StageFlowProvider>
  );
}

// Custom animation with specific effects for each stage
function CustomStageAnimation() {
  const { currentStage } = useStageFlow<AppStage, AppData>();
  
  const getStageEffect = (stage: AppStage) => {
    switch (stage) {
      case 'idle':
        return { type: 'fade', duration: 200 };
      case 'loading':
        return { type: 'scale', duration: 400 };
      case 'success':
        return { type: 'slideUp', duration: 500, easing: 'easeOut' };
      case 'error':
        return { type: 'slideDown', duration: 300, easing: 'easeIn' };
      default:
        return { type: 'fade', duration: 300 };
    }
  };
  
  return (
    <StageAnimation effect={getStageEffect(currentStage)}>
      <div>Stage-specific animated content</div>
    </StageAnimation>
  );
}

// Animation with custom variants
function CustomVariantsAnimation() {
  const customVariants = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 }
  };
  
  return (
    <StageAnimation
      effect={{
        type: 'custom',
        duration: 400,
        options: { variants: customVariants }
      }}
    >
      <div>Custom variant animation</div>
    </StageAnimation>
  );
}

// Animation with lifecycle callbacks
function AnimationWithCallbacks() {
  const [animationState, setAnimationState] = useState('idle');
  
  return (
    <StageAnimation
      effect={{
        type: 'slide',
        duration: 500,
        easing: 'easeInOutBack'
      }}
      onAnimationStart={() => {
        console.log('Animation started');
        setAnimationState('animating');
      }}
      onAnimationComplete={() => {
        console.log('Animation completed');
        setAnimationState('completed');
      }}
      className="animated-component"
      style={{ 
        width: '100%',
        height: '200px',
        backgroundColor: animationState === 'completed' ? '#4CAF50' : '#2196F3'
      }}
    >
      <div>Animated content with callbacks</div>
    </StageAnimation>
  );
}

// Complex animation with multiple effects
function ComplexAnimation() {
  const [currentEffect, setCurrentEffect] = useState('fade');
  
  const effects = {
    fade: { type: 'fade', duration: 300, easing: 'easeInOut' },
    slide: { type: 'slide', duration: 500, easing: 'easeOutBack' },
    scale: { type: 'scale', duration: 400, easing: 'easeInOutCubic' },
    flip: { type: 'flip', duration: 600, easing: 'easeInOut' }
  };
  
  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setCurrentEffect('fade')}>Fade</button>
        <button onClick={() => setCurrentEffect('slide')}>Slide</button>
        <button onClick={() => setCurrentEffect('scale')}>Scale</button>
        <button onClick={() => setCurrentEffect('flip')}>Flip</button>
      </div>
      
      <StageAnimation
        effect={effects[currentEffect as keyof typeof effects]}
        className="complex-animation"
        style={{
          padding: '20px',
          border: '2px solid #ccc',
          borderRadius: '8px',
          backgroundColor: '#f5f5f5'
        }}
      >
        <h3>Current Effect: {currentEffect}</h3>
        <p>This content animates with different effects based on your selection.</p>
      </StageAnimation>
    </div>
  );
}
```

## StageErrorBoundary

Error boundary component for handling stage machine errors. Just like React's ErrorBoundary, this catches errors in your stage flow and shows a fallback UI.

**What it does:**
- Catches errors that occur during stage transitions and component rendering
- Shows a fallback UI when errors happen
- Prevents your app from crashing due to stage flow errors
- Supports automatic retry, error recovery, and custom fallback components

```tsx
import { StageErrorBoundary } from '@stage-flow/react';

function App() {
  return (
    <StageErrorBoundary
      fallback={(error, errorInfo) => (
        <div>
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      )}
    >
      <StageFlowProvider engine={engine}>
        <YourApp />
      </StageFlowProvider>
    </StageErrorBoundary>
  );
}
```

## Component Composition

You can combine these components to create powerful, animated user interfaces:

```tsx
function AnimatedApp() {
  return (
    <StageErrorBoundary
      fallback={(error) => (
        <div>
          <h1>Error</h1>
          <p>{error.message}</p>
        </div>
      )}
    >
      <StageFlowProvider engine={engine}>
        <StageRenderer
          engine={engine}
          stageComponents={{
            idle: IdleView,
            loading: LoadingView,
            success: SuccessView,
            error: ErrorView
          }}
          defaultEffect={{ type: 'fade', duration: 300 }}
        />
      </StageFlowProvider>
    </StageErrorBoundary>
  );
}
```

## Next Steps

- **[Hooks](./hooks.md)** - Learn about React hooks
- **[Patterns](./patterns.md)** - Discover advanced patterns
- **[Performance](./performance.md)** - Optimize your applications

## Related Guides

- **[Getting Started](/guide/getting-started)** - Set up your first Stage Flow project
- **[Core Concepts](/guide/core-concepts)** - Learn the fundamental concepts
- **[Basic Usage](/guide/basic-usage)** - See basic usage patterns
- **[TypeScript Usage](/guide/typescript-usage)** - Advanced TypeScript features 