---
id: context-api-integration
title: Context API Integration
sidebar_label: Context API Integration
---

# Context API Integration

Integration with React Context API for global state management.

## Overview

This example demonstrates how to integrate Stage Flow with React Context API for global state management and theme switching.

## Key Features to Observe

1. **Global State Management**: Context provides global state while Stage Flow manages flow
2. **Theme Switching**: Stage Flow controls theme state with Context
3. **State Synchronization**: Context and Stage Flow state stay in sync
4. **Real-time Updates**: Immediate UI updates when state changes

## Live Example

```jsx live
// import React, { createContext, useContext, useState } from 'react';
// import { StageFlowEngine } from '@stage-flow/core';
// import { StageFlowProvider, useStageFlow } from '@stage-flow/react';

function ContextApiIntegration() {
  const [engine] = React.useState(
    () =>
      new StageFlowEngine({
        initial: "light",
        stages: [
          {
            name: "light",
            data: { theme: "light" },
            transitions: [
              { target: "dark", event: "switchToDark" },
              { target: "auto", event: "switchToAuto" },
            ],
          },
          {
            name: "dark",
            data: { theme: "dark" },
            transitions: [
              { target: "light", event: "switchToLight" },
              { target: "auto", event: "switchToAuto" },
            ],
          },
          {
            name: "auto",
            data: { theme: "auto" },
            transitions: [
              { target: "light", event: "switchToLight" },
              { target: "dark", event: "switchToDark" },
            ],
          },
        ],
      })
  );

  // Start the engine when component mounts
  React.useEffect(() => {
    engine.start();
  }, [engine]);

  // Theme Context
  const ThemeContext = React.createContext({
    theme: "light",
    switchTheme: () => {},
  });

  function ThemeProvider({ children }) {
    const [theme, setTheme] = React.useState("light");
    
    const switchTheme = (newTheme) => {
      setTheme(newTheme);
    };
    
    return (
      <ThemeContext.Provider value={{ theme, switchTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  function useTheme() {
    return React.useContext(ThemeContext);
  }

  function ThemeSwitcher() {
    const { currentStage, data, send } = useStageFlow(engine);
    const { theme, switchTheme } = useTheme();
    
    const handleThemeChange = (newTheme) => {
      switch (newTheme) {
        case "light":
          send("switchToLight");
          break;
        case "dark":
          send("switchToDark");
          break;
        case "auto":
          send("switchToAuto");
          break;
      }
      switchTheme(newTheme);
    };
    
    return (
      <div style={{ 
        padding: "20px", 
        border: "1px solid #ddd", 
        borderRadius: "8px", 
        maxWidth: "500px",
        backgroundColor: theme === "dark" ? "#333" : "#fff",
        color: theme === "dark" ? "#fff" : "#333"
      }}>
        <h2 style={{ margin: "0 0 20px 0" }}>Theme Switcher</h2>
        
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 15px 0" }}>Current Theme: {currentStage}</h3>
          <p style={{ color: theme === "dark" ? "#ccc" : "#666", marginBottom: "15px" }}>
            Stage Flow Theme: {data.theme} | Context Theme: {theme}
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button 
            onClick={() => handleThemeChange("light")}
            style={{
              padding: "10px 20px",
              backgroundColor: currentStage === "light" ? "#007bff" : "#f8f9fa",
              color: currentStage === "light" ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Light
          </button>
          <button 
            onClick={() => handleThemeChange("dark")}
            style={{
              padding: "10px 20px",
              backgroundColor: currentStage === "dark" ? "#007bff" : "#f8f9fa",
              color: currentStage === "dark" ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Dark
          </button>
          <button 
            onClick={() => handleThemeChange("auto")}
            style={{
              padding: "10px 20px",
              backgroundColor: currentStage === "auto" ? "#007bff" : "#f8f9fa",
              color: currentStage === "auto" ? "white" : "#333",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Auto
          </button>
        </div>
        
        <div style={{ 
          padding: "20px", 
          backgroundColor: theme === "dark" ? "#444" : "#f8f9fa", 
          borderRadius: "4px"
        }}>
          <h4 style={{ margin: "0 0 15px 0" }}>Preview</h4>
          <p style={{ color: theme === "dark" ? "#ccc" : "#666" }}>
            This is how your content will look with the {currentStage} theme.
          </p>
          <div style={{ 
            padding: "15px", 
            backgroundColor: theme === "dark" ? "#555" : "white", 
            borderRadius: "4px",
            border: `1px solid ${theme === "dark" ? "#666" : "#ddd"}`
          }}>
            <h5 style={{ margin: "0 0 10px 0" }}>Sample Content</h5>
            <p style={{ margin: "0 0 10px 0", color: theme === "dark" ? "#ccc" : "#666" }}>
              This is a sample content block that demonstrates the theme styling.
            </p>
            <button 
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Sample Button
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <StageFlowProvider engine={engine}>
        <ThemeSwitcher />
      </StageFlowProvider>
    </ThemeProvider>
  );
}
```

## Code Explanation

### Context Setup

Creating a theme context for global state management:

```javascript
const ThemeContext = React.createContext({
  theme: "light",
  switchTheme: () => {},
});

function ThemeProvider({ children }) {
  const [theme, setTheme] = React.useState("light");
  
  const switchTheme = (newTheme) => {
    setTheme(newTheme);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, switchTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Context Hook

Custom hook to access theme context:

```javascript
function useTheme() {
  return React.useContext(ThemeContext);
}
```

### Theme Integration

Stage Flow controls theme state while Context provides global access:

```javascript
const handleThemeChange = (newTheme) => {
  switch (newTheme) {
    case "light":
      send("switchToLight");
      break;
    case "dark":
      send("switchToDark");
      break;
    case "auto":
      send("switchToAuto");
      break;
  }
  switchTheme(newTheme);
};
```

### Stage Configuration

Each theme corresponds to a stage:

```javascript
const config = {
  initial: "light",
  stages: [
    {
      name: "light",
      data: { theme: "light" },
      transitions: [
        { target: "dark", event: "switchToDark" },
        { target: "auto", event: "switchToAuto" },
      ],
    },
    {
      name: "dark",
      data: { theme: "dark" },
      transitions: [
        { target: "light", event: "switchToLight" },
        { target: "auto", event: "switchToAuto" },
      ],
    },
    // ... other stages
  ],
};
```

## Benefits

1. **Global State**: Context provides global access to theme state
2. **Flow Control**: Stage Flow manages theme transitions
3. **Real-time Updates**: Immediate UI updates when theme changes
4. **Type Safety**: TypeScript support for both Context and Stage Flow

## Related Examples

- **[React Router Integration](./react-router.md)** - Navigation-based state management
- **[Redux Integration](./redux.md)** - State synchronization with Redux
- **[Basic Examples](../basic/basic)** - Simple stage machine examples 