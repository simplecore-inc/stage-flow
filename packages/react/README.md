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

### Simple Counter Example

```tsx
import React, { useEffect } from 'react';
import { StageFlowEngine } from '@stage-flow/core';
import { StageFlowProvider, StageRenderer, useStageFlow } from '@stage-flow/react';

// Create engine
const counterEngine = new StageFlowEngine({
  initial: 'idle',
  stages: [
    {
      name: 'idle',
      transitions: [
        { target: 'counting', event: 'start' },
        { target: 'counting', event: 'reset' }
      ]
    },
    {
      name: 'counting',
      transitions: [
        { target: 'paused', event: 'pause' },
        { target: 'idle', event: 'stop' },
        { target: 'idle', event: 'complete' }
      ]
    },
    {
      name: 'paused',
      transitions: [
        { target: 'counting', event: 'resume' },
        { target: 'idle', event: 'stop' }
      ]
    }
  ]
});

// Stage components receive props directly from StageRenderer
const IdleComponent = ({ currentStage, data, send, goTo, setStageData, isTransitioning }: any) => {
  return (
    <div>
      <h2>Counter - Ready</h2>
      <p>Current Stage: {currentStage}</p>
      <p>Is Transitioning: {isTransitioning ? 'Yes' : 'No'}</p>
      <button onClick={() => send('start')}>Start Counter</button>
      <button onClick={() => send('reset')}>Reset</button>
    </div>
  );
};

const CountingComponent = ({ currentStage, data, send, goTo, setStageData, isTransitioning }: any) => {
  return (
    <div>
      <h2>Counter - Running</h2>
      <p>Current Stage: {currentStage}</p>
      <p>Count: {data?.count || 0}</p>
      <p>Max Count: {data?.maxCount || 10}</p>
      <p>Status: {data?.isRunning ? 'Running' : 'Paused'}</p>
      <p>Is Transitioning: {isTransitioning ? 'Yes' : 'No'}</p>
      <button onClick={() => send('pause')}>Pause</button>
      <button onClick={() => send('stop')}>Stop</button>
      <button onClick={() => send('complete')}>Complete</button>
    </div>
  );
};

const PausedComponent = ({ currentStage, data, send, goTo, setStageData, isTransitioning }: any) => {
  return (
    <div>
      <h2>Counter - Paused</h2>
      <p>Current Stage: {currentStage}</p>
      <p>Count: {data?.count || 0}</p>
      <p>Status: Paused</p>
      <p>Is Transitioning: {isTransitioning ? 'Yes' : 'No'}</p>
      <button onClick={() => send('resume')}>Resume</button>
      <button onClick={() => send('stop')}>Stop</button>
    </div>
  );
};

// Main App component
function App() {
  useEffect(() => {
    // Start the engine when component mounts
    counterEngine.start();
  }, []);

  return (
    <StageFlowProvider engine={counterEngine}>
      <StageRenderer
        stageComponents={{
          idle: IdleComponent,
          counting: CountingComponent,
          paused: PausedComponent
        }}
      />
    </StageFlowProvider>
  );
}

export default App;
```

### Form Validation Example

