/**
 * Interactive documentation example with live demos
 * This example creates a comprehensive interactive guide for the stage-flow library
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StageFlowEngine,
  StageFlowConfig,
  DEFAULT_EFFECTS
} from '@stage-flow/core';
import {
  StageFlowProvider,
  StageRenderer,
  useStageFlow,
  StageErrorBoundary
} from '@stage-flow/react';
import {
  LoggingPlugin,
  PersistencePlugin,
  AnalyticsPlugin,
  LogLevel
} from '@stage-flow/plugins';

// Documentation sections
type DocSection = 
  | 'introduction'
  | 'basic-concepts'
  | 'type-safety'
  | 'plugins'
  | 'middleware'
  | 'react-integration'
  | 'effects'
  | 'testing'
  | 'advanced';

interface DocData {
  currentExample?: string;
  codeVisible?: boolean;
  liveDemo?: boolean;
  userProgress?: number;
}

// Main documentation configuration
const docConfig: StageFlowConfig<DocSection, DocData> = {
  initial: 'introduction',
  stages: [
    {
      name: 'introduction',
      data: { userProgress: 0 },
      transitions: [
        { target: 'basic-concepts', event: 'next' }
      ]
    },
    {
      name: 'basic-concepts',
      data: { userProgress: 12.5 },
      transitions: [
        { target: 'type-safety', event: 'next' },
        { target: 'introduction', event: 'back' }
      ]
    },
    {
      name: 'type-safety',
      data: { userProgress: 25 },
      transitions: [
        { target: 'plugins', event: 'next' },
        { target: 'basic-concepts', event: 'back' }
      ]
    },
    {
      name: 'plugins',
      data: { userProgress: 37.5 },
      transitions: [
        { target: 'middleware', event: 'next' },
        { target: 'type-safety', event: 'back' }
      ]
    },
    {
      name: 'middleware',
      data: { userProgress: 50 },
      transitions: [
        { target: 'react-integration', event: 'next' },
        { target: 'plugins', event: 'back' }
      ]
    },
    {
      name: 'react-integration',
      data: { userProgress: 62.5 },
      transitions: [
        { target: 'effects', event: 'next' },
        { target: 'middleware', event: 'back' }
      ]
    },
    {
      name: 'effects',
      data: { userProgress: 75 },
      transitions: [
        { target: 'testing', event: 'next' },
        { target: 'react-integration', event: 'back' }
      ]
    },
    {
      name: 'testing',
      data: { userProgress: 87.5 },
      transitions: [
        { target: 'advanced', event: 'next' },
        { target: 'effects', event: 'back' }
      ]
    },
    {
      name: 'advanced',
      data: { userProgress: 100 },
      transitions: [
        { target: 'testing', event: 'back' },
        { target: 'introduction', event: 'restart' }
      ]
    }
  ],
  plugins: [
    new LoggingPlugin({ level: LogLevel.INFO }),
    new PersistencePlugin({ 
      key: 'stage-flow-docs-progress',
      storage: 'localStorage'
    })
  ]
};

// Code examples for each section
const codeExamples = {
  introduction: `// Welcome to Stage Flow!
// A type-safe, plugin-based stage management library

import { StageFlowEngine, StageFlowConfig } from '@stage-flow/core';

type MyStages = 'start' | 'middle' | 'end';
interface MyData { message: string; }

const config: StageFlowConfig<MyStages, MyData> = {
  initial: 'start',
  stages: [
    {
      name: 'start',
      transitions: [{ target: 'middle', event: 'next' }]
    },
    // ... more stages
  ]
};

const engine = new StageFlowEngine(config);
await engine.start();`,

  'basic-concepts': `// Core Concepts: Stages, Transitions, and Data

// 1. Stages: Define the states of your application
type AppStage = 'loading' | 'ready' | 'error';

// 2. Data: Type-safe data that flows between stages
interface AppData {
  user?: { name: string; email: string; };
  error?: string;
}

// 3. Transitions: Define how stages connect
const config: StageFlowConfig<AppStage, AppData> = {
  initial: 'loading',
  stages: [
    {
      name: 'loading',
      transitions: [
        { target: 'ready', event: 'loaded' },
        { target: 'error', event: 'failed' }
      ]
    }
  ]
};`,

  'type-safety': `// TypeScript Integration: Full Type Safety

// Define your types
type UserFlowStage = 'login' | 'dashboard' | 'profile';

interface UserData {
  id: string;
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

// TypeScript will catch errors like:
const config: StageFlowConfig<UserFlowStage, UserData> = {
  initial: 'login',
  stages: [
    {
      name: 'login',
      transitions: [
        { target: 'dashboard', event: 'loginSuccess' }
        // { target: 'invalid', event: 'test' } // ❌ TypeScript error!
      ]
    }
  ]
};

// Type-safe engine usage
const engine = new StageFlowEngine(config);
// engine.send('invalidEvent'); // ❌ TypeScript error!
await engine.send('loginSuccess', { 
  id: '123', 
  name: 'John',
  email: 'john@example.com',
  preferences: { theme: 'dark', notifications: true }
});`,

  plugins: `// Plugin System: Extend functionality

import { LoggingPlugin, PersistencePlugin } from '@stage-flow/plugins';

const config: StageFlowConfig<MyStages, MyData> = {
  initial: 'start',
  stages: [/* ... */],
  plugins: [
    // Built-in logging plugin
    new LoggingPlugin({
      level: 'info',
      includeData: true
    }),
    
    // Built-in persistence plugin
    new PersistencePlugin({
      storage: 'localStorage',
      key: 'my-app-state'
    }),
    
    // Custom plugin
    {
      name: 'analytics',
      async install(engine) {
        console.log('Analytics plugin installed');
      },
      hooks: {
        afterTransition: async (context) => {
          // Track stage transitions
          analytics.track('stage_change', {
            from: context.from,
            to: context.to
          });
        }
      }
    }
  ]
};`,

  middleware: `// Middleware: Intercept and modify transitions

