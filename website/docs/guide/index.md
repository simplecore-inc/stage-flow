# What is Stage Flow?

Stage Flow is a powerful, type-safe stage management library designed specifically for React applications. It provides a robust foundation for building complex state machines with advanced features like plugins, middleware, and comprehensive testing utilities.

## Key Features

### 🚀 **Type-Safe by Design**
- Full TypeScript support with advanced type inference
- Compile-time safety for stage transitions and data flow
- Intuitive type definitions that adapt to your use cases

### ⚡ **High Performance**
- Optimized for React with minimal re-renders
- Efficient state updates and memory management
- Built-in performance monitoring and optimization

### 🔌 **Extensible Plugin System**
- Logging, persistence, and analytics plugins
- Custom plugin development with type safety
- Plugin composition and middleware support

### 🎯 **Powerful Middleware**
- Authentication, validation, and data transformation
- Custom middleware development
- Middleware composition and chaining

### 🎨 **Seamless React Integration**
- React hooks for easy integration
- Components for rendering and error handling
- Automatic state synchronization

### 🧪 **Comprehensive Testing**
- Unit, integration, and performance testing utilities
- Mock engines and test helpers
- React testing support with custom hooks

## Quick Start

Install Stage Flow:

```bash
npm install @stage-flow/core @stage-flow/react
```

Create your first stage machine:

```tsx
import { StageFlowEngine } from '@stage-flow/core';
import { StageFlowProvider, useStageFlow } from '@stage-flow/react';

// Define your stages and data types
type AppStage = 'loading' | 'form' | 'success' | 'error';
type AppData = { email?: string; error?: string };

const config = {
  initial: 'loading' as const,
  stages: [
    {
      name: 'loading',
      transitions: [{ target: 'form', event: 'ready' }]
    },
    {
      name: 'form',
      transitions: [
        { target: 'success', event: 'submit' },
        { target: 'error', event: 'fail' }
      ]
    },
    {
      name: 'success',
      transitions: [{ target: 'form', event: 'reset' }]
    },
    {
      name: 'error',
      transitions: [{ target: 'form', event: 'retry' }]
    }
  ]
};

function App() {
  const engine = new StageFlowEngine<AppStage, AppData>(config);
  
  return (
    <StageFlowProvider engine={engine}>
      <FormComponent />
    </StageFlowProvider>
  );
}

function FormComponent() {
  const { currentStage, send, data } = useStageFlow<AppStage, AppData>();
  
  const handleSubmit = (email: string) => {
    send('submit', { email });
  };
  
  return (
    <div>
      {currentStage === 'form' && (
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSubmit('user@example.com');
        }}>
          <button type="submit">Submit</button>
        </form>
      )}
      
      {currentStage === 'success' && (
        <div>Success! Email: {data.email}</div>
      )}
    </div>
  );
}
```

## Why Stage Flow?

### **Traditional State Management vs Stage Flow**

| Feature | Redux/Zustand | Stage Flow |
|---------|---------------|------------|
| Type Safety | Manual types | Automatic inference |
| State Transitions | Manual handling | Declarative config |
| Side Effects | Middleware/Thunks | Built-in effects |
| Testing | Complex setup | Built-in utilities |
| React Integration | Manual integration | Native hooks |
| Performance | Manual optimization | Automatic optimization |

### **Real-World Benefits**

1. **Reduced Boilerplate**: Declarative configuration eliminates repetitive state management code
2. **Type Safety**: Catch errors at compile time, not runtime
3. **Better Testing**: Comprehensive testing utilities make your code more reliable
4. **Performance**: Optimized for React with minimal re-renders
5. **Extensibility**: Plugin system allows for easy feature additions
6. **Developer Experience**: Excellent TypeScript support and debugging tools

## Architecture Overview

Stage Flow is built around a core engine that manages state transitions, with optional layers for React integration, plugins, middleware, and testing utilities.

```
┌─────────────────────────────────────────────────────────────┐
│                    Stage Flow Architecture                  │
├─────────────────────────────────────────────────────────────┤
│  React Components (UI Layer)                              │
│  ├── StageRenderer                                        │
│  ├── StageAnimation                                       │
│  └── StageErrorBoundary                                   │
├─────────────────────────────────────────────────────────────┤
│  React Hooks (Integration Layer)                          │
│  ├── useStageFlow                                         │
│  ├── useStageData                                         │
│  └── useStageEffect                                       │
├─────────────────────────────────────────────────────────────┤
│  Core Engine (State Management)                           │
│  ├── StageFlowEngine                                      │
│  ├── Validation                                           │
│  └── Error Recovery                                       │
├─────────────────────────────────────────────────────────────┤
│  Plugin System (Extensibility)                            │
│  ├── Logging Plugin                                       │
│  ├── Persistence Plugin                                   │
│  ├── Analytics Plugin                                     │
│  └── Custom Plugins                                       │
├─────────────────────────────────────────────────────────────┤
│  Middleware System (Processing)                           │
│  ├── Authentication                                       │
│  ├── Validation                                           │
│  ├── Rate Limiting                                        │
│  └── Data Transformation                                  │
├─────────────────────────────────────────────────────────────┤
│  Effects System (Side Effects)                            │
│  ├── Built-in Effects                                     │
│  ├── Custom Effects                                       │
│  └── React Integration                                    │
├─────────────────────────────────────────────────────────────┤
│  Testing Utilities (Quality)                              │
│  ├── Test Engine                                          │
│  ├── Mock Utilities                                       │
│  ├── React Testing                                        │
│  └── Performance Testing                                  │
└─────────────────────────────────────────────────────────────┘
```

## Next Steps

- [Getting Started](/guide/getting-started) - Set up your first Stage Flow project
- [Core Concepts](/guide/core-concepts) - Learn the fundamental concepts
- [Basic Usage](/guide/basic-usage) - See basic usage patterns
- [TypeScript Usage](/guide/typescript-usage) - Advanced TypeScript features
- [React Integration](/react/index) - React-specific features 