```tsx
import React, { useState, useEffect } from 'react';
import { StageFlowEngine } from '@stage-flow/core';
import { StageFlowProvider, StageRenderer } from '@stage-flow/react';

const formEngine = new StageFlowEngine({
  initial: 'editing',
  stages: [
    {
      name: 'editing',
      transitions: [{ target: 'validating', event: 'validate' }]
    },
    {
      name: 'validating',
      transitions: [
        { target: 'editing', event: 'invalid' },
        { target: 'submitting', event: 'valid' }
      ]
    },
    {
      name: 'submitting',
      transitions: [
        { target: 'error', event: 'error' },
        { target: 'complete', event: 'success' }
      ]
    },
    {
      name: 'complete',
      transitions: [{ target: 'editing', event: 'reset' }]
    },
    {
      name: 'error',
      transitions: [{ target: 'editing', event: 'retry' }]
    }
  ]
});

// Form validation functions
function validateForm(form: { name: string; email: string }) {
  const errors: Record<string, string> = {};
  
  if (!form.name.trim()) {
    errors.name = 'Name is required';
  }
  
  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(form.email)) {
    errors.email = 'Invalid email format';
  }
  
  return errors;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Stage components receive props directly from StageRenderer
const EditingComponent = ({ currentStage, data, send, goTo, setStageData, isTransitioning }: any) => {
  const [formData, setFormData] = useState({
    name: data?.form?.name || '',
    email: data?.form?.email || ''
  });

  const handleSubmit = async () => {
    setStageData({ form: formData });
    await send('validate');
  };

  return (
    <div>
      <h2>Form - Editing</h2>
      <p>Current Stage: {currentStage}</p>
      <p>Is Transitioning: {isTransitioning ? 'Yes' : 'No'}</p>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <button onClick={handleSubmit}>Validate</button>
    </div>
  );
};

const ValidatingComponent = ({ currentStage, data, send, goTo, setStageData, isTransitioning }: any) => {
  useEffect(() => {
    const validate = async () => {
      const errors = validateForm(data?.form || { name: '', email: '' });
      
      if (Object.keys(errors).length === 0) {
        setStageData({ form: data?.form, errors: {} });
        await send('valid');
      } else {
        setStageData({ form: data?.form, errors });
        await send('invalid');
      }
    };
    
    validate();
  }, []);

  return (
    <div>
      <h2>Form - Validating</h2>
      <p>Current Stage: {currentStage}</p>
      <p>Is Transitioning: {isTransitioning ? 'Yes' : 'No'}</p>
      <p>Validating form data...</p>
    </div>
  );
};

const SubmittingComponent = ({ currentStage, data, send, goTo, setStageData, isTransitioning }: any) => {
  useEffect(() => {
    const submit = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setStageData({ form: data?.form, result: 'success' });
        await send('success');
      } catch (error) {
        setStageData({ form: data?.form, error: error.message });
        await send('error');
      }
    };
    
    submit();
  }, []);

  return (
    <div>
      <h2>Form - Submitting</h2>
      <p>Current Stage: {currentStage}</p>
      <p>Is Transitioning: {isTransitioning ? 'Yes' : 'No'}</p>
      <p>Submitting form data...</p>
    </div>
  );
};

const CompleteComponent = ({ currentStage, data, send, goTo, setStageData, isTransitioning }: any) => {
  return (
    <div>
      <h2>Form - Complete</h2>
      <p>Current Stage: {currentStage}</p>
      <p>Is Transitioning: {isTransitioning ? 'Yes' : 'No'}</p>
      <p>Form submitted successfully!</p>
      <p>Name: {data?.form?.name}</p>
      <p>Email: {data?.form?.email}</p>
      <button onClick={() => send('reset')}>Submit Another</button>
    </div>
  );
};

const ErrorComponent = ({ currentStage, data, send, goTo, setStageData, isTransitioning }: any) => {
  return (
    <div>
      <h2>Form - Error</h2>
      <p>Current Stage: {currentStage}</p>
      <p>Is Transitioning: {isTransitioning ? 'Yes' : 'No'}</p>
      <p>Error: {data?.error}</p>
      <button onClick={() => send('retry')}>Try Again</button>
    </div>
  );
};

// Main App component
function App() {
  useEffect(() => {
    // Start the engine when component mounts
    formEngine.start();
  }, []);

  return (
    <StageFlowProvider engine={formEngine}>
      <StageRenderer
        stageComponents={{
          editing: EditingComponent,
          validating: ValidatingComponent,
          submitting: SubmittingComponent,
          complete: CompleteComponent,
          error: ErrorComponent
        }}
      />
    </StageFlowProvider>
  );
}

export default App;
```

### Game State Example