import { createLoggingMiddleware, createValidationMiddleware } from '@stage-flow/core';

const config: StageFlowConfig<MyStages, MyData> = {
  initial: 'start',
  stages: [/* ... */],
  middleware: [
    // Built-in middleware
    createLoggingMiddleware({ level: 'debug' }),
    
    // Custom middleware
    {
      name: 'validation',
      async execute(context, next) {
        // Validate data before transition
        if (context.to === 'submit' && !context.data?.email) {
          context.cancel(); // Stop the transition
          return;
        }
        
        // Modify data during transition
        context.modify({
          data: {
            ...context.data,
            timestamp: Date.now()
          }
        });
        
        await next(); // Continue to next middleware
      }
    }
  ]
};`,

  'react-integration': `// React Integration: Hooks and Components

import React from 'react';
import { 
  StageFlowProvider, 
  StageRenderer, 
  useStageFlow 
} from '@stage-flow/react';

function MyApp() {
  const [engine] = useState(() => new StageFlowEngine(config));
  
  return (
    <StageFlowProvider engine={engine}>
      <StageRenderer
        engine={engine}
        stageComponents={{
          loading: LoadingComponent,
          ready: ReadyComponent,
          error: ErrorComponent
        }}
        effects={{
          loading: DEFAULT_EFFECTS.fade,
          ready: DEFAULT_EFFECTS.slide
        }}
      />
    </StageFlowProvider>
  );
}

function LoadingComponent() {
  const { currentStage, data, send } = useStageFlow(engine);
  
  return (
    <div>
      <h2>Loading...</h2>
      <button onClick={() => send('loaded')}>
        Continue
      </button>
    </div>
  );
}`,

  effects: `// Effects System: Smooth animations

import { DEFAULT_EFFECTS, createEffect } from '@stage-flow/core';

const config: StageFlowConfig<MyStages, MyData> = {
  initial: 'start',
  stages: [
    {
      name: 'start',
      effect: 'fade', // Built-in effect
      transitions: [{ target: 'middle', event: 'next' }]
    }
  ],
  effects: {
    // Custom effects
    slowFade: createEffect('fade', { duration: 1000 }),
    bounceIn: createEffect('scale', { 
      duration: 600,
      easing: 'easeOutBounce' 
    }),
    
    // Custom effect definition
    customSlide: {
      type: 'slide',
      duration: 400,
      easing: 'easeInOut',
      options: { direction: 'up' }
    }
  }
};

// In React components
<StageRenderer
  engine={engine}
  effects={{
    start: DEFAULT_EFFECTS.fade,
    middle: DEFAULT_EFFECTS.slide,
    end: DEFAULT_EFFECTS.scale
  }}
  disableAnimations={false}
/>`,

  testing: `// Testing Utilities: Test your flows

import { StageFlowTestEngine, renderStageFlow } from '@stage-flow/testing';

describe('User Flow', () => {
  test('should complete onboarding flow', async () => {
    const testEngine = StageFlowTestEngine.create(config);
    
    // Test stage transitions
    await testEngine.send('start');
    expect(testEngine.getCurrentStage()).toBe('onboarding');
    
    // Test with data
    await testEngine.send('complete', { 
      user: { name: 'Test User' } 
    });
    expect(testEngine.getCurrentStage()).toBe('dashboard');
    
    // Test state inspection
    const state = testEngine.getState();
    expect(state.data.user.name).toBe('Test User');
  });
  
  test('React component integration', () => {
    const { engine, getByText } = renderStageFlow(config);
    
    fireEvent.click(getByText('Start'));
    expect(engine.getCurrentStage()).toBe('started');
  });
});`,

  advanced: `// Advanced Features: Custom implementations

