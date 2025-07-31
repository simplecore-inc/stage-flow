/**
 * Basic usage example demonstrating core stage flow concepts
 * This example shows how to create a simple stage flow for a user onboarding process
 */

import { StageFlowEngine, StageFlowConfig } from '@stage-flow/core';

// Simple test to check if imports are working
console.log('🔍 Testing imports...');
console.log('StageFlowEngine:', typeof StageFlowEngine);

// Step 1: Define your stage types using TypeScript
// This ensures type safety throughout your application
type OnboardingStage = 'welcome' | 'profile' | 'preferences' | 'complete' | 'error';

// Step 2: Define your data structure
// This represents the data that flows through your stages
interface OnboardingData {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  preferences?: {
    theme: 'light' | 'dark';
    notifications: boolean;
    newsletter: boolean;
  };
  progress?: number;
  errorMessage?: string;
}

// Step 3: Create your stage flow configuration
// This defines the stages, transitions, and initial state
const onboardingConfig: StageFlowConfig<OnboardingStage, OnboardingData> = {
  // Define the starting stage
  initial: 'welcome',
  
  // Define all stages and their possible transitions
  stages: [
    {
      name: 'welcome',
      // Initial data for this stage
      data: { progress: 0 },
      transitions: [
        { target: 'profile', event: 'start' },
        { target: 'error', event: 'error' }
      ]
    },
    {
      name: 'profile',
      data: { progress: 33 },
      transitions: [
        { target: 'preferences', event: 'continue' },
        { target: 'welcome', event: 'back' },
        { target: 'error', event: 'error' }
      ]
    },
    {
      name: 'preferences',
      data: { progress: 66 },
      transitions: [
        { target: 'complete', event: 'finish' },
        { target: 'profile', event: 'back' },
        { target: 'error', event: 'error' }
      ]
    },
    {
      name: 'complete',
      data: { progress: 100 },
      transitions: [
        { target: 'welcome', event: 'restart' }
      ]
    },
    {
      name: 'error',
      transitions: [
        { target: 'welcome', event: 'restart' },
        { target: 'profile', event: 'retry' }
      ]
    }
  ]
};

// Step 4: Create and use the stage flow engine
async function basicUsageExample() {
  // Create the engine with your configuration
  const engine = new StageFlowEngine(onboardingConfig);
  
  // Subscribe to stage changes to react to transitions
  const unsubscribe = engine.subscribe((stage, data) => {
    console.log(`Current stage: ${stage}`);
    console.log(`Progress: ${data?.progress || 0}%`);
    if (data?.user) {
      console.log(`User: ${data.user.name} (${data.user.email})`);
    }
  });
  
  // Start the engine
  await engine.start();
  console.log('✅ Engine started');
  
  // Simulate user interactions
  console.log('\n--- Simulating user onboarding flow ---');
  
  // User starts onboarding
  await engine.send('start');
  
  // User fills out profile
  await engine.send('continue', {
    user: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  });
  
  // User sets preferences
  await engine.send('finish', {
    preferences: {
      theme: 'dark',
      notifications: true,
      newsletter: false
    }
  });
  
  console.log('\n--- Onboarding completed! ---');
  
  // Clean up
  unsubscribe();
  await engine.stop();
}

// Step 5: Error handling example
async function errorHandlingExample() {
  const engine = new StageFlowEngine(onboardingConfig);
  
  await engine.start();
  
  try {
    // This will work - valid transition
    await engine.send('start');
    console.log('✅ Valid transition succeeded');
    
    // This will fail - invalid event for current stage
    await engine.send('finish'); // 'finish' is not valid from 'profile' stage
  } catch (error) {
    console.log('❌ Invalid transition caught:', error.message);
  }
  
  // Recover from error
  await engine.send('error', { errorMessage: 'Invalid action attempted' });
  await engine.send('restart');
  
  await engine.stop();
}

// Step 6: Direct stage navigation example
async function directNavigationExample() {
  const engine = new StageFlowEngine(onboardingConfig);
  
  await engine.start();
  
  // You can also navigate directly to stages (bypassing transition rules)
  // Note: This bypasses the normal transition validation
  try {
    await engine.goTo('preferences', {
      user: { name: 'Jane Doe', email: 'jane@example.com' },
      preferences: { theme: 'light', notifications: false, newsletter: true },
      progress: 66
    });
  } catch (error) {
    console.log('Direct navigation failed (expected):', error.message);
    // Instead, let's use the proper flow
    await engine.send('start');
    await engine.send('continue', {
      user: { name: 'Jane Doe', email: 'jane@example.com' }
    });
  }
  
  console.log(`Direct navigation to: ${engine.getCurrentStage()}`);
  
  await engine.stop();
}

