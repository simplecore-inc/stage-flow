/**
 * Example demonstrating the effect configuration system
 */

import {
  StageFlowEngine,
  StageFlowConfig,
  EffectConfig,
  DEFAULT_EFFECTS,
  effectRegistry,
  createEffect,
  defineCustomEffect,
  getBuiltInEffect,
  BuiltInEffectType
} from '@stage-flow/core';

// Define stage types
type AppStage = 'loading' | 'content' | 'error' | 'success';

// Example 1: Using built-in effects with default settings
const basicConfig: StageFlowConfig<AppStage> = {
  initial: 'loading',
  stages: [
    {
      name: 'loading',
      effect: 'fade', // Uses DEFAULT_EFFECTS.fade
      transitions: [
        { target: 'content', event: 'loaded' },
        { target: 'error', event: 'failed' }
      ]
    },
    {
      name: 'content',
      effect: 'slide', // Uses DEFAULT_EFFECTS.slide
      transitions: [
        { target: 'success', event: 'submit' }
      ]
    },
    {
      name: 'error',
      effect: 'scale', // Uses DEFAULT_EFFECTS.scale
      transitions: [
        { target: 'loading', event: 'retry' }
      ]
    },
    {
      name: 'success',
      effect: 'zoom', // Uses DEFAULT_EFFECTS.zoom
      transitions: []
    }
  ]
};

// Example 2: Using built-in effects with custom options
const customizedConfig: StageFlowConfig<AppStage> = {
  initial: 'loading',
  stages: [
    {
      name: 'loading',
      transitions: [{ target: 'content', event: 'loaded' }]
    },
    {
      name: 'content',
      transitions: []
    }
  ],
  effects: {
    // Custom fade effect with longer duration
    slowFade: getBuiltInEffect('fade', { 
      duration: 800, 
      easing: 'easeInOut',
      delay: 200 
    }),
    
    // Custom slide effect with different direction
    slideFromTop: getBuiltInEffect('slideDown', { 
      duration: 500,
      easing: 'easeOutBack' 
    }),
    
    // Custom scale effect with bounce
    bounceScale: getBuiltInEffect('scale', { 
      duration: 600,
      easing: 'easeOutBounce',
      options: {
        scale: 0.9
      }
    })
  }
};

// Example 3: Creating and registering custom effects
const pulseEffect = defineCustomEffect(
  'pulse',
  (options = {}) => ({
    type: 'pulse',
    duration: 1000,
    easing: 'easeInOut',
    options: {
      scale: 1.05,
      iterations: 2,
      ...options
    }
  }),
  'A pulsing animation effect',
  { intensity: 0.8 }
);

const glowEffect = defineCustomEffect(
  'glow',
  (options = {}) => ({
    type: 'glow',
    duration: 800,
    easing: 'easeInOut',
    options: {
      shadowBlur: 20,
      shadowColor: '#00ff00',
      ...options
    }
  }),
  'A glowing effect with shadow animation'
);

// Register custom effects
effectRegistry.register(pulseEffect);
effectRegistry.register(glowEffect);

// Example 4: Using custom effects in configuration
const advancedConfig: StageFlowConfig<AppStage> = {
  initial: 'loading',
  stages: [
    {
      name: 'loading',
      transitions: [{ target: 'content', event: 'loaded' }]
    },
    {
      name: 'content',
      transitions: [{ target: 'success', event: 'submit' }]
    },
    {
      name: 'success',
      transitions: []
    }
  ],
  effects: {
    // Use custom pulse effect
    customPulse: createEffect('pulse', { 
      scale: 1.1, 
      iterations: 3 
    })!,
    
    // Use custom glow effect
    successGlow: createEffect('glow', { 
      shadowColor: '#00ff00',
      shadowBlur: 30 
    })!,
    
    // Combine built-in with custom options
    fastFade: createEffect('fade', { 
      duration: 150 
    })!
  }
};

// Example 5: Utility functions for working with effects
function demonstrateEffectUtilities() {
  console.log('Available built-in effects:');
  const builtInTypes: BuiltInEffectType[] = [
    'none', 'fade', 'slide', 'slideUp', 'slideDown', 'slideLeft', 'slideRight',
    'scale', 'scaleUp', 'scaleDown', 'flip', 'flipX', 'flipY', 'zoom', 'rotate'
  ];
  
  builtInTypes.forEach(type => {
    const effect = DEFAULT_EFFECTS[type];
    console.log(`- ${type}: ${effect.duration}ms, ${effect.easing}`);
  });

  console.log('\nRegistered custom effects:');
  effectRegistry.getRegistered().forEach(name => {
    const effect = effectRegistry.get(name);
    console.log(`- ${name}: ${effect?.description || 'No description'}`);
  });

  console.log('\nCreating effects dynamically:');
  const dynamicFade = createEffect('fade', { duration: 1000 });
  const dynamicPulse = createEffect('pulse', { scale: 1.2 });
  
  console.log('Dynamic fade:', dynamicFade);
  console.log('Dynamic pulse:', dynamicPulse);
}

// Example 6: Effect validation
function validateEffects() {
  const validEffect: EffectConfig = {
    type: 'fade',
    duration: 300,
    easing: 'easeInOut',
    delay: 100
  };

  const invalidEffect: EffectConfig = {
    type: 'fade',
    duration: -100, // Invalid: negative duration
    easing: 'easeInOut'
  };

  console.log('Valid effect:', validEffect);
  console.log('Invalid effect:', invalidEffect);
}

// Export examples for use in other files
export {
  basicConfig,
  customizedConfig,
  advancedConfig,
  pulseEffect,
  glowEffect,
  demonstrateEffectUtilities,
  validateEffects
};

// Example usage in a React component would look like:
/*
import { StageAnimation } from '@stage-flow/react';
import { createEffect } from '@stage-flow/core';

function MyComponent() {
  const customEffect = createEffect('pulse', { scale: 1.1, iterations: 2 });
  
  return (
    <StageAnimation effect={customEffect}>
      <div>Animated content</div>
    </StageAnimation>
  );
}
*/

// Run examples if this file is executed directly
// Check if we're running directly (not imported)
const isDirectExecution = process.argv[1] && process.argv[1].includes('effect-system-usage.ts');

if (isDirectExecution) {
  (async () => {
    console.log('🎨 Running effects system examples...\n');
    
    console.log('1. Basic effects configuration');
    const basicEngine = new StageFlowEngine(basicConfig);
    await basicEngine.start();
    console.log(`✅ Basic engine with effects started at stage: ${basicEngine.getCurrentStage()}`);
    await basicEngine.stop();
    
    console.log('\n2. Customized effects configuration');
    const customEngine = new StageFlowEngine(customizedConfig);
    await customEngine.start();
    console.log(`✅ Custom engine with modified effects started`);
    await customEngine.stop();
    
    console.log('\n3. Advanced effects configuration');
    const advancedEngine = new StageFlowEngine(advancedConfig);
    await advancedEngine.start();
    console.log(`✅ Advanced engine with custom effects started`);
    await advancedEngine.stop();
    
    console.log('\n4. Effect utilities demonstration');
    demonstrateEffectUtilities();
    
    console.log('\n5. Effect validation');
    validateEffects();
    
    console.log('\n🎉 All effects examples completed!');
  })().catch(console.error);
}