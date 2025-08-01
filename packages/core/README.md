# @stage-flow/core

Framework-agnostic core stage flow engine for building type-safe state machines.

[![npm version](https://img.shields.io/npm/v/@stage-flow/core.svg)](https://www.npmjs.com/package/@stage-flow/core)
[![npm downloads](https://img.shields.io/npm/dm/@stage-flow/core.svg)](https://www.npmjs.com/package/@stage-flow/core)
[![License](https://img.shields.io/npm/l/@stage-flow/core.svg)](https://github.com/simplecore-inc/stage-flow/blob/main/LICENSE)

## Installation

```bash
npm install @stage-flow/core
```

## Quick Start

### Simple Counter Example

```javascript
import { StageFlowEngine } from '@stage-flow/core';

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

// Start the engine first
await counterEngine.start();

// Subscribe to state changes (returns unsubscribe function)
const unsubscribe = counterEngine.subscribe((stage, data) => {
  console.log(`Stage: ${stage}, Count: ${data?.count || 0}`);
});

// Simulate counter behavior
async function runCounter() {
  // Start counting
  await counterEngine.send('start');
  counterEngine.setStageData({ count: 0, maxCount: 10, isRunning: true });
  
  // Count up
  for (let i = 1; i <= 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    if (i === 5) {
      // Pause at 5
      await counterEngine.send('pause');
      counterEngine.setStageData({ count: i, maxCount: 10, isRunning: false });
      console.log('Paused at 5!');
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      // Resume
      await counterEngine.send('resume');
      counterEngine.setStageData({ count: i, maxCount: 10, isRunning: true });
    } else {
      counterEngine.setStageData({ count: i, maxCount: 10, isRunning: true });
    }
  }
  
  // Complete
  await counterEngine.send('complete');
  console.log('Counter completed!');
  
  // Clean up subscription
  unsubscribe();
}

// Run the counter
runCounter();
```

### Form Validation Example

```javascript
import { StageFlowEngine } from '@stage-flow/core';

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

// Start engine and subscribe
await formEngine.start();

const unsubscribe = formEngine.subscribe((stage, data) => {
  console.log(`Form Stage: ${stage}`);
  if (data) {
    console.log('Form Data:', data.form);
    if (Object.keys(data.errors).length > 0) {
      console.log('Errors:', data.errors);
    }
  }
});

// Form validation functions
function validateForm(form) {
  const errors = {};
  
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function submitForm(form) {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate random success/failure
  if (Math.random() > 0.3) {
    console.log('Form submitted successfully!');
  } else {
    throw new Error('Network error occurred');
  }
}

// Form processing function
async function processForm() {
  // Set initial form data
  formEngine.setStageData({
    form: { name: '', email: '' },
    errors: {},
    isSubmitting: false
  });
  
  // Simulate user input
  formEngine.setStageData({
    form: { name: 'John Doe', email: 'john@example.com' },
    errors: {},
    isSubmitting: false
  });
  
  // Validate form
  await formEngine.send('validate');
  
  const currentData = formEngine.getCurrentData();
  if (currentData) {
    const errors = validateForm(currentData.form);
    
    if (Object.keys(errors).length === 0) {
      // Form is valid, proceed to submit
      formEngine.setStageData({ ...currentData, isSubmitting: true });
      await formEngine.send('valid');
      
      try {
        await submitForm(currentData.form);
        await formEngine.send('success');
      } catch (error) {
        formEngine.setStageData({
          ...currentData,
          errors: { submit: error.message },
          isSubmitting: false
        });
        await formEngine.send('error');
      }
    } else {
      // Form has errors
      formEngine.setStageData({ ...currentData, errors });
      await formEngine.send('invalid');
    }
  }
  
  // Clean up
  unsubscribe();
}

// Run form processing
processForm();
```

### Game State Example

```javascript
import { StageFlowEngine } from '@stage-flow/core';

const gameEngine = new StageFlowEngine({
  initial: 'menu',
  stages: [
    {
      name: 'menu',
      transitions: [{ target: 'playing', event: 'startGame' }]
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
      transitions: [{ target: 'menu', event: 'continue' }]
    }
  ]
});

// Start engine and subscribe
await gameEngine.start();

const unsubscribe = gameEngine.subscribe((stage, data) => {
  console.log(`Game Stage: ${stage}`);
  if (data) {
    console.log(`Score: ${data.score}, Level: ${data.level}, Lives: ${data.lives}`);
  }
});

// Game simulation
async function runGame() {
  // Start game
  gameEngine.setStageData({ score: 0, level: 1, lives: 3, highScore: 0 });
  await gameEngine.send('startGame');
  
  // Simulate gameplay
  for (let i = 1; i <= 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const currentData = gameEngine.getCurrentData();
    if (currentData) {
      // Update score
      gameEngine.setStageData({
        ...currentData,
        score: currentData.score + 100,
        level: Math.floor(currentData.score / 500) + 1
      });
      
      console.log(`Score: ${currentData.score + 100}, Level: ${Math.floor((currentData.score + 100) / 500) + 1}`);
      
      // Simulate pause
      if (i === 3) {
        await gameEngine.send('pause');
        console.log('Game paused!');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        await gameEngine.send('resume');
        console.log('Game resumed!');
      }
    }
  }
  
  // Simulate victory
  await gameEngine.send('win');
  console.log('Victory!');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  await gameEngine.send('continue');
  console.log('Back to menu');
  
  // Clean up
  unsubscribe();
}

// Run game
runGame();
```

## API Reference

### StageFlowEngine

The core engine class for managing state transitions.

```javascript
const engine = new StageFlowEngine(config, validationOptions?);
```

#### Configuration

```javascript
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
    }
  ]
};
```

#### Methods

- `start()`: Initialize the engine and set to initial stage
- `stop()`: Stop the engine and clear all timers
- `reset()`: Reset the engine to initial state
- `send(event, data?)`: Send an event to trigger transitions
- `goTo(stage, data?)`: Navigate directly to a stage
- `setStageData(data)`: Update current stage data without changing stage
- `getCurrentStage()`: Get current stage name
- `getCurrentData()`: Get current stage data
- `subscribe(callback)`: Subscribe to state changes (returns unsubscribe function)
- `installPlugin(plugin)`: Install a plugin
- `uninstallPlugin(name)`: Uninstall a plugin
- `addMiddleware(middleware)`: Add middleware
- `removeMiddleware(name)`: Remove middleware

#### State Management

```javascript
// Start the engine first
await engine.start();

// Subscribe to changes (returns unsubscribe function)
const unsubscribe = engine.subscribe((stage, data) => {
  console.log('Stage changed to:', stage);
  console.log('Data:', data);
});

// Update data in current stage
engine.setStageData({
  user: { id: '1', name: 'John' },
  loadingMessage: 'User loaded successfully'
});

// Get current state
console.log(engine.getCurrentStage()); // 'loading'
console.log(engine.getCurrentData()); // { user: { id: '1', name: 'John' }, ... }

// Clean up subscription when done
unsubscribe();
```

#### Error Handling

```javascript
try {
  await engine.send('invalidEvent'); // Throws error if event not allowed
} catch (error) {
  console.error('Invalid transition:', error.message);
}

// Direct navigation with error handling
try {
  await engine.goTo('error', { error: 'Something went wrong' });
} catch (error) {
  console.error('Navigation failed:', error.message);
}
```

## Documentation

- [Getting Started](https://simplecore-inc.github.io/stage-flow/docs/guide/getting-started)
- [Core Concepts](https://simplecore-inc.github.io/stage-flow/docs/guide/core-concepts)
- [API Reference](https://simplecore-inc.github.io/stage-flow/docs/api/core)

## License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2024 SimpleCORE Inc. 