```tsx
import React, { useEffect } from 'react';
import { StageFlowEngine } from '@stage-flow/core';
import { StageFlowProvider, StageRenderer, useStageFlow } from '@stage-flow/react';

const gameEngine = new StageFlowEngine({
  initial: 'menu',
  stages: [
    {
      name: 'menu',
      transitions: [{ target: 'playing', event: 'start' }]
    },
    {
      name: 'playing',
      transitions: [
        { target: 'paused', event: 'pause' },
        { target: 'gameOver', event: 'lose' },
        { target: 'victory', event: 'win' }
      ]
    },
    {
      name: 'paused',
      transitions: [
        { target: 'playing', event: 'resume' },
        { target: 'menu', event: 'quit' }
      ]
    },
    {
      name: 'gameOver',
      transitions: [{ target: 'menu', event: 'restart' }]
    },
    {
      name: 'victory',
      transitions: [{ target: 'menu', event: 'restart' }]
    }
  ]
});

// Stage components receive props directly from StageRenderer
const MenuComponent = ({ currentStage, data, send, goTo, setStageData, isTransitioning }: any) => {
  return (
    <div>
      <h2>Game - Menu</h2>
      <p>Current Stage: {currentStage}</p>
      <p>Is Transitioning: {isTransitioning ? 'Yes' : 'No'}</p>
      <button onClick={() => send('start')}>Start Game</button>
    </div>
  );
};

const PlayingComponent = ({ currentStage, data, send, goTo, setStageData, isTransitioning }: any) => {
  return (
    <div>
      <h2>Game - Playing</h2>
      <p>Current Stage: {currentStage}</p>
      <p>Score: {data?.score || 0}</p>
      <p>Level: {data?.level || 1}</p>
      <p>Is Transitioning: {isTransitioning ? 'Yes' : 'No'}</p>
      <button onClick={() => send('pause')}>Pause</button>
      <button onClick={() => send('win')}>Win</button>
      <button onClick={() => send('lose')}>Lose</button>
    </div>
  );
};

const PausedComponent = ({ currentStage, data, send, goTo, setStageData, isTransitioning }: any) => {
  return (
    <div>
      <h2>Game - Paused</h2>
      <p>Current Stage: {currentStage}</p>
      <p>Is Transitioning: {isTransitioning ? 'Yes' : 'No'}</p>
      <button onClick={() => send('resume')}>Resume</button>
      <button onClick={() => send('quit')}>Quit to Menu</button>
    </div>
  );
};

const GameOverComponent = ({ currentStage, data, send, goTo, setStageData, isTransitioning }: any) => {
  return (
    <div>
      <h2>Game - Game Over</h2>
      <p>Current Stage: {currentStage}</p>
      <p>Final Score: {data?.score || 0}</p>
      <p>Is Transitioning: {isTransitioning ? 'Yes' : 'No'}</p>
      <button onClick={() => send('restart')}>Play Again</button>
    </div>
  );
};

const VictoryComponent = ({ currentStage, data, send, goTo, setStageData, isTransitioning }: any) => {
  return (
    <div>
      <h2>Game - Victory!</h2>
      <p>Current Stage: {currentStage}</p>
      <p>Final Score: {data?.score || 0}</p>
      <p>Level Completed: {data?.level || 1}</p>
      <p>Is Transitioning: {isTransitioning ? 'Yes' : 'No'}</p>
      <button onClick={() => send('restart')}>Play Again</button>
    </div>
  );
};

// Main App component
function App() {
  useEffect(() => {
    // Start the engine when component mounts
    gameEngine.start();
  }, []);

  return (
    <StageFlowProvider engine={gameEngine}>
      <StageRenderer
        stageComponents={{
          menu: MenuComponent,
          playing: PlayingComponent,
          paused: PausedComponent,
          gameOver: GameOverComponent,
          victory: VictoryComponent
        }}
      />
    </StageFlowProvider>
  );
}

export default App;
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

Component that automatically renders the correct UI component for the current stage. Stage components receive props directly from the renderer.

```tsx
<StageRenderer
  stageComponents={{
    idle: IdleComponent,
    loading: LoadingComponent,
    success: SuccessComponent
  }}
/>

// Stage components receive these props:
const MyStageComponent = ({ 
  currentStage, 
  data, 
  send, 
  goTo, 
  setStageData, 
  isTransitioning 
}: StageComponentProps) => {
  return <div>...</div>;
};
```

### useStageFlow Hook

React hook to access the current stage, data, and engine methods. This is useful when you need to access stage flow functionality outside of stage components.

```tsx
const { 
  currentStage, 
  data, 
  send, 
  goTo,
  setStageData, 
  isTransitioning,
  pauseTimers,
  resumeTimers,
  resetTimers,
  getTimerRemainingTime,
  areTimersPaused,
  engine 
} = useStageFlow();
```

**Note**: When using `StageRenderer`, stage components receive these same props directly, so you don't need to use `useStageFlow` inside stage components.

#### Returns

- `currentStage`: Current stage name
- `data`: Current stage data
- `send(event, data?)`: Function to send events
- `goTo(stage, data?)`: Function to navigate directly to a stage
- `setStageData(data)`: Function to update stage data
- `isTransitioning`: Whether a transition is currently in progress
- `pauseTimers()`: Pause all timers for the current stage
- `resumeTimers()`: Resume all paused timers for the current stage
- `resetTimers()`: Reset all timers for the current stage
- `getTimerRemainingTime()`: Get the remaining time for timers
- `areTimersPaused()`: Check if timers are paused
- `engine`: The StageFlowEngine instance

### useStageData Hook

React hook to access only the current stage data.

```tsx
const data = useStageData(engine);
```

### useStageEffect Hook

React hook to get the current stage's effect configuration.

```tsx
const { effect, isLoading } = useStageEffect(engine, defaultEffect);
```

#### Returns

- `effect`: Current stage effect configuration
- `isLoading`: Whether the effect is loading/resolving

## Documentation

- [React Integration](https://simplecore-inc.github.io/stage-flow/docs/react/)
- [Hooks Guide](https://simplecore-inc.github.io/stage-flow/docs/react/hooks)
- [Components Guide](https://simplecore-inc.github.io/stage-flow/docs/react/components)

## License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2024 SimpleCORE Inc. 