// 1. Custom Plugin with Dependencies
class AdvancedPlugin implements Plugin<MyStages, MyData> {
  name = 'advanced';
  dependencies = ['logging']; // Require other plugins
  
  async install(engine) {
    // Complex initialization
    await this.setupDatabase();
    await this.configureAnalytics();
  }
  
  hooks = {
    beforeTransition: async (context) => {
      // Advanced logic
      await this.validateBusinessRules(context);
    }
  };
}

// 2. Middleware Composition
const composedMiddleware = composeMiddleware([
  authMiddleware,
  validationMiddleware,
  loggingMiddleware
]);

// 3. Dynamic Stage Configuration
const dynamicConfig = await buildConfigFromAPI();
const engine = new StageFlowEngine(dynamicConfig);

// 4. Error Recovery
const config: StageFlowConfig<MyStages, MyData> = {
  // ... stages
  errorRecovery: {
    retryAttempts: 3,
    retryDelay: 1000,
    fallbackStage: 'error'
  }
};`
};

// Live demo components for each section
const LiveDemoComponent: React.FC<{ section: DocSection }> = ({ section }) => {
  const [demoEngine, setDemoEngine] = useState<StageFlowEngine<any, any> | null>(null);
  const [demoStage, setDemoStage] = useState<string>('');

  useEffect(() => {
    if (section === 'basic-concepts') {
      const demoConfig: StageFlowConfig<'demo1' | 'demo2' | 'demo3', { count: number }> = {
        initial: 'demo1',
        stages: [
          {
            name: 'demo1',
            data: { count: 1 },
            transitions: [{ target: 'demo2', event: 'next' }]
          },
          {
            name: 'demo2',
            data: { count: 2 },
            transitions: [
              { target: 'demo3', event: 'next' },
              { target: 'demo1', event: 'back' }
            ]
          },
          {
            name: 'demo3',
            data: { count: 3 },
            transitions: [
              { target: 'demo1', event: 'restart' },
              { target: 'demo2', event: 'back' }
            ]
          }
        ]
      };

      const engine = new StageFlowEngine(demoConfig);
      engine.subscribe((stage) => setDemoStage(stage));
      engine.start();
      setDemoEngine(engine);

      return () => {
        engine.stop();
      };
    }
  }, [section]);

  if (section === 'basic-concepts' && demoEngine) {
    return (
      <div style={{ 
        padding: '20px', 
        border: '2px solid #007bff', 
        borderRadius: '8px',
        backgroundColor: '#f8f9fa'
      }}>
        <h4>🎮 Live Demo: Basic Stage Flow</h4>
        <p><strong>Current Stage:</strong> {demoStage}</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button 
            onClick={() => demoEngine.send('next')}
            disabled={demoStage === 'demo3'}
          >
            Next Stage
          </button>
          <button 
            onClick={() => demoEngine.send('back')}
            disabled={demoStage === 'demo1'}
          >
            Previous Stage
          </button>
          <button onClick={() => demoEngine.send('restart')}>
            Restart
          </button>
        </div>
      </div>
    );
  }

  return null;
};

// Code display component
const CodeDisplay: React.FC<{ code: string; visible: boolean }> = ({ code, visible }) => {
  if (!visible) return null;

  return (
    <pre style={{
      backgroundColor: '#2d3748',
      color: '#e2e8f0',
      padding: '20px',
      borderRadius: '8px',
      overflow: 'auto',
      fontSize: '14px',
      lineHeight: '1.5'
    }}>
      <code>{code}</code>
    </pre>
  );
};

// Progress bar component
const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <div style={{
    width: '100%',
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '20px'
  }}>
    <div
      style={{
        width: `${progress}%`,
        height: '100%',
        backgroundColor: '#007bff',
        transition: 'width 0.3s ease'
      }}
    />
  </div>
);

// Navigation component
const Navigation: React.FC<{ 
  currentSection: DocSection; 
  onNavigate: (section: DocSection) => void;
}> = ({ currentSection, onNavigate }) => {
  const sections = [
    { key: 'introduction', label: 'Introduction' },
    { key: 'basic-concepts', label: 'Basic Concepts' },
    { key: 'type-safety', label: 'Type Safety' },
    { key: 'plugins', label: 'Plugins' },
    { key: 'middleware', label: 'Middleware' },
    { key: 'react-integration', label: 'React Integration' },
    { key: 'effects', label: 'Effects' },
    { key: 'testing', label: 'Testing' },
    { key: 'advanced', label: 'Advanced' }
  ];

  return (
    <nav style={{
      position: 'fixed',
      left: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      minWidth: '200px'
    }}>
      <h3 style={{ marginTop: 0 }}>Documentation</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {sections.map(section => (
          <li key={section.key} style={{ marginBottom: '8px' }}>
            <button
              onClick={() => onNavigate(section.key as DocSection)}
              style={{
                background: currentSection === section.key ? '#007bff' : 'transparent',
                color: currentSection === section.key ? 'white' : '#333',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// Main documentation content component
const DocumentationContent: React.FC<{ section: DocSection; data?: DocData }> = ({ section, data }) => {
  const [showCode, setShowCode] = useState(false);

  const content = {
    introduction: {
      title: '🚀 Welcome to Stage Flow',
      description: 'A powerful, type-safe stage management library for React applications.',
      details: `Stage Flow helps you manage complex application states with ease. 
      Whether you're building user onboarding flows, multi-step forms, or game states, 
      Stage Flow provides the tools you need with full TypeScript support.`
    },
    'basic-concepts': {
      title: '📚 Basic Concepts',
      description: 'Learn the fundamental concepts: Stages, Transitions, and Data.',
      details: `Every Stage Flow consists of three main parts:
      • Stages: The different states your application can be in
      • Transitions: How you move between stages
      • Data: The information that flows through your stages`
    },
    'type-safety': {
      title: '🔒 Type Safety',
      description: 'Full TypeScript integration for bulletproof applications.',
      details: `Stage Flow is built with TypeScript from the ground up. 
      Define your stage types and data structures once, and get complete type safety 
      throughout your application.`
    },
    plugins: {
      title: '🔌 Plugin System',
      description: 'Extend functionality with powerful plugins.',
      details: `Plugins allow you to add cross-cutting concerns like logging, 
      persistence, and analytics. Use built-in plugins or create your own.`
    },
    middleware: {
      title: '⚡ Middleware',
      description: 'Intercept and modify stage transitions.',
      details: `Middleware runs during stage transitions, allowing you to validate data, 
      log events, or modify the transition behavior.`
    },
    'react-integration': {
      title: '⚛️ React Integration',
      description: 'Seamless React hooks and components.',
      details: `Stage Flow provides React hooks and components for easy integration. 
      Use useStageFlow for state management and StageRenderer for automatic rendering.`
    },
    effects: {
      title: '✨ Effects System',
      description: 'Beautiful animations between stages.',
      details: `Add smooth transitions between stages with the built-in effects system. 
      Choose from predefined effects or create your own.`
    },
    testing: {
      title: '🧪 Testing',
      description: 'Comprehensive testing utilities.',
      details: `Stage Flow includes testing utilities to help you test your flows. 
      Mock transitions, inspect state, and test React components.`
    },
    advanced: {
      title: '🎯 Advanced Features',
      description: 'Advanced patterns and customizations.',
      details: `Explore advanced features like custom plugins, middleware composition, 
      error recovery, and dynamic configuration.`
    }
  };

  const sectionContent = content[section];

  return (
    <div style={{ marginLeft: '260px', padding: '40px', maxWidth: '800px' }}>
      <h1>{sectionContent.title}</h1>
      <p style={{ fontSize: '18px', color: '#666' }}>{sectionContent.description}</p>
      <p style={{ lineHeight: '1.6' }}>{sectionContent.details}</p>
      
      <div style={{ margin: '30px 0' }}>
        <button
          onClick={() => setShowCode(!showCode)}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {showCode ? 'Hide Code' : 'Show Code'}
        </button>
      </div>

      <CodeDisplay code={codeExamples[section]} visible={showCode} />
      
      <LiveDemoComponent section={section} />
    </div>
  );
};

// Main interactive documentation component
export const InteractiveDocumentation: React.FC = () => {
  const [engine] = useState(() => new StageFlowEngine(docConfig));
  const { currentStage, data, send } = useStageFlow(engine);

  useEffect(() => {
    engine.start();
    return () => {
      engine.stop();
    };
  }, [engine]);

  const handleNavigate = (section: DocSection) => {
    engine.goTo(section);
  };

  const handleNext = () => {
    send('next');
  };

  const handleBack = () => {
    send('back');
  };

  return (
    <StageFlowProvider engine={engine}>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <ProgressBar progress={data?.userProgress || 0} />
        
        <Navigation 
          currentSection={currentStage} 
          onNavigate={handleNavigate}
        />
        
        <StageErrorBoundary>
          <DocumentationContent section={currentStage} data={data} />
        </StageErrorBoundary>
        
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={handleBack}
            disabled={currentStage === 'introduction'}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: currentStage === 'introduction' ? 0.5 : 1
            }}
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentStage === 'advanced'}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: currentStage === 'advanced' ? 0.5 : 1
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </StageFlowProvider>
  );
};

export default InteractiveDocumentation;