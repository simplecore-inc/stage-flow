/**
 * Main entry point for Stage Flow examples
 * This file creates an interactive showcase of all examples
 */

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

// Import all example components
import ReactComponentsExample from './react-components-usage';
import AnimationIntegrationExample from './animation-integration-usage';
import InteractiveDocumentation from './interactive-documentation';

// Example metadata
const examples = [
  {
    id: 'documentation',
    title: '📚 Interactive Documentation',
    description: 'Complete interactive guide to Stage Flow with live examples and code samples.',
    component: InteractiveDocumentation
  },
  {
    id: 'react-components',
    title: '⚛️ React Components',
    description: 'Demonstrates React integration with hooks, components, and error boundaries.',
    component: ReactComponentsExample
  },
  {
    id: 'animation-integration',
    title: '✨ Animation Integration',
    description: 'Shows the animation system with custom effects and Framer Motion integration.',
    component: AnimationIntegrationExample
  }
];

// Code examples that can be run in Node.js
const nodeExamples = [
  {
    id: 'basic-usage',
    title: '🚀 Basic Usage',
    description: 'Core concepts and basic stage flow setup.',
    file: 'basic-usage.ts',
    command: 'npm run example:basic'
  },
  {
    id: 'typescript-usage',
    title: '🔒 TypeScript Usage',
    description: 'Advanced TypeScript patterns and type safety examples.',
    file: 'typescript-usage-examples.ts',
    command: 'npm run example:typescript'
  },
  {
    id: 'plugin-system',
    title: '🔌 Plugin System',
    description: 'Built-in and custom plugins for extending functionality.',
    file: 'plugin-system-usage.ts',
    command: 'npm run example:plugins'
  },
  {
    id: 'middleware',
    title: '⚡ Middleware',
    description: 'Middleware for intercepting and modifying transitions.',
    file: 'middleware-usage.ts',
    command: 'npm run middleware'
  },
  {
    id: 'effects',
    title: '🎨 Effects System',
    description: 'Animation effects and custom effect creation.',
    file: 'effect-system-usage.ts',
    command: 'npm run effects'
  }
];

// Main app component
const ExampleShowcase: React.FC = () => {
  const [activeExample, setActiveExample] = useState<string>('documentation');

  const ActiveComponent = examples.find(ex => ex.id === activeExample)?.component;

  return (
    <div>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem' }}>🌊 Stage Flow Examples</h1>
        <p style={{ margin: '10px 0 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
          Interactive examples and documentation for the Stage Flow library
        </p>
      </header>

      {/* Navigation */}
      <nav style={{
        background: 'white',
        padding: '20px',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="container">
          <div className="example-nav">
            {examples.map(example => (
              <button
                key={example.id}
                onClick={() => setActiveExample(example.id)}
                className={activeExample === example.id ? 'active' : ''}
              >
                {example.title}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Active example */}
      <main>
        {ActiveComponent && <ActiveComponent />}
      </main>

      {/* Node.js examples section */}
      <section style={{
        background: '#f8f9fa',
        padding: '40px 20px',
        borderTop: '1px solid #e0e0e0'
      }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
            🖥️ Node.js Examples
          </h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
            These examples can be run directly in Node.js to explore core concepts
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {nodeExamples.map(example => (
              <div key={example.id} className="example-card">
                <h3>{example.title}</h3>
                <p>{example.description}</p>
                <div style={{
                  background: '#2d3748',
                  color: '#e2e8f0',
                  padding: '10px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  marginTop: '15px'
                }}>
                  {example.command}
                </div>
                <p style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
                  File: <code>{example.file}</code>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting started section */}
      <section style={{
        background: 'white',
        padding: '40px 20px'
      }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
            🚀 Getting Started
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
            marginTop: '30px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h3>1. Install</h3>
              <div style={{
                background: '#2d3748',
                color: '#e2e8f0',
                padding: '15px',
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}>
                npm install @stage-flow/core
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h3>2. Define Stages</h3>
              <div style={{
                background: '#2d3748',
                color: '#e2e8f0',
                padding: '15px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}>
                type MyStages = &apos;start&apos; | &apos;end&apos;;
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h3>3. Create Engine</h3>
              <div style={{
                background: '#2d3748',
                color: '#e2e8f0',
                padding: '15px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}>
                const engine = new StageFlowEngine(config);
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Ready to dive deeper? Check out the interactive documentation above!
            </p>
            <button
              onClick={() => setActiveExample('documentation')}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '25px',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
              }}
            >
              📚 Open Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#2d3748',
        color: 'white',
        padding: '30px 20px',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0 }}>
          Built with ❤️ using Stage Flow • 
          <a 
            href="https://github.com/stage-flow/stage-flow" 
            style={{ color: '#81c784', marginLeft: '10px' }}
          >
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
};

// Render the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<ExampleShowcase />);
} else {
  console.error('Root container not found');
}