// Step 7: Conditional transitions example
const advancedConfig: StageFlowConfig<OnboardingStage, OnboardingData> = {
  initial: 'welcome',
  stages: [
    {
      name: 'welcome',
      transitions: [
        { target: 'profile', event: 'start' }
      ]
    },
    {
      name: 'profile',
      transitions: [
        {
          target: 'preferences',
          event: 'continue',
          // Only allow transition if user data is complete
          condition: (context) => {
            return !!(context.data?.user?.name && context.data?.user?.email);
          }
        },
        { target: 'error', event: 'continue' } // Fallback if condition fails
      ]
    },
    {
      name: 'preferences',
      transitions: [
        { target: 'complete', event: 'finish' }
      ]
    },
    {
      name: 'complete',
      transitions: []
    },
    {
      name: 'error',
      transitions: [
        { target: 'profile', event: 'retry' }
      ]
    }
  ]
};

async function conditionalTransitionsExample() {
  const engine = new StageFlowEngine(advancedConfig);
  
  await engine.start();
  await engine.send('start');
  
  // This will fail the condition and go to error stage
  await engine.send('continue', { user: { name: '', email: '' } });
  console.log(`After invalid data: ${engine.getCurrentStage()}`); // 'error'
  
  // Retry with valid data
  await engine.send('retry');
  await engine.send('continue', { 
    user: { name: 'John Doe', email: 'john@example.com' } 
  });
  console.log(`After valid data: ${engine.getCurrentStage()}`); // 'preferences'
  
  await engine.stop();
}

// Step 8: Timer-based transitions example
const timerConfig: StageFlowConfig<'splash' | 'main', {}> = {
  initial: 'splash',
  stages: [
    {
      name: 'splash',
      transitions: [
        { target: 'main', duration: 3000 }, // Auto-transition after 3 seconds
        { target: 'main', event: 'skip' }   // Or allow manual skip
      ]
    },
    {
      name: 'main',
      transitions: []
    }
  ]
};

async function timerTransitionsExample() {
  const engine = new StageFlowEngine(timerConfig);
  
  console.log('Starting splash screen...');
  await engine.start();
  
  // Wait for auto-transition or user can skip
  setTimeout(() => {
    console.log(`Auto-transitioned to: ${engine.getCurrentStage()}`);
  }, 3100);
  
  // Clean up after demo
  setTimeout(async () => {
    await engine.stop();
  }, 4000);
}

// Export everything for use in other examples
export {
  onboardingConfig,
  advancedConfig,
  timerConfig,
  basicUsageExample,
  errorHandlingExample,
  directNavigationExample,
  conditionalTransitionsExample,
  timerTransitionsExample,
  OnboardingStage,
  OnboardingData
};

// Quick start guide:
/*
1. Install the package:
   npm install @stage-flow/core

2. Define your stages and data types:
   type MyStages = 'step1' | 'step2' | 'step3';
   interface MyData { value: string; }

3. Create configuration:
   const config: StageFlowConfig<MyStages, MyData> = { ... };

4. Create and start engine:
   const engine = new StageFlowEngine(config);
   await engine.start();

5. React to changes:
   engine.subscribe((stage, data) => {
     console.log('Current stage:', stage);
   });

6. Trigger transitions:
   await engine.send('eventName', { value: 'data' });
   // or
   await engine.goTo('step2', { value: 'data' });

7. Clean up:
   await engine.stop();
*/

// Run examples if this file is executed directly
console.log('🔍 Checking execution context...');

// Check if we're running directly (not imported)
const isDirectExecution = process.argv[1] && process.argv[1].includes('basic-usage.ts');

if (isDirectExecution) {
  console.log('✅ Running in direct execution context');
  (async () => {
    console.log('🚀 Running basic usage examples...\n');
    
    try {
      await basicUsageExample();
      console.log('\n' + '='.repeat(50) + '\n');
      
      await errorHandlingExample();
      console.log('\n' + '='.repeat(50) + '\n');
      
      await directNavigationExample();
      console.log('\n' + '='.repeat(50) + '\n');
      
      await conditionalTransitionsExample();
      console.log('\n' + '='.repeat(50) + '\n');
      
      await timerTransitionsExample();
    } catch (error) {
      console.error('❌ Error running examples:', error);
    }
  })().catch(console.error);
} else {
  console.log('⚠️ Not running directly, skipping examples');
}