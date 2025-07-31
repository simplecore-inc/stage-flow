# Stage Flow Examples

This directory contains comprehensive examples demonstrating all features of the Stage Flow library.

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Run Interactive Examples

```bash
npm run dev
```

This will start a development server with interactive React examples at `http://localhost:3000`.

### Run Node.js Examples

```bash
# Basic usage concepts
npm run example:basic

# TypeScript patterns
npm run example:typescript

# Plugin system
npm run example:plugins

# Middleware usage
npm run example:middleware

# Effects system
npm run example:effects
```

## 📚 Examples Overview

### Interactive React Examples

#### 1. Interactive Documentation (`interactive-documentation.tsx`)
- Complete interactive guide to Stage Flow
- Live code examples with syntax highlighting
- Progressive tutorial with navigation
- Demonstrates all major features

#### 2. React Components Usage (`react-components-usage.tsx`)
- React hooks integration (`useStageFlow`, `useStageData`)
- Stage rendering with `StageRenderer`
- Error boundaries with `StageErrorBoundary`
- Context providers with `StageFlowProvider`

#### 3. Animation Integration (`animation-integration-usage.tsx`)
- Framer Motion integration
- Custom animation effects
- Animation controls and debugging
- Performance optimization techniques

### Node.js Examples

#### 1. Basic Usage (`basic-usage.ts`)
- Core concepts: stages, transitions, data
- Type-safe configuration
- Engine lifecycle management
- Error handling patterns
- Conditional transitions
- Timer-based transitions

#### 2. TypeScript Usage (`typescript-usage-examples.ts`)
- Advanced TypeScript patterns
- Generic utility types
- Type-safe plugin creation
- Builder pattern implementation
- Event system with type safety
- Testing utilities with types

#### 3. Plugin System (`plugin-system-usage.ts`)
- Built-in plugins (Logging, Persistence, Analytics)
- Custom plugin development
- Plugin lifecycle management
- Error handling in plugins
- Plugin dependencies and composition

#### 4. Middleware Usage (`middleware-usage.ts`)
- Built-in middleware functions
- Custom middleware development
- Middleware composition and chaining
- Async middleware with external APIs
- Conditional middleware execution
- State management in middleware

#### 5. Effects System (`effect-system-usage.ts`)
- Built-in animation effects
- Custom effect creation
- Effect registration and management
- Effect validation and utilities
- Integration with React components

## 🛠️ Development

### Project Structure

```
examples/
├── basic-usage.ts                    # Core concepts
├── typescript-usage-examples.ts     # TypeScript patterns
├── plugin-system-usage.ts          # Plugin development
├── middleware-usage.ts              # Middleware patterns
├── effect-system-usage.ts          # Animation effects
├── react-components-usage.tsx      # React integration
├── animation-integration-usage.tsx # Animation system
├── interactive-documentation.tsx   # Interactive guide
├── main.tsx                        # Example showcase app
├── index.html                      # HTML template
├── vite.config.ts                  # Vite configuration
└── package.json                    # Dependencies and scripts
```

### Adding New Examples

1. Create your example file in the `examples/` directory
2. Add appropriate imports for Stage Flow packages
3. Include comprehensive comments and documentation
4. Add the example to `main.tsx` if it's a React component
5. Add a script to `package.json` if it's a Node.js example

### Example Template

```typescript
/**
 * Example: [Your Example Name]
 * Description: [What this example demonstrates]
 */

import { StageFlowEngine, StageFlowConfig } from '@stage-flow/core';

// Define your types
type MyStages = 'stage1' | 'stage2';
interface MyData { /* your data structure */ }

// Create configuration
const config: StageFlowConfig<MyStages, MyData> = {
  initial: 'stage1',
  stages: [
    // ... your stages
  ]
};

// Demonstrate usage
async function exampleFunction() {
  const engine = new StageFlowEngine(config);
  await engine.start();
  
  // ... your example logic
  
  await engine.stop();
}

// Export for use in other examples
export { config, exampleFunction };
```

## 🎯 Learning Path

We recommend exploring the examples in this order:

1. **Basic Usage** - Start here to understand core concepts
2. **TypeScript Usage** - Learn advanced type safety patterns
3. **React Components** - See how to integrate with React
4. **Plugin System** - Extend functionality with plugins
5. **Middleware** - Intercept and modify transitions
6. **Effects System** - Add animations and visual effects
7. **Animation Integration** - Advanced animation patterns
8. **Interactive Documentation** - Complete reference guide

## 🔧 Troubleshooting

### Common Issues

#### TypeScript Errors
- Ensure you're using the correct stage and data types
- Check that all required properties are provided
- Verify import paths are correct

#### React Integration Issues
- Make sure to wrap components with `StageFlowProvider`
- Check that the engine is properly started
- Verify hook usage is within React components

#### Animation Problems
- Ensure Framer Motion is installed for React examples
- Check that effects are properly configured
- Verify animation cleanup on rapid transitions

### Getting Help

- Check the interactive documentation for detailed explanations
- Review the TypeScript examples for type safety patterns
- Look at the plugin and middleware examples for extensibility patterns

## 📦 Package Dependencies

The examples use the following Stage Flow packages:

- `@stage-flow/core` - Core engine and types
- `@stage-flow/react` - React integration
- `@stage-flow/plugins` - Built-in plugins
- `@stage-flow/testing` - Testing utilities

## 🚀 Next Steps

After exploring these examples:

1. Try building your own stage flow for a real use case
2. Create custom plugins for your specific needs
3. Experiment with different animation effects
4. Integrate Stage Flow into an existing React application
5. Write tests for your stage flows using the testing utilities

Happy coding with Stage Flow! 🌊