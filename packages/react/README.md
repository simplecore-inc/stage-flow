# @stage-flow/react

React integration for stage flow library with hooks and components.

[![npm version](https://img.shields.io/npm/v/@stage-flow/react.svg)](https://www.npmjs.com/package/@stage-flow/react)
[![npm downloads](https://img.shields.io/npm/dm/@stage-flow/react.svg)](https://www.npmjs.com/package/@stage-flow/react)
[![License](https://img.shields.io/npm/l/@stage-flow/react.svg)](https://github.com/simplecore-inc/stage-flow/blob/main/LICENSE)

## Installation

```bash
npm install @stage-flow/react @stage-flow/core
```

## Quick Start

```tsx
import { StageFlowEngine } from '@stage-flow/core';
import { StageFlowProvider, StageRenderer, useStageFlow } from '@stage-flow/react';

// Define your stages
type AppStages = 'idle' | 'loading' | 'success' | 'error';

// Create engine
const engine = new StageFlowEngine({
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
        { target: 'error', event: 'error' }
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
});

// Stage components
const IdleComponent = () => {
  const { send } = useStageFlow();
  return <button onClick={() => send('start')}>Start</button>;
};

const LoadingComponent = () => {
  const { send } = useStageFlow();
  return <div>Loading... <button onClick={() => send('complete')}>Complete</button></div>;
};

const SuccessComponent = () => {
  const { send } = useStageFlow();
  return <div>Success! <button onClick={() => send('reset')}>Reset</button></div>;
};

const ErrorComponent = () => {
  const { send } = useStageFlow();
  return <div>Error! <button onClick={() => send('retry')}>Retry</button></div>;
};

// Main App component
function App() {
  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        stageComponents={{
          idle: IdleComponent,
          loading: LoadingComponent,
          success: SuccessComponent,
          error: ErrorComponent
        }}
      />
    </StageFlowProvider>
  );
}
```

## API Reference

### StageFlowProvider

React Context Provider that makes the engine available to child components.

```tsx
<StageFlowProvider engine={engine}>
  {/* Your app */}
</StageFlowProvider>
```

### StageRenderer

Component that automatically renders the correct UI component for the current stage.

```tsx
<StageRenderer
  stageComponents={{
    idle: IdleComponent,
    loading: LoadingComponent,
    success: SuccessComponent
  }}
/>
```

### useStageFlow Hook

React hook to access the current stage, data, and send function.

```tsx
const { currentStage, data, send, engine } = useStageFlow();
```

#### Returns

- `currentStage`: Current stage name
- `data`: Current stage data
- `send(event, data?)`: Function to send events
- `engine`: The StageFlowEngine instance

## Documentation

- [React Integration](https://stage-flow.simplecore.dev/docs/react/)
- [Hooks Guide](https://stage-flow.simplecore.dev/docs/react/hooks)
- [Components Guide](https://stage-flow.simplecore.dev/docs/react/components)

## License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2024 SimpleCORE Inc. 